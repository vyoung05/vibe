import { supabase } from "../lib/supabase";
import type { Post, Comment, PostUser } from "../types/post";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";

// Helper to get file extension
const getFileExtension = (uri: string): string => {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1].toLowerCase() : "jpg";
};

// Helper to get MIME type
const getMimeType = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    mp4: "video/mp4",
    mov: "video/quicktime",
  };
  return mimeTypes[extension] || "application/octet-stream";
};

// Upload media to Supabase Storage
export async function uploadPostMedia(
  uri: string,
  userId: string,
  mediaType: "image" | "video"
): Promise<string | null> {
  try {
    const extension = getFileExtension(uri);
    const fileName = `${userId}/${Date.now()}.${extension}`;
    const mimeType = getMimeType(extension);

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Upload to Storage
    const { data, error } = await supabase.storage
      .from("posts")
      .upload(fileName, decode(base64), {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error("[PostsService] Upload error:", error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("posts")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    console.error("[PostsService] Upload exception:", err);
    return null;
  }
}

// Create a new post
export async function createPost(
  userId: string,
  username: string,
  userAvatar: string | null,
  imageUrl: string,
  caption: string,
  videoUrl?: string,
  mediaType?: "image" | "video"
): Promise<Post | null> {
  try {
    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        user_username: username,
        user_avatar: userAvatar,
        image_url: imageUrl,
        video_url: videoUrl || null,
        media_type: mediaType || "image",
        caption: caption,
      })
      .select()
      .single();

    if (error) {
      console.error("[PostsService] Create post error:", error);
      return null;
    }

    // Convert to Post type
    return mapDatabasePostToPost(data, userId);
  } catch (err) {
    console.error("[PostsService] Create post exception:", err);
    return null;
  }
}

// Fetch all posts (feed)
export async function fetchPosts(currentUserId?: string): Promise<Post[]> {
  try {
    // Fetch posts ordered by newest first
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[PostsService] Fetch posts error:", error);
      return [];
    }

    if (!posts || posts.length === 0) {
      return [];
    }

    // If user is logged in, fetch their likes and saves
    let userLikes: string[] = [];
    let userSaves: string[] = [];

    if (currentUserId) {
      const [likesResult, savesResult] = await Promise.all([
        supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", currentUserId),
        supabase
          .from("post_saves")
          .select("post_id")
          .eq("user_id", currentUserId),
      ]);

      userLikes = likesResult.data?.map((l) => l.post_id) || [];
      userSaves = savesResult.data?.map((s) => s.post_id) || [];
    }

    // Map to Post type
    return posts.map((post) => mapDatabasePostToPost(post, currentUserId, userLikes, userSaves));
  } catch (err) {
    console.error("[PostsService] Fetch posts exception:", err);
    return [];
  }
}

// Fetch a single post by ID
export async function fetchPost(postId: string, currentUserId?: string): Promise<Post | null> {
  try {
    const { data: post, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (error || !post) {
      console.error("[PostsService] Fetch post error:", error);
      return null;
    }

    // Check if user liked/saved
    let isLiked = false;
    let isSaved = false;

    if (currentUserId) {
      const [likeResult, saveResult] = await Promise.all([
        supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", currentUserId)
          .single(),
        supabase
          .from("post_saves")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", currentUserId)
          .single(),
      ]);

      isLiked = !!likeResult.data;
      isSaved = !!saveResult.data;
    }

    // Fetch comments
    const { data: comments } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    return mapDatabasePostToPost(
      post,
      currentUserId,
      isLiked ? [postId] : [],
      isSaved ? [postId] : [],
      comments || []
    );
  } catch (err) {
    console.error("[PostsService] Fetch post exception:", err);
    return null;
  }
}

// Like/unlike a post
export async function toggleLike(postId: string, userId: string): Promise<boolean> {
  try {
    // Check if already liked
    const { data: existing } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      // Unlike
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      // Decrement count
      await supabase.rpc("decrement_like_count", { post_id: postId });
      return false; // Not liked anymore
    } else {
      // Like
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: userId,
      });

      // Increment count
      await supabase.rpc("increment_like_count", { post_id: postId });
      return true; // Now liked
    }
  } catch (err) {
    console.error("[PostsService] Toggle like exception:", err);
    return false;
  }
}

// Save/unsave a post
export async function toggleSave(postId: string, userId: string): Promise<boolean> {
  try {
    // Check if already saved
    const { data: existing } = await supabase
      .from("post_saves")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      // Unsave
      await supabase
        .from("post_saves")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      return false; // Not saved anymore
    } else {
      // Save
      await supabase.from("post_saves").insert({
        post_id: postId,
        user_id: userId,
      });
      return true; // Now saved
    }
  } catch (err) {
    console.error("[PostsService] Toggle save exception:", err);
    return false;
  }
}

// Add a comment to a post
export async function addComment(
  postId: string,
  userId: string,
  username: string,
  avatarUrl: string | null,
  text: string
): Promise<Comment | null> {
  try {
    const { data, error } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        user_id: userId,
        username: username,
        avatar_url: avatarUrl,
        text: text,
      })
      .select()
      .single();

    if (error) {
      console.error("[PostsService] Add comment error:", error);
      return null;
    }

    // Increment comment count
    await supabase.rpc("increment_comment_count", { post_id: postId });

    return {
      id: data.id,
      username: data.username,
      avatarUrl: data.avatar_url,
      text: data.text,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error("[PostsService] Add comment exception:", err);
    return null;
  }
}

// Fetch posts by a specific user
export async function fetchUserPosts(userId: string, currentUserId?: string): Promise<Post[]> {
  try {
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PostsService] Fetch user posts error:", error);
      return [];
    }

    if (!posts || posts.length === 0) {
      return [];
    }

    // If current user is logged in, fetch their likes and saves
    let userLikes: string[] = [];
    let userSaves: string[] = [];

    if (currentUserId) {
      const [likesResult, savesResult] = await Promise.all([
        supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", currentUserId),
        supabase
          .from("post_saves")
          .select("post_id")
          .eq("user_id", currentUserId),
      ]);

      userLikes = likesResult.data?.map((l) => l.post_id) || [];
      userSaves = savesResult.data?.map((s) => s.post_id) || [];
    }

    return posts.map((post) => mapDatabasePostToPost(post, currentUserId, userLikes, userSaves));
  } catch (err) {
    console.error("[PostsService] Fetch user posts exception:", err);
    return [];
  }
}

// Delete a post
export async function deletePost(postId: string, userId: string): Promise<boolean> {
  try {
    // First verify the user owns this post
    const { data: post } = await supabase
      .from("posts")
      .select("user_id, image_url")
      .eq("id", postId)
      .single();

    if (!post || post.user_id !== userId) {
      console.error("[PostsService] Cannot delete: not owner");
      return false;
    }

    // Delete from database (cascade will handle likes/saves/comments)
    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
      console.error("[PostsService] Delete post error:", error);
      return false;
    }

    // Try to delete from storage (extract path from URL)
    try {
      const url = new URL(post.image_url);
      const pathParts = url.pathname.split("/storage/v1/object/public/posts/");
      if (pathParts[1]) {
        await supabase.storage.from("posts").remove([pathParts[1]]);
      }
    } catch (e) {
      // Ignore storage deletion errors
    }

    return true;
  } catch (err) {
    console.error("[PostsService] Delete post exception:", err);
    return false;
  }
}

// Helper to map database row to Post type
function mapDatabasePostToPost(
  dbPost: any,
  currentUserId?: string,
  userLikes: string[] = [],
  userSaves: string[] = [],
  comments: any[] = []
): Post {
  const postUser: PostUser = {
    id: dbPost.user_id,
    username: dbPost.user_username || "Unknown",
    avatarUrl: dbPost.user_avatar || `https://i.pravatar.cc/150?u=${dbPost.user_id}`,
    isVerified: false,
    isArtist: false,
  };

  return {
    id: dbPost.id,
    user: postUser,
    imageUrl: dbPost.image_url,
    videoUrl: dbPost.video_url || undefined,
    mediaType: dbPost.media_type || "image",
    caption: dbPost.caption || "",
    createdAt: dbPost.created_at,
    likeCount: dbPost.like_count || 0,
    commentCount: dbPost.comment_count || 0,
    isLiked: userLikes.includes(dbPost.id),
    isSaved: userSaves.includes(dbPost.id),
    comments: comments.map((c) => ({
      id: c.id,
      username: c.username,
      avatarUrl: c.avatar_url,
      text: c.text,
      createdAt: c.created_at,
    })),
    likedBy: [],
    savedBy: [],
  };
}
