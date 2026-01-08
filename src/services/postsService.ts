import { supabase } from "../lib/supabase";
import type { Post } from "../types/post";

export interface PostWithUser {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string;
  };
  imageUrl: string;
  caption: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
  comments: Array<{
    id: string;
    username: string;
    text: string;
    createdAt: string;
  }>;
}

export const postsService = {
  // Fetch all posts with user data
  async getFeed(currentUserId: string): Promise<{ posts: PostWithUser[]; error: string | null }> {
    try {
      // Fetch posts with user data
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`
          *,
          users:user_id (id, username, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (postsError) {
        return { posts: [], error: postsError.message };
      }

      // Fetch likes for current user
      const { data: likesData } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", currentUserId);

      // Fetch saves for current user
      const { data: savesData } = await supabase
        .from("saves")
        .select("post_id")
        .eq("user_id", currentUserId);

      // Fetch comments for all posts
      const { data: commentsData } = await supabase
        .from("comments")
        .select(`
          *,
          users:user_id (username)
        `)
        .order("created_at", { ascending: true });

      const likedPostIds = new Set(likesData?.map((l) => l.post_id) || []);
      const savedPostIds = new Set(savesData?.map((s) => s.post_id) || []);

      // Group comments by post
      const commentsByPost: Record<string, any[]> = {};
      commentsData?.forEach((comment) => {
        if (!commentsByPost[comment.post_id]) {
          commentsByPost[comment.post_id] = [];
        }
        commentsByPost[comment.post_id].push(comment);
      });

      const posts: PostWithUser[] = postsData.map((post: any) => ({
        id: post.id,
        userId: post.user_id,
        user: {
          id: post.users.id,
          username: post.users.username,
          avatarUrl: post.users.avatar_url || "https://i.pravatar.cc/150?img=50",
        },
        imageUrl: post.image_url,
        caption: post.caption,
        createdAt: post.created_at,
        likeCount: post.like_count,
        commentCount: post.comment_count,
        isLiked: likedPostIds.has(post.id),
        isSaved: savedPostIds.has(post.id),
        comments: (commentsByPost[post.id] || []).map((c: any) => ({
          id: c.id,
          username: c.users?.username || "Unknown",
          text: c.text,
          createdAt: c.created_at,
        })),
      }));

      return { posts, error: null };
    } catch (error) {
      return { posts: [], error: String(error) };
    }
  },

  // Create a new post
  async createPost(userId: string, imageUrl: string, caption: string): Promise<{ post: PostWithUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          image_url: imageUrl,
          caption,
          like_count: 0,
          comment_count: 0,
        })
        .select(`
          *,
          users:user_id (id, username, avatar_url)
        `)
        .single();

      if (error) {
        return { post: null, error: error.message };
      }

      const post: PostWithUser = {
        id: data.id,
        userId: data.user_id,
        user: {
          id: data.users.id,
          username: data.users.username,
          avatarUrl: data.users.avatar_url || "https://i.pravatar.cc/150?img=50",
        },
        imageUrl: data.image_url,
        caption: data.caption,
        createdAt: data.created_at,
        likeCount: data.like_count,
        commentCount: data.comment_count,
        isLiked: false,
        isSaved: false,
        comments: [],
      };

      return { post, error: null };
    } catch (error) {
      return { post: null, error: String(error) };
    }
  },

  // Update a post
  async updatePost(postId: string, userId: string, updates: { caption?: string; imageUrl?: string }): Promise<{ error: string | null }> {
    try {
      // Check if user owns the post
      const { data: post, error: checkError } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", postId)
        .single();

      if (checkError) {
        return { error: checkError.message };
      }

      if (post.user_id !== userId) {
        return { error: "You do not have permission to edit this post" };
      }

      const updateData: any = {};
      if (updates.caption !== undefined) updateData.caption = updates.caption;
      if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;

      const { error } = await supabase
        .from("posts")
        .update(updateData)
        .eq("id", postId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: String(error) };
    }
  },

  // Delete a post
  async deletePost(postId: string, userId: string): Promise<{ error: string | null }> {
    try {
      // Check if user owns the post
      const { data: post, error: checkError } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", postId)
        .single();

      if (checkError) {
        return { error: checkError.message };
      }

      if (post.user_id !== userId) {
        return { error: "You do not have permission to delete this post" };
      }

      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: String(error) };
    }
  },

  // Like a post
  async likePost(postId: string, userId: string): Promise<{ error: string | null }> {
    try {
      // Insert like
      const { error: likeError } = await supabase
        .from("likes")
        .insert({ post_id: postId, user_id: userId });

      if (likeError) {
        return { error: likeError.message };
      }

      // Increment like count
      const { error: updateError } = await supabase.rpc("increment_likes", { post_id: postId });

      if (updateError) {
        // Fallback: update manually
        const { data: post } = await supabase
          .from("posts")
          .select("like_count")
          .eq("id", postId)
          .single();

        if (post) {
          await supabase
            .from("posts")
            .update({ like_count: post.like_count + 1 })
            .eq("id", postId);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: String(error) };
    }
  },

  // Unlike a post
  async unlikePost(postId: string, userId: string): Promise<{ error: string | null }> {
    try {
      // Delete like
      const { error: likeError } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (likeError) {
        return { error: likeError.message };
      }

      // Decrement like count
      const { error: updateError } = await supabase.rpc("decrement_likes", { post_id: postId });

      if (updateError) {
        // Fallback: update manually
        const { data: post } = await supabase
          .from("posts")
          .select("like_count")
          .eq("id", postId)
          .single();

        if (post && post.like_count > 0) {
          await supabase
            .from("posts")
            .update({ like_count: post.like_count - 1 })
            .eq("id", postId);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: String(error) };
    }
  },

  // Save a post
  async savePost(postId: string, userId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from("saves")
        .insert({ post_id: postId, user_id: userId });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: String(error) };
    }
  },

  // Unsave a post
  async unsavePost(postId: string, userId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from("saves")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: String(error) };
    }
  },
};
