import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, username: string, tier: "free" | "superfan") => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
  toggleBookmark: (streamerId: string) => void;
  checkSession: () => Promise<void>;
  clearError: () => void;
  clearSuccessMessage: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      successMessage: null,

      clearError: () => set({ error: null }),
      clearSuccessMessage: () => set({ successMessage: null }),

      resetPassword: async (email: string): Promise<boolean> => {
        try {
          set({ isLoading: true, error: null, successMessage: null });
          console.log("[Auth] Requesting password reset for:", email);

          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: "ddns://reset-password",
          });

          if (error) {
            console.error("[Auth] Password reset error object:", JSON.stringify(error, null, 2));
            set({ isLoading: false, error: error.message });
            return false;
          }

          console.log("[Auth] Password reset email sent");
          set({
            isLoading: false,
            successMessage: "Password reset email sent! Check your inbox."
          });
          return true;
        } catch (error) {
          console.log("[Auth] Password reset exception:", error);
          set({ isLoading: false, error: String(error) });
          return false;
        }
      },

      updatePassword: async (password: string): Promise<boolean> => {
        try {
          set({ isLoading: true, error: null, successMessage: null });
          console.log("[Auth] Updating password");

          const { error } = await supabase.auth.updateUser({ password });

          if (error) {
            console.log("[Auth] Update password error:", error.message);
            set({ isLoading: false, error: error.message });
            return false;
          }

          console.log("[Auth] Password updated successfully");
          set({
            isLoading: false,
            successMessage: "Password updated successfully!"
          });
          return true;
        } catch (error) {
          console.log("[Auth] Update password exception:", error);
          set({ isLoading: false, error: String(error) });
          return false;
        }
      },

      checkSession: async () => {
        try {
          set({ isLoading: true });
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.log("[Auth] Session check error:", error.message);
            // If refresh token is invalid, clear auth state and sign out
            if (error.message.includes("Refresh Token") || error.message.includes("Invalid")) {
              console.log("[Auth] Invalid refresh token, clearing auth state");
              await supabase.auth.signOut();
              set({ user: null, isAuthenticated: false, isLoading: false, error: null });
            } else {
              set({ isLoading: false });
            }
            return;
          }

          if (session?.user) {
            // Get user profile from database
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (userData && !userError) {
              // Load follower relationships
              const { data: streamerFollows } = await supabase
                .from("streamer_followers")
                .select("streamer_id")
                .eq("follower_id", session.user.id);

              const { data: artistFollows } = await supabase
                .from("artist_followers")
                .select("artist_id")
                .eq("follower_id", session.user.id);

              const { data: userFollows } = await supabase
                .from("user_relationships")
                .select("following_id")
                .eq("follower_id", session.user.id);

              const { data: userFollowers } = await supabase
                .from("user_relationships")
                .select("follower_id")
                .eq("following_id", session.user.id);

              const user: User = {
                id: userData.id,
                email: userData.email,
                username: userData.username,
                avatar: userData.avatar,
                bio: userData.bio,
                tier: userData.tier || "free",
                role: userData.role || "user",
                permissions: userData.permissions,
                referralCode: userData.referral_code,
                followedStreamers: streamerFollows?.map((f) => f.streamer_id) || [],
                followedArtists: artistFollows?.map((f) => f.artist_id) || [],
                followingUsers: userFollows?.map((f) => f.following_id) || [],
                followers: userFollowers?.map((f) => f.follower_id) || [],
                hasCompletedOnboarding: userData.has_completed_onboarding,
                isVerified: userData.is_verified,
                verificationStatus: userData.verification_status,
                isInfluencer: userData.is_influencer,
                createdAt: userData.created_at,
              };
              set({ user, isAuthenticated: true, isLoading: false });
            } else {
              set({ isLoading: false });
            }
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.log("[Auth] Session check failed:", error);
          set({ isLoading: false });
        }
      },

      signIn: async (email: string, password: string): Promise<boolean> => {
        try {
          set({ isLoading: true, error: null });
          console.log("[Auth] Attempting sign in for:", email);

          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (authError) {
            console.log("[Auth] Sign in error:", authError.message);
            set({ isLoading: false, error: authError.message });
            return false;
          }

          if (!authData.user) {
            console.log("[Auth] No user returned from sign in");
            set({ isLoading: false, error: "Sign in failed" });
            return false;
          }

          console.log("[Auth] Sign in successful, fetching user profile");

          // Get user profile from database
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", authData.user.id)
            .single();

          if (userError) {
            console.log("[Auth] Error fetching user profile:", userError.message);
            set({ isLoading: false, error: userError.message });
            return false;
          }

          // Load follower relationships
          const { data: streamerFollows } = await supabase
            .from("streamer_followers")
            .select("streamer_id")
            .eq("follower_id", authData.user.id);

          const { data: artistFollows } = await supabase
            .from("artist_followers")
            .select("artist_id")
            .eq("follower_id", authData.user.id);

          const { data: userFollows } = await supabase
            .from("user_relationships")
            .select("following_id")
            .eq("follower_id", authData.user.id);

          const { data: userFollowers } = await supabase
            .from("user_relationships")
            .select("follower_id")
            .eq("following_id", authData.user.id);

          const user: User = {
            id: userData.id,
            email: userData.email,
            username: userData.username,
            avatar: userData.avatar,
            bio: userData.bio,
            tier: userData.tier || "free",
            role: userData.role || "user",
            permissions: userData.permissions,
            referralCode: userData.referral_code,
            followedStreamers: streamerFollows?.map((f) => f.streamer_id) || [],
            followedArtists: artistFollows?.map((f) => f.artist_id) || [],
            followingUsers: userFollows?.map((f) => f.following_id) || [],
            followers: userFollowers?.map((f) => f.follower_id) || [],
            hasCompletedOnboarding: userData.has_completed_onboarding,
            isVerified: userData.is_verified,
            verificationStatus: userData.verification_status,
            isInfluencer: userData.is_influencer,
            createdAt: userData.created_at,
          };

          console.log("[Auth] User profile loaded:", user.username);
          set({ user, isAuthenticated: true, isLoading: false, error: null });
          return true;
        } catch (error) {
          console.log("[Auth] Sign in exception:", error);
          set({ isLoading: false, error: String(error) });
          return false;
        }
      },

      signUp: async (email: string, password: string, username: string, tier: "free" | "superfan"): Promise<boolean> => {
        try {
          set({ isLoading: true, error: null });
          console.log("[Auth] Attempting sign up for:", email);

          // Create auth user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
          });

          if (authError) {
            console.log("[Auth] Sign up auth error:", authError.message);
            set({ isLoading: false, error: authError.message });
            return false;
          }

          if (!authData.user) {
            console.log("[Auth] No user returned from sign up");
            set({ isLoading: false, error: "Sign up failed" });
            return false;
          }

          console.log("[Auth] Auth user created, creating profile");

          // Generate referral code
          const referralCode = "USER" + Math.random().toString(36).substring(2, 8).toUpperCase();

          // Check if this is the admin email
          const isAdmin = email.toLowerCase() === "vyoung86@gmail.com";
          const userRole = isAdmin ? "admin" : "user";

          // Create user profile in database
          const { data: userData, error: userError } = await supabase
            .from("users")
            .insert({
              id: authData.user.id,
              email,
              username,
              tier: isAdmin ? "superfan" : tier,
              role: userRole,
              referral_code: isAdmin ? "ADMIN2024" : referralCode,
            })
            .select()
            .single();

          if (userError) {
            console.log("[Auth] Error creating user profile:", userError.message);
            set({ isLoading: false, error: userError.message });
            return false;
          }

          const user: User = {
            id: userData.id,
            email: userData.email,
            username: userData.username,
            avatar: userData.avatar,
            bio: userData.bio,
            tier: userData.tier || "free",
            role: userData.role || "user",
            permissions: userData.permissions,
            referralCode: userData.referral_code,
            followedStreamers: [],
            followedArtists: [],
            followingUsers: [],
            followers: [],
            hasCompletedOnboarding: userData.has_completed_onboarding || false,
            isVerified: userData.is_verified,
            verificationStatus: userData.verification_status,
            isInfluencer: userData.is_influencer,
            createdAt: userData.created_at,
          };

          console.log("[Auth] Sign up successful:", user.username);
          set({ user, isAuthenticated: true, isLoading: false, error: null });
          return true;
        } catch (error) {
          console.log("[Auth] Sign up exception:", error);
          set({ isLoading: false, error: String(error) });
          return false;
        }
      },

      signOut: async () => {
        try {
          console.log("[Auth] Signing out");
          await supabase.auth.signOut();
          set({ user: null, isAuthenticated: false, error: null });
        } catch (error) {
          console.log("[Auth] Sign out error:", error);
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });

          // Update in Supabase
          const updateData: Record<string, unknown> = {};
          if (userData.username !== undefined) updateData.username = userData.username;
          if (userData.avatar !== undefined) updateData.avatar = userData.avatar;
          if (userData.bio !== undefined) updateData.bio = userData.bio;
          if (userData.tier !== undefined) updateData.tier = userData.tier;
          if (userData.hasCompletedOnboarding !== undefined) updateData.has_completed_onboarding = userData.hasCompletedOnboarding;

          if (Object.keys(updateData).length > 0) {
            supabase
              .from("users")
              .update(updateData)
              .eq("id", currentUser.id)
              .then(({ error }) => {
                if (error) {
                  console.log("[Auth] Error updating user:", error.message);
                }
              });
          }
        }
      },

      toggleBookmark: (streamerId: string) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const bookmarkedStreamers = currentUser.bookmarkedStreamers || [];
        const isBookmarked = bookmarkedStreamers.includes(streamerId);

        const updatedBookmarks = isBookmarked
          ? bookmarkedStreamers.filter((id) => id !== streamerId)
          : [...bookmarkedStreamers, streamerId];

        get().updateUser({ bookmarkedStreamers: updatedBookmarks });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
