"use server";

import { verifyCredentials, verifyOTPAndLogin, createOTP, getPendingOTP } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginWithPassword(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  const result = await verifyCredentials(email, password);

  if (!result.success) {
    return result;
  }

  if (result.requiresOTP && result.tempToken) {
    // Store temp token in cookies or redirect to OTP page
    return {
      success: true,
      requiresOTP: true,
      tempToken: result.tempToken,
      email: result.email,
    };
  }

  return { success: false, error: "Authentication failed" };
}

export async function verifyOTP(formData: FormData) {
  const tempToken = formData.get("tempToken") as string;
  const otpCode = formData.get("otpCode") as string;

  if (!tempToken || !otpCode) {
    return { success: false, error: "Invalid request" };
  }

  const result = await verifyOTPAndLogin(tempToken, otpCode);

  if (!result.success) {
    return result;
  }

  // Store user session in cookies or localStorage
  if (result.user) {
    return {
      success: true,
      user: result.user,
    };
  }

  return { success: false, error: "Authentication failed" };
}

export async function resendOTP(formData: FormData) {
  const tempToken = formData.get("tempToken") as string;

  if (!tempToken) {
    return { success: false, error: "Invalid session" };
  }

  try {
    // Decode temp token
    const decoded = Buffer.from(tempToken, "base64").toString();
    const [userIdStr] = decoded.split(":");
    const userId = parseInt(userIdStr);

    if (isNaN(userId)) {
      return { success: false, error: "Invalid session" };
    }

    // Check if there's a recent OTP (60 second cooldown)
    const pendingOTP = await getPendingOTP(userId, "login");
    if (pendingOTP) {
      return { success: false, error: "Please wait before requesting another OTP" };
    }

    // Create new OTP
    await createOTP(userId, "login");

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to resend OTP" };
  }
}
