"use server";

import { loginToBackend, verifyOTPOnBackend, resendOTPOnBackend } from "@/lib/api";
import { cookies } from "next/headers";

export async function loginWithPassword(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  // Call Flask backend API for login
  const result = await loginToBackend(email, password);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Check if OTP is required
  if (result.requires_otp && result.temp_token) {
    // Store temp token and redirect to OTP page
    return {
      success: true,
      requiresOTP: true,
      tempToken: result.temp_token,
      email: email,
    };
  }

  // Login succeeded without OTP - treat as successful login
  // Store user info in session (since Flask doesn't return a token, we use email as identifier)
  const cookieStore = await cookies();
  cookieStore.set(
    "auth_token",
    Buffer.from(JSON.stringify({ email, role: "user" })).toString("base64"),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    }
  );

  return { success: true, email: email };
}

export async function verifyOTP(formData: FormData) {
  const tempToken = formData.get("tempToken") as string;
  const otpCode = formData.get("otpCode") as string;

  if (!tempToken || !otpCode) {
    return { success: false, error: "Invalid request" };
  }

  // Call Flask backend API for OTP verification
  const result = await verifyOTPOnBackend(tempToken, otpCode);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Store user session in cookies
  if (result.user) {
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

  return { success: false, error: "Authentication failed" };
}

export async function resendOTP(formData: FormData) {
  const tempToken = formData.get("tempToken") as string;

  if (!tempToken) {
    return { success: false, error: "Invalid session" };
  }

  // Call Flask backend API to resend OTP
  const result = await resendOTPOnBackend(tempToken);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
}
