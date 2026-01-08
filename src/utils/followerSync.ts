import { supabase } from "../lib/supabase";

/**
 * Sync follower actions with Supabase database
 * These functions ensure follower relationships persist across app restarts
 */

// Helper function to check if an ID is a valid UUID
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const syncFollowStreamer = async (userId: string, streamerId: string): Promise<boolean> => {
  // Skip sync for sample data (non-UUID IDs)
  if (!isValidUUID(userId) || !isValidUUID(streamerId)) {
    console.log("[FollowerSync] Skipping sync for sample data");
    return true;
  }

  try {
    const { error } = await supabase
      .from("streamer_followers")
      .insert({
        follower_id: userId,
        streamer_id: streamerId,
      });

    if (error) {
      // Ignore duplicate errors (already following)
      if (error.code === "23505") return true;
      console.error("[FollowerSync] Error following streamer:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[FollowerSync] Exception following streamer:", error);
    return false;
  }
};

export const syncUnfollowStreamer = async (userId: string, streamerId: string): Promise<boolean> => {
  // Skip sync for sample data (non-UUID IDs)
  if (!isValidUUID(userId) || !isValidUUID(streamerId)) {
    console.log("[FollowerSync] Skipping sync for sample data");
    return true;
  }

  try {
    const { error } = await supabase
      .from("streamer_followers")
      .delete()
      .eq("follower_id", userId)
      .eq("streamer_id", streamerId);

    if (error) {
      console.error("[FollowerSync] Error unfollowing streamer:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[FollowerSync] Exception unfollowing streamer:", error);
    return false;
  }
};

export const syncFollowUser = async (followerId: string, targetUserId: string): Promise<boolean> => {
  // Skip sync for sample data (non-UUID IDs)
  if (!isValidUUID(followerId) || !isValidUUID(targetUserId)) {
    console.log("[FollowerSync] Skipping sync for sample data");
    return true;
  }

  try {
    const { error } = await supabase
      .from("user_relationships")
      .insert({
        follower_id: followerId,
        following_id: targetUserId,
      });

    if (error) {
      // Ignore duplicate errors (already following)
      if (error.code === "23505") return true;
      console.error("[FollowerSync] Error following user:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[FollowerSync] Exception following user:", error);
    return false;
  }
};

export const syncUnfollowUser = async (followerId: string, targetUserId: string): Promise<boolean> => {
  // Skip sync for sample data (non-UUID IDs)
  if (!isValidUUID(followerId) || !isValidUUID(targetUserId)) {
    console.log("[FollowerSync] Skipping sync for sample data");
    return true;
  }

  try {
    const { error } = await supabase
      .from("user_relationships")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", targetUserId);

    if (error) {
      console.error("[FollowerSync] Error unfollowing user:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[FollowerSync] Exception unfollowing user:", error);
    return false;
  }
};

export const syncFollowArtist = async (userId: string, artistId: string): Promise<boolean> => {
  // Skip sync for sample data (non-UUID IDs)
  if (!isValidUUID(userId) || !isValidUUID(artistId)) {
    console.log("[FollowerSync] Skipping sync for sample data");
    return true;
  }

  try {
    const { error } = await supabase
      .from("artist_followers")
      .insert({
        follower_id: userId,
        artist_id: artistId,
      });

    if (error) {
      // Ignore duplicate errors (already following)
      if (error.code === "23505") return true;
      console.error("[FollowerSync] Error following artist:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[FollowerSync] Exception following artist:", error);
    return false;
  }
};

export const syncUnfollowArtist = async (userId: string, artistId: string): Promise<boolean> => {
  // Skip sync for sample data (non-UUID IDs)
  if (!isValidUUID(userId) || !isValidUUID(artistId)) {
    console.log("[FollowerSync] Skipping sync for sample data");
    return true;
  }

  try {
    const { error } = await supabase
      .from("artist_followers")
      .delete()
      .eq("follower_id", userId)
      .eq("artist_id", artistId);

    if (error) {
      console.error("[FollowerSync] Error unfollowing artist:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[FollowerSync] Exception unfollowing artist:", error);
    return false;
  }
};
