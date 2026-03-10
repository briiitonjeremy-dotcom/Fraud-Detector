// Safe fetch helper for admin dashboard
// Uses Flask backend on Render instead of direct database access

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://ml-file-for-url.onrender.com";

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
