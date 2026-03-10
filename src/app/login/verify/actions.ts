"use server";

import { verifyOTPAndLogin, getPendingOTP, createOTP } from "@/lib/auth";
import { cookies } from "next/headers";

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

  // Set auth cookie
  const cookieStore = await cookies();
  cookieStore.set("auth_token", Buffer.from(JSON.stringify(result.user)).toString("base64"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return {
    success: true,
    user: result.user,
  };
}

export async function resendOTPAction(formData: FormData) {
  const tempToken = formData.get("tempToken") as string;

  if (!tempToken) {
    return { success: false, error: "Invalid session" };
  }

  // Decode temp token
  try {
    const decoded = Buffer.from(tempToken, "base64").toString();
    const [userIdStr] = decoded.split(":");
    const userId = parseInt(userIdStr);

    if (isNaN(userId)) {
      return { success: false, error: "Invalid session" };
    }

    // Check cooldown
    const pendingOTP = await getPendingOTP(userId, "login");
    if (pendingOTP) {
      return { success: false, error: "Please wait before requesting another OTP" };
    }

    // Create new OTP
    const { createOTP } = await import("@/lib/auth");
    await createOTP(userId, "login");

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to resend OTP" };
  }
}
