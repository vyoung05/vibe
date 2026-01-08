import { supabase } from "../lib/supabase";

/**
 * Database cleanup utility to remove fake/test data
 * Keeps only real authenticated users with valid UUID IDs
 */

// Helper function to check if an ID is a valid UUID
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const cleanupFakeUsers = async (): Promise<{
  success: boolean;
  message: string;
  deletedCount?: number;
}> => {
  try {
    console.log("[DatabaseCleanup] Starting cleanup of fake/test users...");

    // Get all users from the database
    const { data: allUsers, error: fetchError } = await supabase
      .from("users")
      .select("id, email, username");

    if (fetchError) {
      console.error("[DatabaseCleanup] Error fetching users:", fetchError.message);
      return {
        success: false,
        message: `Error fetching users: ${fetchError.message}`,
      };
    }

    if (!allUsers || allUsers.length === 0) {
      console.log("[DatabaseCleanup] No users found in database");
      return {
        success: true,
        message: "No users found in database",
        deletedCount: 0,
      };
    }

    // Filter out fake users (non-UUID IDs or test emails)
    const fakeUsers = allUsers.filter((user) => {
      const hasInvalidId = !isValidUUID(user.id);
      const isTestEmail = user.email?.includes("test@") || user.email?.includes("fake@");
      return hasInvalidId || isTestEmail;
    });

    if (fakeUsers.length === 0) {
      console.log("[DatabaseCleanup] No fake users found - database is clean!");
      return {
        success: true,
        message: "Database is already clean - no fake users found",
        deletedCount: 0,
      };
    }

    console.log(`[DatabaseCleanup] Found ${fakeUsers.length} fake users to delete:`, fakeUsers.map(u => u.email));

    // Delete each fake user
    let deletedCount = 0;
    for (const fakeUser of fakeUsers) {
      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", fakeUser.id);

      if (deleteError) {
        console.error(`[DatabaseCleanup] Error deleting user ${fakeUser.email}:`, deleteError.message);
      } else {
        deletedCount++;
        console.log(`[DatabaseCleanup] Deleted fake user: ${fakeUser.email}`);
      }
    }

    console.log(`[DatabaseCleanup] Cleanup complete! Deleted ${deletedCount} fake users`);
    return {
      success: true,
      message: `Successfully deleted ${deletedCount} fake/test users`,
      deletedCount,
    };
  } catch (error) {
    console.error("[DatabaseCleanup] Exception during cleanup:", error);
    return {
      success: false,
      message: `Exception during cleanup: ${String(error)}`,
    };
  }
};

export const cleanupFakeStreamers = async (): Promise<{
  success: boolean;
  message: string;
  deletedCount?: number;
}> => {
  try {
    console.log("[DatabaseCleanup] Starting cleanup of fake/test streamers...");

    // Get all streamers from the database
    const { data: allStreamers, error: fetchError } = await supabase
      .from("streamers")
      .select("id, name, email");

    if (fetchError) {
      console.error("[DatabaseCleanup] Error fetching streamers:", fetchError.message);
      return {
        success: false,
        message: `Error fetching streamers: ${fetchError.message}`,
      };
    }

    if (!allStreamers || allStreamers.length === 0) {
      console.log("[DatabaseCleanup] No streamers found in database");
      return {
        success: true,
        message: "No streamers found in database",
        deletedCount: 0,
      };
    }

    // Filter out fake streamers (non-UUID IDs)
    const fakeStreamers = allStreamers.filter((streamer) => !isValidUUID(streamer.id));

    if (fakeStreamers.length === 0) {
      console.log("[DatabaseCleanup] No fake streamers found - database is clean!");
      return {
        success: true,
        message: "Database is already clean - no fake streamers found",
        deletedCount: 0,
      };
    }

    console.log(`[DatabaseCleanup] Found ${fakeStreamers.length} fake streamers to delete:`, fakeStreamers.map(s => s.name));

    // Delete each fake streamer
    let deletedCount = 0;
    for (const fakeStreamer of fakeStreamers) {
      const { error: deleteError } = await supabase
        .from("streamers")
        .delete()
        .eq("id", fakeStreamer.id);

      if (deleteError) {
        console.error(`[DatabaseCleanup] Error deleting streamer ${fakeStreamer.name}:`, deleteError.message);
      } else {
        deletedCount++;
        console.log(`[DatabaseCleanup] Deleted fake streamer: ${fakeStreamer.name}`);
      }
    }

    console.log(`[DatabaseCleanup] Cleanup complete! Deleted ${deletedCount} fake streamers`);
    return {
      success: true,
      message: `Successfully deleted ${deletedCount} fake/test streamers`,
      deletedCount,
    };
  } catch (error) {
    console.error("[DatabaseCleanup] Exception during cleanup:", error);
    return {
      success: false,
      message: `Exception during cleanup: ${String(error)}`,
    };
  }
};

export const cleanupFakeArtists = async (): Promise<{
  success: boolean;
  message: string;
  deletedCount?: number;
}> => {
  try {
    console.log("[DatabaseCleanup] Starting cleanup of fake/test artists...");

    // Get all artists from the database
    const { data: allArtists, error: fetchError } = await supabase
      .from("artists")
      .select("id, name, stage_name");

    if (fetchError) {
      console.error("[DatabaseCleanup] Error fetching artists:", fetchError.message);
      return {
        success: false,
        message: `Error fetching artists: ${fetchError.message}`,
      };
    }

    if (!allArtists || allArtists.length === 0) {
      console.log("[DatabaseCleanup] No artists found in database");
      return {
        success: true,
        message: "No artists found in database",
        deletedCount: 0,
      };
    }

    // Filter out fake artists (non-UUID IDs)
    const fakeArtists = allArtists.filter((artist) => !isValidUUID(artist.id));

    if (fakeArtists.length === 0) {
      console.log("[DatabaseCleanup] No fake artists found - database is clean!");
      return {
        success: true,
        message: "Database is already clean - no fake artists found",
        deletedCount: 0,
      };
    }

    console.log(`[DatabaseCleanup] Found ${fakeArtists.length} fake artists to delete:`, fakeArtists.map(a => a.stage_name));

    // Delete each fake artist
    let deletedCount = 0;
    for (const fakeArtist of fakeArtists) {
      const { error: deleteError } = await supabase
        .from("artists")
        .delete()
        .eq("id", fakeArtist.id);

      if (deleteError) {
        console.error(`[DatabaseCleanup] Error deleting artist ${fakeArtist.stage_name}:`, deleteError.message);
      } else {
        deletedCount++;
        console.log(`[DatabaseCleanup] Deleted fake artist: ${fakeArtist.stage_name}`);
      }
    }

    console.log(`[DatabaseCleanup] Cleanup complete! Deleted ${deletedCount} fake artists`);
    return {
      success: true,
      message: `Successfully deleted ${deletedCount} fake/test artists`,
      deletedCount,
    };
  } catch (error) {
    console.error("[DatabaseCleanup] Exception during cleanup:", error);
    return {
      success: false,
      message: `Exception during cleanup: ${String(error)}`,
    };
  }
};

export const cleanupAllFakeData = async (): Promise<{
  success: boolean;
  message: string;
  totalDeleted: number;
}> => {
  console.log("[DatabaseCleanup] ============================================");
  console.log("[DatabaseCleanup] Starting complete database cleanup...");
  console.log("[DatabaseCleanup] ============================================");

  let totalDeleted = 0;

  // Cleanup users
  const usersResult = await cleanupFakeUsers();
  if (usersResult.deletedCount) totalDeleted += usersResult.deletedCount;

  // Cleanup streamers
  const streamersResult = await cleanupFakeStreamers();
  if (streamersResult.deletedCount) totalDeleted += streamersResult.deletedCount;

  // Cleanup artists
  const artistsResult = await cleanupFakeArtists();
  if (artistsResult.deletedCount) totalDeleted += artistsResult.deletedCount;

  console.log("[DatabaseCleanup] ============================================");
  console.log(`[DatabaseCleanup] Cleanup complete! Total deleted: ${totalDeleted}`);
  console.log("[DatabaseCleanup] ============================================");

  return {
    success: true,
    message: `Database cleanup complete! Deleted ${totalDeleted} fake entries (${usersResult.deletedCount || 0} users, ${streamersResult.deletedCount || 0} streamers, ${artistsResult.deletedCount || 0} artists)`,
    totalDeleted,
  };
};
