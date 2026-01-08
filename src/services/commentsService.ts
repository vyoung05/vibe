import { supabase } from "../lib/supabase";

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export const commentsService = {
  // Get comments for a post
  async getComments(postId: string): Promise<{ comments: Comment[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          users:user_id (username)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) {
        return { comments: [], error: error.message };
      }

      const comments: Comment[] = data.map((c: any) => ({
        id: c.id,
        postId: c.post_id,
        userId: c.user_id,
        username: c.users?.username || "Unknown",
        text: c.text,
        createdAt: c.created_at,
      }));

      return { comments, error: null };
    } catch (error) {
      return { comments: [], error: String(error) };
    }
  },

  // Add a comment
  async addComment(postId: string, userId: string, text: string): Promise<{ comment: Comment | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: userId,
          text,
        })
        .select(`
          *,
          users:user_id (username)
        `)
        .single();

      if (error) {
        return { comment: null, error: error.message };
      }

      // Increment comment count
      const { error: updateError } = await supabase.rpc("increment_comments", { post_id: postId });

      if (updateError) {
        // Fallback: update manually
        const { data: post } = await supabase
          .from("posts")
          .select("comment_count")
          .eq("id", postId)
          .single();

        if (post) {
          await supabase
            .from("posts")
            .update({ comment_count: post.comment_count + 1 })
            .eq("id", postId);
        }
      }

      const comment: Comment = {
        id: data.id,
        postId: data.post_id,
        userId: data.user_id,
        username: data.users?.username || "Unknown",
        text: data.text,
        createdAt: data.created_at,
      };

      return { comment, error: null };
    } catch (error) {
      return { comment: null, error: String(error) };
    }
  },

  // Update a comment
  async updateComment(commentId: string, userId: string, text: string): Promise<{ error: string | null }> {
    try {
      // Check if user owns the comment
      const { data: comment, error: checkError } = await supabase
        .from("comments")
        .select("user_id")
        .eq("id", commentId)
        .single();

      if (checkError) {
        return { error: checkError.message };
      }

      if (comment.user_id !== userId) {
        return { error: "You do not have permission to edit this comment" };
      }

      const { error } = await supabase
        .from("comments")
        .update({ text })
        .eq("id", commentId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: String(error) };
    }
  },

  // Delete a comment
  async deleteComment(commentId: string, userId: string, postId: string): Promise<{ error: string | null }> {
    try {
      // Check if user owns the comment
      const { data: comment, error: checkError } = await supabase
        .from("comments")
        .select("user_id")
        .eq("id", commentId)
        .single();

      if (checkError) {
        return { error: checkError.message };
      }

      if (comment.user_id !== userId) {
        return { error: "You do not have permission to delete this comment" };
      }

      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) {
        return { error: error.message };
      }

      // Decrement comment count
      const { error: updateError } = await supabase.rpc("decrement_comments", { post_id: postId });

      if (updateError) {
        // Fallback: update manually
        const { data: post } = await supabase
          .from("posts")
          .select("comment_count")
          .eq("id", postId)
          .single();

        if (post && post.comment_count > 0) {
          await supabase
            .from("posts")
            .update({ comment_count: post.comment_count - 1 })
            .eq("id", postId);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: String(error) };
    }
  },
};
