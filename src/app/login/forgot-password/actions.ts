"use server";

import { db } from "@/db";
import { users, otpCodes } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { createOTP } from "@/lib/auth";

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { success: false, error: "Email is required" };
  }

  // Check if user exists
  const userRecords = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userRecords.length === 0) {
    // Don't reveal whether email exists
    return { success: true, message: "If the email exists, a reset code has been sent" };
  }

  const user = userRecords[0];

  // Check if account is active
  if (!user.isActive) {
    return { success: true, message: "If the email exists, a reset code has been sent" };
  }

  // Create password reset OTP
  const otpCode = await createOTP(user.id, "password_reset");

  // In production, send via email
  console.log(`Password reset OTP for ${email}: ${otpCode}`);

  return {
    success: true,
    message: "If the email exists, a reset code has been sent",
    email: email,
  };
}
