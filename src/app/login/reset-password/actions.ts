"use server";

import { db } from "@/db";
import { users, otpCodes } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { verifyOTP, hashPassword, validatePasswordStrength } from "@/lib/auth";

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;
  const otpCode = formData.get("otpCode") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !otpCode || !newPassword || !confirmPassword) {
    return { success: false, error: "All fields are required" };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }

  // Validate password strength
  const validation = validatePasswordStrength(newPassword);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(", ") };
  }

  // Find user
  const userRecords = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userRecords.length === 0) {
    return { success: false, error: "Invalid request" };
  }

  const user = userRecords[0];

  // Verify OTP
  const otpResult = await verifyOTP(user.id, otpCode, "password_reset");
  if (!otpResult.valid) {
    return { success: false, error: otpResult.error || "Invalid or expired code" };
  }

  // Update password
  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({
    passwordHash,
    loginAttempts: 0,
    lockedUntil: null,
  }).where(eq(users.id, user.id));

  return { success: true };
}
