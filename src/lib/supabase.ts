import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Guard against missing configuration to prevent app crash on web/Vercel
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "[Supabase] Error: Missing environment variables. " +
    "Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
  );
}

// Create Supabase client with safe defaults or valid config
export const supabase = createClient(
  SUPABASE_URL || "https://placeholder-project.supabase.co", 
  SUPABASE_ANON_KEY || "placeholder-key", 
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          caption: string;
          created_at: string;
          like_count: number;
          comment_count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          caption: string;
          created_at?: string;
          like_count?: number;
          comment_count?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string;
          caption?: string;
          created_at?: string;
          like_count?: number;
          comment_count?: number;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          text?: string;
          created_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      saves: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
  };
}
