import type { User, AdminPermissions } from "../types";

// Default permissions for different roles
export const DEFAULT_PERMISSIONS: Record<string, AdminPermissions> = {
  admin: {
    // Full permissions for super admin
    viewUsers: true,
    editUsers: true,
    suspendUsers: true,
    deleteUsers: true,
    verifyUsers: true,
    viewStreamers: true,
    createStreamers: true,
    editStreamers: true,
    deleteStreamers: true,
    viewArtists: true,
    createArtists: true,
    editArtists: true,
    deleteArtists: true,
    manageTracks: true,
    viewContent: true,
    deleteContent: true,
    moderateContent: true,
    viewReports: true,
    reviewReports: true,
    takeAction: true,
    createAnnouncements: true,
    manageAdmins: true,
    viewAnalytics: true,
    systemSettings: true,
    viewMerchants: true,
    manageMerchants: true,
    viewOrders: true,
    manageOrders: true,
  },
  moderator: {
    // Moderator has limited content management permissions
    viewUsers: true,
    editUsers: false,
    suspendUsers: true,
    deleteUsers: false,
    verifyUsers: false,
    viewStreamers: true,
    createStreamers: false,
    editStreamers: false,
    deleteStreamers: false,
    viewArtists: true,
    createArtists: false,
    editArtists: false,
    deleteArtists: false,
    manageTracks: false,
    viewContent: true,
    deleteContent: true,
    moderateContent: true,
    viewReports: true,
    reviewReports: true,
    takeAction: false,
    createAnnouncements: false,
    manageAdmins: false,
    viewAnalytics: false,
    systemSettings: false,
    viewMerchants: true,
    manageMerchants: false,
    viewOrders: true,
    manageOrders: false,
  },
  support: {
    // Support has view-only permissions and can assist users
    viewUsers: true,
    editUsers: false,
    suspendUsers: false,
    deleteUsers: false,
    verifyUsers: false,
    viewStreamers: true,
    createStreamers: false,
    editStreamers: false,
    deleteStreamers: false,
    viewArtists: true,
    createArtists: false,
    editArtists: false,
    deleteArtists: false,
    manageTracks: false,
    viewContent: true,
    deleteContent: false,
    moderateContent: false,
    viewReports: true,
    reviewReports: false,
    takeAction: false,
    createAnnouncements: false,
    manageAdmins: false,
    viewAnalytics: false,
    systemSettings: false,
    viewMerchants: true,
    manageMerchants: false,
    viewOrders: true,
    manageOrders: false,
  },
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (user: User | null, permission: keyof AdminPermissions): boolean => {
  if (!user) return false;

  // Regular users have no admin permissions
  if (user.role === "user") return false;

  // If user has custom permissions, check those
  if (user.permissions) {
    return user.permissions[permission] === true;
  }

  // Fall back to default role permissions
  if (user.role && DEFAULT_PERMISSIONS[user.role]) {
    return DEFAULT_PERMISSIONS[user.role][permission] === true;
  }

  return false;
};

/**
 * Check if user has ANY admin/moderator access
 */
export const hasAdminAccess = (user: User | null): boolean => {
  if (!user) return false;
  return user.role === "admin" || user.role === "moderator" || user.role === "support";
};

/**
 * Check if user is super admin (has manageAdmins permission)
 */
export const isSuperAdmin = (user: User | null): boolean => {
  return hasPermission(user, "manageAdmins");
};

/**
 * Get user's effective permissions (custom or default based on role)
 */
export const getEffectivePermissions = (user: User | null): AdminPermissions => {
  if (!user || user.role === "user") {
    return {};
  }

  if (user.permissions) {
    return user.permissions;
  }

  if (user.role && DEFAULT_PERMISSIONS[user.role]) {
    return DEFAULT_PERMISSIONS[user.role];
  }

  return {};
};

/**
 * Get readable permission name
 */
export const getPermissionLabel = (permission: keyof AdminPermissions): string => {
  const labels: Record<keyof AdminPermissions, string> = {
    viewUsers: "View Users",
    editUsers: "Edit Users",
    suspendUsers: "Suspend Users",
    deleteUsers: "Delete Users",
    verifyUsers: "Verify Users",
    viewStreamers: "View Streamers",
    createStreamers: "Create Streamers",
    editStreamers: "Edit Streamers",
    deleteStreamers: "Delete Streamers",
    viewArtists: "View Artists",
    createArtists: "Create Artists",
    editArtists: "Edit Artists",
    deleteArtists: "Delete Artists",
    manageTracks: "Manage Tracks",
    viewContent: "View Content",
    deleteContent: "Delete Content",
    moderateContent: "Moderate Content",
    viewReports: "View Reports",
    reviewReports: "Review Reports",
    takeAction: "Take Action on Reports",
    createAnnouncements: "Create Announcements",
    manageAdmins: "Manage Admins",
    viewAnalytics: "View Analytics",
    systemSettings: "System Settings",
    viewMerchants: "View Merchants",
    manageMerchants: "Manage Merchants",
    viewOrders: "View Orders",
    manageOrders: "Manage Orders",
  };

  return labels[permission] || permission;
};

/**
 * Get permission category
 */
export const getPermissionCategory = (permission: keyof AdminPermissions): string => {
  if (permission.includes("User")) return "User Management";
  if (permission.includes("Streamer")) return "Streamer Management";
  if (permission.includes("Artist") || permission.includes("Track")) return "Artist Management";
  if (permission.includes("Content") || permission.includes("moderate")) return "Content Management";
  if (permission.includes("Report") || permission.includes("Action")) return "Reports & Moderation";
  if (permission.includes("Merchant") || permission.includes("Order")) return "Merchant Management";
  return "System Management";
};
