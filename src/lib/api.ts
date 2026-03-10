// Safe fetch helper for admin dashboard
// Uses Flask backend on Render instead of direct database access

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://ml-file-for-url.onrender.com";

// ============== AUTHENTICATION TYPES ==============

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  requires_otp?: boolean;
  temp_token?: string;
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export interface VerifyOTPRequest {
  temp_token: string;
  otp_code: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export interface ResendOTPResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ============== AUTHENTICATION FUNCTIONS ==============

// Login via Flask backend
// Calls: POST ${API_BASE_URL}/login
// Request: { "email": "...", "password": "..." }
// Response: { "success": true, "requires_otp": true, "temp_token": "..." } or { "error": "Invalid credentials" }
export async function loginToBackend(
  email: string,
  password: string
): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || "Login failed",
      };
    }

    return {
      success: data.success ?? true,
      requires_otp: data.requires_otp ?? false,
      temp_token: data.temp_token,
      message: data.message,
    };
  } catch (error) {
    console.error("[API] Login error:", error);
    return {
      success: false,
      error: "Failed to connect to backend. Please try again.",
    };
  }
}

// Verify OTP via Flask backend
// Calls: POST ${API_BASE_URL}/login/verify
// Request: { "temp_token": "...", "otp_code": "..." }
export async function verifyOTPOnBackend(
  tempToken: string,
  otpCode: string
): Promise<VerifyOTPResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/login/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ temp_token: tempToken, otp_code: otpCode }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || "Verification failed",
      };
    }

    return {
      success: data.success ?? true,
      user: data.user,
      message: data.message,
    };
  } catch (error) {
    console.error("[API] Verify OTP error:", error);
    return {
      success: false,
      error: "Failed to connect to backend. Please try again.",
    };
  }
}

// Resend OTP via Flask backend
// Calls: POST ${API_BASE_URL}/login/resend
// Request: { "temp_token": "..." }
export async function resendOTPOnBackend(
  tempToken: string
): Promise<ResendOTPResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/login/resend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ temp_token: tempToken }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || "Failed to resend OTP",
      };
    }

    return {
      success: data.success ?? true,
      message: data.message,
    };
  } catch (error) {
    console.error("[API] Resend OTP error:", error);
    return {
      success: false,
      error: "Failed to connect to backend. Please try again.",
    };
  }
}

// ============== PASSWORD RESET TYPES ==============

export interface RequestPasswordResetResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ============== PASSWORD RESET FUNCTIONS ==============

// Request password reset via Flask backend
// Calls: POST ${API_BASE_URL}/login/forgot-password
// Request: { "email": "..." }
export async function requestPasswordResetOnBackend(
  email: string
): Promise<RequestPasswordResetResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/login/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || "Failed to request password reset",
      };
    }

    return {
      success: data.success ?? true,
      message: data.message,
    };
  } catch (error) {
    console.error("[API] Request password reset error:", error);
    return {
      success: false,
      error: "Failed to connect to backend. Please try again.",
    };
  }
}

// Reset password via Flask backend
// Calls: POST ${API_BASE_URL}/login/reset-password
// Request: { "email": "...", "otp_code": "...", "new_password": "..." }
export async function resetPasswordOnBackend(
  email: string,
  otpCode: string,
  newPassword: string
): Promise<ResetPasswordResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/login/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp_code: otpCode, new_password: newPassword }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || "Failed to reset password",
      };
    }

    return {
      success: data.success ?? true,
      message: data.message,
    };
  } catch (error) {
    console.error("[API] Reset password error:", error);
    return {
      success: false,
      error: "Failed to connect to backend. Please try again.",
    };
  }
}

// ============== ADMIN TYPES ==============

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active?: boolean;
  created_at?: string;
}

export interface AdminTransaction {
  id: number;
  transaction_id: string;
  amount: number;
  fraud_score: number;
  is_fraud: boolean;
  is_reviewed?: boolean;
  is_escalated?: boolean;
  created_at?: string;
}

export interface AdminLog {
  id: number;
  action: string;
  details: string;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_transactions: number;
  total_logs: number;
  flagged_transactions: number;
}

// Safe fetch helper - returns null on error instead of throwing
export async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const response = await fetch(url, {
      ...options,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      console.error(`[API Error] ${response.status}: ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[API Error] Response: ${errorText}`);
      return null;
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`[API Fetch Error]`, error);
    return null;
  }
}

// Fetch users from backend
export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const data = await safeFetch<{ users: AdminUser[] }>(
    `${API_BASE_URL}/admin/users`
  );
  return data?.users || [];
}

// Fetch transactions from backend
export async function fetchAdminTransactions(): Promise<AdminTransaction[]> {
  const data = await safeFetch<{ transactions: AdminTransaction[] }>(
    `${API_BASE_URL}/admin/transactions`
  );
  return data?.transactions || [];
}

// Fetch admin logs from backend
export async function fetchAdminLogs(): Promise<AdminLog[]> {
  const data = await safeFetch<{ logs: AdminLog[] }>(
    `${API_BASE_URL}/admin/logs`
  );
  return data?.logs || [];
}

// Fetch admin stats from backend
export async function fetchAdminStats(): Promise<AdminStats> {
  const data = await safeFetch<{ stats: AdminStats }>(
    `${API_BASE_URL}/admin/stats`
  );
  return data?.stats || {
    total_users: 0,
    total_transactions: 0,
    total_logs: 0,
    flagged_transactions: 0,
  };
}

// Add new user via backend
export async function addUserToBackend(
  email: string,
  password: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        role,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: errorText || `Failed to create user (${response.status})`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[API] Error adding user:", error);
    return {
      success: false,
      error: "Failed to connect to backend",
    };
  }
}

// Delete user via backend
export async function deleteUserFromBackend(
  userId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: "DELETE",
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to delete user (${response.status})`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[API] Error deleting user:", error);
    return {
      success: false,
      error: "Failed to connect to backend",
    };
  }
}

// Toggle user status via backend
export async function toggleUserStatusBackend(
  userId: number,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_active: isActive }),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to update user status (${response.status})`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[API] Error toggling user status:", error);
    return {
      success: false,
      error: "Failed to connect to backend",
    };
  }
}
