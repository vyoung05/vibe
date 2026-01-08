import { supabase } from "../lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
}

export const authService = {
  // Sign up a new user
  async signUp(email: string, password: string, username: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: "Failed to create user" };
      }

      // Create user profile in database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email,
          username,
          avatar_url: null,
        })
        .select()
        .single();

      if (userError) {
        return { user: null, error: userError.message };
      }

      return {
        user: {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          avatarUrl: userData.avatar_url,
          createdAt: userData.created_at,
        },
        error: null,
      };
    } catch (error) {
      return { user: null, error: String(error) };
    }
  },

  // Sign in existing user
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: "Failed to sign in" };
      }

      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (userError) {
        return { user: null, error: userError.message };
      }

      return {
        user: {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          avatarUrl: userData.avatar_url,
          createdAt: userData.created_at,
        },
        error: null,
      };
    } catch (error) {
      return { user: null, error: String(error) };
    }
  },

  // Sign out
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (error) {
      return { error: String(error) };
    }
  },

  // Get current session
  async getSession(): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        return { user: null, error: sessionError.message };
      }

      if (!session) {
        return { user: null, error: null };
      }

      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (userError) {
        return { user: null, error: userError.message };
      }

      return {
        user: {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          avatarUrl: userData.avatar_url,
          createdAt: userData.created_at,
        },
        error: null,
      };
    } catch (error) {
      return { user: null, error: String(error) };
    }
  },

  // Update user profile
  async updateProfile(userId: string, updates: { username?: string; avatarUrl?: string }): Promise<{ error: string | null }> {
    try {
      const updateData: any = {};
      if (updates.username !== undefined) updateData.username = updates.username;
      if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: String(error) };
    }
  },
};
