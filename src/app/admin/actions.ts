"use server";

import { db } from "@/db";
import { users, transactions, adminLogs, datasets } from "@/db/schema";
import { eq, desc, gte, sql, and } from "drizzle-orm";
import { createUser, resetUserPassword, hashPassword } from "@/lib/auth";

// Seed initial admin user if none exists
export async function seedAdminUser() {
  try {
    const existingAdmins = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    if (existingAdmins.length > 0) {
      return { success: true, message: "Admin already exists" };
    }

    // Create admin user with hashed password
    const adminPassword = "Admin@123";
    const passwordHash = await hashPassword(adminPassword);

    const result = await db.insert(users).values({
      email: "admin@fraudguard.ai",
      name: "System Admin",
      role: "admin",
      passwordHash,
      isActive: true,
      loginAttempts: 0,
    }).returning();

    await logAdminAction(result[0].id, "SEED_ADMIN", "Initial admin user created", "user", String(result[0].id));

    return {
      success: true,
      message: "Admin user created",
      credentials: {
        email: "admin@fraudguard.ai",
        password: adminPassword,
      },
    };
  } catch (error) {
    console.error("Error seeding admin:", error);
    return { success: false, error: String(error) };
  }
}

// Get all users
export async function getUsers() {
  try {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

// Add a new user (admin only with password hashing)
export async function addUser(email: string, name: string, role: string, adminId: number) {
  try {
    const result = await createUser(email, name, role, adminId);
    
    if (result.success) {
      await logAdminAction(adminId, "ADD_USER", `Added user: ${email} with role: ${role}`, "user", String(result.user?.id));
    }
    
    return result;
  } catch (error) {
    console.error("Error adding user:", error);
    return { success: false, error: String(error) };
  }
}

// Reset user password (admin only)
export async function resetPassword(userId: number, adminId: number) {
  try {
    const result = await resetUserPassword(userId, adminId);
    
    if (result.success) {
      await logAdminAction(adminId, "RESET_PASSWORD", `Reset password for user ${userId}`, "user", String(userId));
    }
    
    return result;
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: String(error) };
  }
}

// Update user role
export async function updateUserRole(userId: number, newRole: string, adminId: number = 1) {
  try {
    await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
    await logAdminAction(adminId, "UPDATE_USER_ROLE", `Updated user ${userId} role to: ${newRole}`, "user", String(userId));
    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, error: String(error) };
  }
}

// Toggle user active status
export async function toggleUserStatus(userId: number, isActive: boolean, adminId: number = 1) {
  try {
    await db.update(users).set({ isActive }).where(eq(users.id, userId));
    await logAdminAction(adminId, isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER", `User ${userId} ${isActive ? 'activated' : 'deactivated'}`, "user", String(userId));
    return { success: true };
  } catch (error) {
    console.error("Error toggling user status:", error);
    return { success: false, error: String(error) };
  }
}

// Delete user
export async function deleteUser(userId: number, adminId: number = 1) {
  try {
    await db.delete(users).where(eq(users.id, userId));
    await logAdminAction(adminId, "DELETE_USER", `Deleted user: ${userId}`, "user", String(userId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: String(error) };
  }
}

// Get transactions with optional filter
export async function getTransactions(minFraudScore?: number) {
  try {
    if (minFraudScore !== undefined) {
      return await db.select().from(transactions).where(gte(transactions.fraudScore, minFraudScore)).orderBy(desc(transactions.step)).limit(100);
    }
    return await db.select().from(transactions).orderBy(desc(transactions.step)).limit(100);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

// Mark transaction as reviewed
export async function markTransactionReviewed(transactionId: number, adminId: number = 1) {
  try {
    await db.update(transactions).set({ isReviewed: true }).where(eq(transactions.id, transactionId));
    await logAdminAction(adminId, "MARK_REVIEWED", `Transaction ${transactionId} marked as reviewed`, "transaction", String(transactionId));
    return { success: true };
  } catch (error) {
    console.error("Error marking transaction:", error);
    return { success: false, error: String(error) };
  }
}

// Escalate transaction
export async function escalateTransaction(transactionId: number, adminId: number = 1) {
  try {
    await db.update(transactions).set({ isEscalated: true }).where(eq(transactions.id, transactionId));
    await logAdminAction(adminId, "ESCALATE_TRANSACTION", `Transaction ${transactionId} escalated`, "transaction", String(transactionId));
    return { success: true };
  } catch (error) {
    console.error("Error escalating transaction:", error);
    return { success: false, error: String(error) };
  }
}

// Get admin logs
export async function getAdminLogs(limit: number = 50) {
  try {
    return await db.select().from(adminLogs).orderBy(desc(adminLogs.createdAt)).limit(limit);
  } catch (error) {
    console.error("Error fetching admin logs:", error);
    return [];
  }
}

// Log admin action
export async function logAdminAction(
  adminId: number,
  action: string,
  details: string,
  targetType?: string,
  targetId?: string
) {
  try {
    await db.insert(adminLogs).values({
      adminId,
      action,
      targetType,
      targetId,
      details,
    });
  } catch (error) {
    console.error("Error logging admin action:", error);
  }
}

// Get dashboard stats
export async function getDashboardStats() {
  try {
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    const transactionCount = await db.select({ count: sql<number>`count(*)` }).from(transactions);
    const highRiskCount = await db.select({ count: sql<number>`count(*)` }).from(transactions).where(gte(transactions.fraudScore, 0.7));
    const recentLogs = await db.select().from(adminLogs).orderBy(desc(adminLogs.createdAt)).limit(10);
    
    return {
      userCount: Number(userCount[0]?.count) || 0,
      transactionCount: Number(transactionCount[0]?.count) || 0,
      highRiskCount: Number(highRiskCount[0]?.count) || 0,
      recentLogs,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      userCount: 0,
      transactionCount: 0,
      highRiskCount: 0,
      recentLogs: [],
    };
  }
}

// Get vendor stats for reports
export async function getVendorStats() {
  try {
    const vendors = await db.select().from(transactions).limit(500);
    
    // Group by vendor and calculate avg fraud score
    const vendorMap = new Map();
    vendors.forEach(t => {
      const vendor = t.nameDest || "Unknown";
      const existing = vendorMap.get(vendor) || { count: 0, totalFraud: 0, totalAmount: 0 };
      vendorMap.set(vendor, {
        count: existing.count + 1,
        totalFraud: existing.totalFraud + (t.fraudScore || 0),
        totalAmount: existing.totalAmount + (t.amount || 0),
      });
    });
    
    const result = Array.from(vendorMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      avgFraudScore: data.count > 0 ? data.totalFraud / data.count : 0,
      totalAmount: data.totalAmount,
    })).sort((a, b) => b.avgFraudScore - a.avgFraudScore).slice(0, 10);
    
    return result;
  } catch (error) {
    console.error("Error fetching vendor stats:", error);
    return [];
  }
}

// Delete all data
export async function clearAllData(adminId: number = 1) {
  try {
    await db.delete(adminLogs);
    await db.delete(transactions);
    await db.delete(datasets);
    await logAdminAction(adminId, "CLEAR_DATA", "All data cleared", "system");
    return { success: true };
  } catch (error) {
    console.error("Error clearing data:", error);
    return { success: false, error: String(error) };
  }
}
