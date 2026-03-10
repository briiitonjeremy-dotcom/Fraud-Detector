import { db } from "@/db";
import { users, otpCodes } from "@/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";

// ============== PASSWORD UTILITIES ==============

// Generate a secure random password
export function generateSecurePassword(length: number = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => charset[byte % charset.length]).join("");
}

// Validate password strength
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push("Password must contain at least one special character (!@#$%^&*)");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Simple hash function (in production, use bcrypt)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "fraudguard_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// ============== OTP UTILITIES ==============

// Generate 6-digit OTP
export function generateOTP(): string {
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  // Generate number between 100000 and 999999
  return (100000 + (array[0] * 16777216 + array[1] * 65536 + array[2] * 256 + array[3]) % 900000).toString();
}

// Create OTP for user
export async function createOTP(userId: number, type: "login" | "password_reset" = "login"): Promise<string> {
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  
  await db.insert(otpCodes).values({
    userId,
    code,
    type,
    expiresAt,
    attempts: 0,
  });
  
  return code;
}

// Verify OTP
export async function verifyOTP(userId: number, code: string, type: "login" | "password_reset" = "login"): Promise<{
  valid: boolean;
  error?: string;
}> {
  // Get the latest valid OTP for this user
  const now = new Date();
  const otpRecords = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.userId, userId),
        eq(otpCodes.type, type),
        gt(otpCodes.expiresAt, now),
        sql`${otpCodes.usedAt} IS NULL`
      )
    )
    .orderBy(otpCodes.createdAt)
    .limit(1);
  
  if (otpRecords.length === 0) {
    return { valid: false, error: "No valid OTP found. Please request a new one." };
  }
  
  const otp = otpRecords[0];
  
  // Check attempts
  if (otp.attempts >= 3) {
    return { valid: false, error: "Too many failed attempts. Please request a new OTP." };
  }
  
  // Check if OTP matches
  if (otp.code !== code) {
    await db.update(otpCodes).set({ attempts: otp.attempts + 1 }).where(eq(otpCodes.id, otp.id));
    return { valid: false, error: "Invalid OTP code." };
  }
  
  // Mark OTP as used
  await db.update(otpCodes).set({ usedAt: new Date() }).where(eq(otpCodes.id, otp.id));
  
  return { valid: true };
}

// Get pending OTP for resend cooldown check
export async function getPendingOTP(userId: number, type: "login" | "password_reset" = "login") {
  const now = new Date();
  const otpRecords = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.userId, userId),
        eq(otpCodes.type, type),
        gt(otpCodes.expiresAt, now),
        sql`${otpCodes.usedAt} IS NULL`
      )
    )
    .orderBy(otpCodes.createdAt)
    .limit(1);
  
  return otpRecords[0] || null;
}

// ============== AUTHENTICATION ==============

export type LoginResult = {
  success: boolean;
  error?: string;
  requiresOTP?: boolean;
  userId?: number;
  email?: string;
  tempToken?: string;
};

// Login step 1: Verify email and password
export async function verifyCredentials(email: string, password: string): Promise<LoginResult> {
  // Find user by email
  const userRecords = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  if (userRecords.length === 0) {
    return { success: false, error: "Invalid email or password" };
  }
  
  const user = userRecords[0];
  
  // Check if account is active
  if (!user.isActive) {
    return { success: false, error: "Account is deactivated. Contact admin." };
  }
  
  // Check if account is locked
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const remainingMinutes = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
    return { success: false, error: `Account is locked. Try again in ${remainingMinutes} minutes.` };
  }
  
  // Verify password
  const isValidPassword = await verifyPassword(password, user.passwordHash || "");
  if (!isValidPassword) {
    // Increment failed attempts
    const newAttempts = (user.loginAttempts || 0) + 1;
    let lockedUntil: Date | null = null;
    
    // Lock account after 5 failed attempts
    if (newAttempts >= 5) {
      lockedUntil = new Date(Date.now() * 30 * 60 * 1000); // 30 minutes
    }
    
    await db.update(users).set({
      loginAttempts: newAttempts,
      lockedUntil: lockedUntil,
    }).where(eq(users.id, user.id));
    
    return { success: false, error: "Invalid email or password" };
  }
  
  // Reset failed attempts on successful password
  await db.update(users).set({
    loginAttempts: 0,
    lockedUntil: null,
  }).where(eq(users.id, user.id));
  
  // Generate OTP
  const otpCode = await createOTP(user.id, "login");
  
  // In production, send OTP via email
  console.log(`OTP for ${email}: ${otpCode}`);
  
  return {
    success: true,
    requiresOTP: true,
    userId: user.id,
    email: user.email,
    tempToken: Buffer.from(`${user.id}:${Date.now()}`).toString("base64"),
  };
}

// Login step 2: Verify OTP and complete login
export async function verifyOTPAndLogin(tempToken: string, otpCode: string): Promise<{
  success: boolean;
  error?: string;
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}> {
  try {
    // Decode temp token
    const decoded = Buffer.from(tempToken, "base64").toString();
    const [userIdStr] = decoded.split(":");
    const userId = parseInt(userIdStr);
    
    if (isNaN(userId)) {
      return { success: false, error: "Invalid session" };
    }
    
    // Verify OTP
    const otpResult = await verifyOTP(userId, otpCode, "login");
    if (!otpResult.valid) {
      return { success: false, error: otpResult.error };
    }
    
    // Get user and update last login
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (userRecords.length === 0) {
      return { success: false, error: "User not found" };
    }
    
    const user = userRecords[0];
    
    // Update last login
    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Authentication failed" };
  }
}

// ============== USER MANAGEMENT ==============

export type CreateUserResult = {
  success: boolean;
  error?: string;
  user?: typeof users.$inferSelect;
  tempPassword?: string;
};

// Create user (admin only)
export async function createUser(
  email: string,
  name: string,
  role: string,
  createdBy: number
): Promise<CreateUserResult> {
  // Check if email already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  if (existing.length > 0) {
    return { success: false, error: "Email already exists" };
  }
  
  // Generate temporary password
  const tempPassword = generateSecurePassword();
  const passwordHash = await hashPassword(tempPassword);
  
  try {
    const result = await db.insert(users).values({
      email,
      name,
      role,
      passwordHash,
      isActive: true,
      createdBy,
      loginAttempts: 0,
    }).returning();
    
    return {
      success: true,
      user: result[0],
      tempPassword,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: String(error) };
  }
}

// Reset user password (admin)
export async function resetUserPassword(userId: number, adminId: number): Promise<{
  success: boolean;
  error?: string;
  tempPassword?: string;
}> {
  const newPassword = generateSecurePassword();
  const passwordHash = await hashPassword(newPassword);
  
  try {
    await db.update(users).set({
      passwordHash,
      loginAttempts: 0,
      lockedUntil: null,
    }).where(eq(users.id, userId));
    
    // Log admin action
    await db.insert(otpCodes).values({
      userId: adminId,
      code: `PASSWORD_RESET:${userId}`,
      type: "password_reset",
      expiresAt: new Date(Date.now() + 86400000),
      usedAt: new Date(),
    });
    
    return {
      success: true,
      tempPassword: newPassword,
    };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: String(error) };
  }
}

// Change password (user)
export async function changePassword(userId: number, currentPassword: string, newPassword: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // Verify current password
  const userRecords = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (userRecords.length === 0) {
    return { success: false, error: "User not found" };
  }
  
  const user = userRecords[0];
  const isValid = await verifyPassword(currentPassword, user.passwordHash || "");
  if (!isValid) {
    return { success: false, error: "Current password is incorrect" };
  }
  
  // Validate new password
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.errors.join(", ") };
  }
  
  // Update password
  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({
    passwordHash,
    loginAttempts: 0,
    lockedUntil: null,
  }).where(eq(users.id, userId));
  
  return { success: true };
}
