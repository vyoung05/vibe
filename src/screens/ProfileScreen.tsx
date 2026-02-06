import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, Dimensions, KeyboardAvoidingView, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useAuthStore } from "../state/authStore";
import { useAppStore } from "../state/appStore";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { ProfileGallery } from "../components/ProfileGallery";
import { GuestPrompt } from "../components/GuestPrompt";
import { PageContainer } from "../components/PageContainer";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { achievements } from "../data/achievements";
import type { VerificationRequest } from "../types";
import type { Post } from "../types/post";
import { fetchUserPosts } from "../services/postsService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const INFLUENCER_THRESHOLD = 10;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const signOut = useAuthStore((s) => s.signOut);
  const streamers = useAppStore((s) => s.streamers);
  const posts = useAppStore((s) => s.posts);
  const userAccounts = useAppStore((s) => s.userAccounts);
  const submitVerificationRequest = useAppStore((s) => s.submitVerificationRequest);
  const unfollowStreamer = useAppStore((s) => s.unfollowStreamer);
  const unfollowUser = useAppStore((s) => s.unfollowUser);
  const navigation = useNavigation<NavigationProp>();

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationReason, setVerificationReason] = useState("");
  const [verificationSocialProof, setVerificationSocialProof] = useState("");
  const [selectedTab, setSelectedTab] = useState<"posts" | "about">("posts");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
  const [editUsername, setEditUsername] = useState(user?.username || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editSocialLinks, setEditSocialLinks] = useState({
    twitch: user?.socialLinks?.twitch || "",
    youtube: user?.socialLinks?.youtube || "",
    instagram: user?.socialLinks?.instagram || "",
    twitter: user?.socialLinks?.twitter || "",
    tiktok: user?.socialLinks?.tiktok || "",
  });

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Check if user is a streamer or admin (admins have all streamer capabilities)
  // Check both s.id (legacy) and s.userId (linked accounts) to find streamer profile
  const isStreamer = streamers.some((s) => s.id === user?.id || s.userId === user?.id) || user?.role === "admin";
  
  // Get the user's streamer profile if they have one (for linked accounts)
  const userStreamerProfile = streamers.find((s) => s.userId === user?.id || s.id === user?.id);

  // Load user's posts from Supabase + local store
  const loadUserPosts = useCallback(async () => {
    if (!user) {
      setUserPosts([]);
      setLoadingPosts(false);
      return;
    }

    try {
      // Fetch from Supabase
      const supabasePosts = await fetchUserPosts(user.id, user.id);
      
      // Also get local posts that might not be synced
      const localPosts = posts
        .filter((post) => post.user.id === user.id)
        .map((post) => ({
          ...post,
          isLiked: (post.likedBy || []).includes(user.id),
          isSaved: (post.savedBy || []).includes(user.id),
        }));
      
      // Merge: Supabase posts take priority
      const supabasePostIds = new Set(supabasePosts.map((p) => p.id));
      const localOnlyPosts = localPosts.filter((p) => !supabasePostIds.has(p.id));
      
      const allPosts = [...supabasePosts, ...localOnlyPosts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setUserPosts(allPosts);
    } catch (error) {
      console.error("[Profile] Error loading posts:", error);
      // Fallback to local posts
      const localPosts = posts
        .filter((post) => post.user.id === user.id)
        .map((post) => ({
          ...post,
          isLiked: (post.likedBy || []).includes(user.id),
          isSaved: (post.savedBy || []).includes(user.id),
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setUserPosts(localPosts);
    } finally {
      setLoadingPosts(false);
    }
  }, [user?.id, posts]);

  // Load posts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUserPosts();
    }, [loadUserPosts])
  );

  // Sync local state with user data ONLY when modal opens (not on every user change)
  // This prevents losing edits when user data updates mid-edit
  useEffect(() => {
    if (showEditProfile && user) {
      setEditUsername(user.username);
      setEditBio(user.bio || "");
      setEditSocialLinks({
        twitch: user.socialLinks?.twitch || "",
        youtube: user.socialLinks?.youtube || "",
        instagram: user.socialLinks?.instagram || "",
        twitter: user.socialLinks?.twitter || "",
        tiktok: user.socialLinks?.tiktok || "",
      });
    }
  }, [showEditProfile]);

  // Sync avatar URL when avatar modal opens
  useEffect(() => {
    if (showAvatarModal && user) {
      setAvatarUrl(user.avatar || "");
    }
  }, [showAvatarModal]);

  if (!user) {
    return (
      <View className="flex-1 bg-[#050509]">
        <View style={{ paddingTop: insets.top }} />
        <GuestPrompt
          title="Your Profile awaits"
          description="Sign in to share your moments, follow streamers, and build your community."
          icon="person-outline"
        />
      </View>
    );
  }

  const isAdmin = user.role === "admin";
  const userReferrals = user.referrals || [];
  const userAchievements = user.achievements || [];

  const unlockedAchievements = achievements.filter((achievement) =>
    userAchievements.includes(achievement.id)
  );

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(user.referralCode);
    Alert.alert("Copied!", "Referral code copied to clipboard");
  };

  const shareProfile = async () => {
    const profileUrl = `https://www.daydeamersnightstreamers.com/profile/${user.username}`;
    await Clipboard.setStringAsync(profileUrl);
    Alert.alert("Profile Link Copied!", `Your profile link has been copied:\n${profileUrl}`);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library to upload a picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow camera access to take a picture.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const handleUpdateAvatar = () => {
    if (avatarUrl.trim()) {
      updateUser({ avatar: avatarUrl.trim() });
      setShowAvatarModal(false);
    }
  };

  const handleSaveProfile = () => {
    if (!editUsername.trim()) {
      Alert.alert("Error", "Username cannot be empty");
      return;
    }

    updateUser({
      username: editUsername.trim(),
      bio: editBio.trim(),
      socialLinks: {
        twitch: editSocialLinks.twitch.trim(),
        youtube: editSocialLinks.youtube.trim(),
        instagram: editSocialLinks.instagram.trim(),
        twitter: editSocialLinks.twitter.trim(),
        tiktok: editSocialLinks.tiktok.trim(),
      },
    });

    setShowEditProfile(false);
    Alert.alert("Success", "Profile updated successfully!");
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowLogoutModal(false);
    signOut();
  };

  const handleRequestVerification = () => {
    if (!user || !verificationReason.trim()) {
      Alert.alert("Error", "Please provide a reason for verification");
      return;
    }

    const request: VerificationRequest = {
      id: "verify-" + Date.now(),
      userId: user.id,
      username: user.username,
      userAvatar: user.avatar,
      reason: verificationReason.trim(),
      socialProof: verificationSocialProof.trim() || undefined,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    submitVerificationRequest(request);
    setShowVerificationModal(false);
    setVerificationReason("");
    setVerificationSocialProof("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Request Submitted",
      "Your verification request has been submitted. You will be notified when it is reviewed."
    );
  };

  const handleUnfollowStreamer = (streamerId: string) => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    unfollowStreamer(user.id, streamerId);
    // Sync to authStore for real-time profile updates
    const updatedFollowedStreamers = (user.followedStreamers || []).filter(id => id !== streamerId);
    updateUser({ followedStreamers: updatedFollowedStreamers });
  };

  const handleUnfollowUser = (targetUserId: string) => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    unfollowUser(user.id, targetUserId);
    // Sync to authStore for real-time profile updates
    const updatedFollowingUsers = (user.followingUsers || []).filter(id => id !== targetUserId);
    updateUser({ followingUsers: updatedFollowingUsers });
  };

  return (
    <View className="flex-1 bg-[#050509]">
      {/* Header with Settings & Logout */}
      <View
        className="bg-[#050509] border-b border-gray-800/50"
        style={{ paddingTop: insets.top }}
      >
        <PageContainer>
          <View className="flex-row items-center justify-between px-5 py-3">
            <View className="flex-row items-center">
              <Text className="text-white text-xl font-bold">{user.username}</Text>
              {user.isVerified && (
                <View className="ml-1.5 bg-purple-500 rounded-full p-0.5">
                  <Ionicons name="checkmark" size={12} color="white" />
                </View>
              )}
              {user.isInfluencer && (
                <View className="ml-1.5 bg-amber-500 rounded-full p-0.5">
                  <Ionicons name="star" size={12} color="white" />
                </View>
              )}
              {isAdmin && (
                <View className="ml-2 bg-purple-500/20 px-2 py-0.5 rounded-full">
                  <Text className="text-purple-400 text-xs font-semibold">ADMIN</Text>
                </View>
              )}
            </View>
            <View className="flex-row items-center gap-4">
              <Pressable
                onPress={() => navigation.navigate("CreatePost")}
                className="p-1"
              >
                <Ionicons name="add-circle-outline" size={26} color="#FFFFFF" />
              </Pressable>
              <Pressable
                onPress={() => setSelectedTab("about")}
                className="p-1"
              >
                <Ionicons name="menu-outline" size={26} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </PageContainer>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <PageContainer>
          {/* Profile Info Section */}
          <View className="px-5 pt-5">
            <View className="flex-row items-center">
              {/* Avatar */}
              <Pressable onPress={() => setShowAvatarModal(true)} className="relative">
                {user.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: 44,
                      borderWidth: 3,
                      borderColor: user.tier === "superfan" ? "#EC4899" : "#3B82F6"
                    }}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    className="w-[88px] h-[88px] rounded-full items-center justify-center"
                    style={{
                      backgroundColor: user.tier === "superfan" ? "rgba(236,72,153,0.2)" : "rgba(59,130,246,0.2)",
                      borderWidth: 3,
                      borderColor: user.tier === "superfan" ? "#EC4899" : "#3B82F6"
                    }}
                  >
                    <Text className="text-white text-3xl font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 border-2 border-[#050509]">
                  <Ionicons name="add" size={14} color="white" />
                </View>
              </Pressable>

              {/* Stats Row */}
              <View className="flex-1 flex-row justify-around ml-6">
                <Pressable className="items-center">
                  <Text className="text-white text-xl font-bold">{user.followers?.length || 0}</Text>
                  <Text className="text-gray-400 text-sm">Followers</Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowFollowingModal(true)}
                  className="items-center"
                >
                  <Text className="text-white text-xl font-bold">
                    {(user.followedStreamers?.length || 0) + (user.followingUsers?.length || 0)}
                  </Text>
                  <Text className="text-gray-400 text-sm">Following</Text>
                </Pressable>
                <Pressable className="items-center">
                  <Text className="text-white text-xl font-bold">{userPosts.length}</Text>
                  <Text className="text-gray-400 text-sm">Posts</Text>
                </Pressable>
              </View>
            </View>

            {/* Name & Bio */}
            <View className="mt-4">
              <View className="flex-row items-center">
                <Text className="text-white font-semibold text-base">{user.username}</Text>
                {user.tier === "superfan" && (
                  <View className="ml-2 flex-row items-center bg-gradient-to-r from-pink-500/20 to-purple-500/20 px-2 py-0.5 rounded-full">
                    <Ionicons name="star" size={12} color="#EC4899" />
                    <Text className="text-pink-400 text-xs font-medium ml-1">Super Fan</Text>
                  </View>
                )}
              </View>
              {user.bio ? (
                <Text className="text-gray-300 text-sm mt-1 leading-5">{user.bio}</Text>
              ) : (
                <Text className="text-gray-500 text-sm mt-1">Add a bio to tell people about yourself</Text>
              )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row mt-4 gap-2">
              <Pressable
                onPress={() => setShowEditProfile(true)}
                className="flex-1 bg-[#1C1C24] py-2.5 rounded-lg"
              >
                <Text className="text-white text-center font-semibold text-sm">Edit Profile</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  shareProfile();
                }}
                className="flex-1 bg-[#1C1C24] py-2.5 rounded-lg"
              >
                <Text className="text-white text-center font-semibold text-sm">Share Profile</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowLogoutModal(true)}
                className="bg-[#1C1C24] px-4 py-2.5 rounded-lg"
              >
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              </Pressable>
            </View>

            {/* Social Links Preview */}
            {(user.socialLinks?.instagram || user.socialLinks?.tiktok || user.socialLinks?.youtube) && (
              <View className="flex-row mt-4 gap-3">
                {user.socialLinks?.instagram && (
                  <View className="flex-row items-center bg-[#1C1C24] px-3 py-1.5 rounded-full">
                    <Ionicons name="logo-instagram" size={14} color="#E4405F" />
                    <Text className="text-gray-300 text-xs ml-1.5">Instagram</Text>
                  </View>
                )}
                {user.socialLinks?.tiktok && (
                  <View className="flex-row items-center bg-[#1C1C24] px-3 py-1.5 rounded-full">
                    <Ionicons name="logo-tiktok" size={14} color="#00F2EA" />
                    <Text className="text-gray-300 text-xs ml-1.5">TikTok</Text>
                  </View>
                )}
                {user.socialLinks?.youtube && (
                  <View className="flex-row items-center bg-[#1C1C24] px-3 py-1.5 rounded-full">
                    <Ionicons name="logo-youtube" size={14} color="#FF0000" />
                    <Text className="text-gray-300 text-xs ml-1.5">YouTube</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Tabs */}
          <View className="flex-row mt-5 border-b border-gray-800">
            <Pressable
              onPress={() => setSelectedTab("posts")}
              className={`flex-1 py-3 items-center border-b-2 ${selectedTab === "posts" ? "border-white" : "border-transparent"}`}
            >
              <Ionicons
                name="grid-outline"
                size={24}
                color={selectedTab === "posts" ? "#FFFFFF" : "#6B7280"}
              />
            </Pressable>
            <Pressable
              onPress={() => setSelectedTab("about")}
              className={`flex-1 py-3 items-center border-b-2 ${selectedTab === "about" ? "border-white" : "border-transparent"}`}
            >
              <Ionicons
                name="person-outline"
                size={24}
                color={selectedTab === "about" ? "#FFFFFF" : "#6B7280"}
              />
            </Pressable>
          </View>

          {/* Content */}
          {selectedTab === "posts" ? (
            <ProfileGallery
              posts={userPosts}
              onPostPress={(postId) => navigation.navigate("PostDetail", { postId })}
              isOwnProfile={true}
            />
          ) : (
            <View className="px-5 pt-5">
              {/* Quick Actions for Streamers/Admins */}
              {(isStreamer || isAdmin) && (
                <View className="mb-6">
                  <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Creator Tools</Text>

                  {isAdmin && (
                    <Pressable
                      onPress={() => navigation.navigate("AdminDashboard")}
                      className="flex-row items-center bg-[#1C1C24] p-4 rounded-2xl mb-3"
                    >
                      <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center">
                        <Ionicons name="shield-checkmark" size={20} color="#8B5CF6" />
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="text-white font-semibold">Admin Dashboard</Text>
                        <Text className="text-gray-500 text-xs">Manage users & content</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                    </Pressable>
                  )}

                  {isStreamer && (
                    <>
                      <Pressable
                        onPress={() => navigation.navigate("Streaming")}
                        className="flex-row items-center bg-[#1C1C24] p-4 rounded-2xl mb-3"
                      >
                        <View className="w-10 h-10 rounded-full bg-red-500/20 items-center justify-center">
                          <Ionicons name="radio" size={20} color="#EF4444" />
                        </View>
                        <View className="flex-1 ml-3">
                          <Text className="text-white font-semibold">Go Live</Text>
                          <Text className="text-gray-500 text-xs">Start streaming</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                      </Pressable>

                      <Pressable
                        onPress={() => navigation.navigate("StreamerAnalytics", { streamerId: user.id })}
                        className="flex-row items-center bg-[#1C1C24] p-4 rounded-2xl mb-3"
                      >
                        <View className="w-10 h-10 rounded-full bg-cyan-500/20 items-center justify-center">
                          <Ionicons name="analytics" size={20} color="#06B6D4" />
                        </View>
                        <View className="flex-1 ml-3">
                          <Text className="text-white font-semibold">Analytics</Text>
                          <Text className="text-gray-500 text-xs">View performance</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                      </Pressable>
                    </>
                  )}

                  {isAdmin && (
                    <Pressable
                      onPress={() => navigation.navigate("AdminAnalytics")}
                      className="flex-row items-center bg-[#1C1C24] p-4 rounded-2xl"
                    >
                      <View className="w-10 h-10 rounded-full bg-orange-500/20 items-center justify-center">
                        <Ionicons name="stats-chart" size={20} color="#F59E0B" />
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="text-white font-semibold">Platform Analytics</Text>
                        <Text className="text-gray-500 text-xs">All streamer stats</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                    </Pressable>
                  )}
                </View>
              )}

              {/* Achievements Section */}
              <View className="mb-6">
                <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Achievements</Text>
                <Pressable
                  onPress={() => setShowAchievements(true)}
                  className="bg-[#1C1C24] p-4 rounded-2xl"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Ionicons name="trophy" size={20} color="#F59E0B" />
                      <Text className="text-white font-semibold ml-2">Your Badges</Text>
                    </View>
                    <Text className="text-gray-400 text-sm">{unlockedAchievements.length}/{achievements.length}</Text>
                  </View>
                  <View className="flex-row">
                    {unlockedAchievements.slice(0, 6).map((achievement) => (
                      <View
                        key={achievement.id}
                        className="w-10 h-10 rounded-full items-center justify-center mr-2"
                        style={{ backgroundColor: achievement.color + "30" }}
                      >
                        <Ionicons name={achievement.icon as any} size={18} color={achievement.color} />
                      </View>
                    ))}
                    {achievements.length > 6 && (
                      <View className="w-10 h-10 rounded-full bg-gray-700/50 items-center justify-center">
                        <Text className="text-gray-400 text-xs font-bold">+{achievements.length - 6}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              </View>

              {/* Verification & Influencer Status */}
              <View className="mb-6">
                <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                  Status & Badges
                </Text>

                {/* Verification Status */}
                <View className="bg-[#1C1C24] p-4 rounded-2xl mb-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View
                        className={`w-12 h-12 rounded-full items-center justify-center ${user.isVerified ? "bg-purple-500/20" : "bg-gray-700/50"
                          }`}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={user.isVerified ? "#A855F7" : "#6B7280"}
                        />
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="text-white font-semibold">
                          {user.isVerified ? "Verified Account" : "Get Verified"}
                        </Text>
                        <Text className="text-gray-400 text-xs">
                          {user.isVerified
                            ? "Your account has the purple checkmark"
                            : user.verificationStatus === "pending"
                              ? "Request pending review..."
                              : "Request the purple verification badge"}
                        </Text>
                      </View>
                    </View>
                    {!user.isVerified && user.verificationStatus !== "pending" && (
                      <Pressable
                        onPress={() => setShowVerificationModal(true)}
                        className="bg-purple-600 px-4 py-2 rounded-lg"
                      >
                        <Text className="text-white font-semibold text-sm">Request</Text>
                      </Pressable>
                    )}
                    {user.verificationStatus === "pending" && (
                      <View className="bg-amber-500/20 px-3 py-1.5 rounded-lg">
                        <Text className="text-amber-400 font-semibold text-xs">PENDING</Text>
                      </View>
                    )}
                    {user.isVerified && (
                      <View className="bg-purple-500 rounded-full p-1.5">
                        <Ionicons name="checkmark" size={16} color="white" />
                      </View>
                    )}
                  </View>
                </View>

                {/* Influencer Status */}
                <Pressable
                  onPress={() => navigation.navigate("InviteFriends")}
                  className="bg-[#1C1C24] p-4 rounded-2xl"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View
                        className={`w-12 h-12 rounded-full items-center justify-center ${user.isInfluencer ? "bg-amber-500/20" : "bg-gray-700/50"
                          }`}
                      >
                        <Ionicons
                          name="star"
                          size={24}
                          color={user.isInfluencer ? "#F59E0B" : "#6B7280"}
                        />
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="text-white font-semibold">
                          {user.isInfluencer ? "Influencer" : "Become an Influencer"}
                        </Text>
                        <Text className="text-gray-400 text-xs">
                          {user.isInfluencer
                            ? "You are a community influencer!"
                            : `Invite ${INFLUENCER_THRESHOLD - (user.invitedFriends?.length || 0)} more friends`}
                        </Text>
                      </View>
                    </View>
                    {!user.isInfluencer && (
                      <View className="items-end">
                        <Text className="text-amber-400 font-bold text-sm">
                          {user.invitedFriends?.length || 0}/{INFLUENCER_THRESHOLD}
                        </Text>
                        <Ionicons name="chevron-forward" size={18} color="#6B7280" />
                      </View>
                    )}
                    {user.isInfluencer && (
                      <View className="bg-amber-500 rounded-full p-1.5">
                        <Ionicons name="star" size={16} color="white" />
                      </View>
                    )}
                  </View>
                  {!user.isInfluencer && (
                    <View className="mt-3">
                      <View className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-amber-500 rounded-full"
                          style={{
                            width: `${Math.min(((user.invitedFriends?.length || 0) / INFLUENCER_THRESHOLD) * 100, 100)}%`,
                          }}
                        />
                      </View>
                    </View>
                  )}
                </Pressable>
              </View>

              {/* Referral Section */}
              <View className="mb-6">
                <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Invite Friends</Text>
                <Pressable
                  onPress={() => navigation.navigate("InviteFriends")}
                  className="bg-[#1C1C24] p-4 rounded-2xl"
                >
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-white font-semibold">Your Referral Code</Text>
                      <Text className="text-purple-400 text-lg font-bold mt-1">{user.referralCode}</Text>
                    </View>
                    <Pressable
                      onPress={copyToClipboard}
                      className="bg-purple-500/20 px-4 py-2 rounded-lg"
                    >
                      <Text className="text-purple-400 font-semibold">Copy</Text>
                    </Pressable>
                  </View>
                  {(user.invitedFriends?.length || 0) > 0 && (
                    <View className="mt-3 pt-3 border-t border-gray-800">
                      <Text className="text-gray-400 text-sm">
                        {user.invitedFriends?.length} {(user.invitedFriends?.length || 0) === 1 ? "friend" : "friends"} joined using your code
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>

              {/* Settings */}
              <View className="mb-6">
                <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Settings</Text>

                <Pressable
                  onPress={() => navigation.navigate("Notifications")}
                  className="flex-row items-center bg-[#1C1C24] p-4 rounded-t-2xl border-b border-gray-800/50"
                >
                  <Ionicons name="notifications-outline" size={22} color="#9CA3AF" />
                  <Text className="text-white flex-1 ml-3">Notifications</Text>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </Pressable>

                <Pressable
                  onPress={() => navigation.navigate("Billing")}
                  className="flex-row items-center bg-[#1C1C24] p-4 border-b border-gray-800/50"
                >
                  <Ionicons name="card-outline" size={22} color="#9CA3AF" />
                  <Text className="text-white flex-1 ml-3">Billing & Subscription</Text>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </Pressable>

                <Pressable
                  onPress={() => navigation.navigate("HelpSupport")}
                  className="flex-row items-center bg-[#1C1C24] p-4 rounded-b-2xl"
                >
                  <Ionicons name="help-circle-outline" size={22} color="#9CA3AF" />
                  <Text className="text-white flex-1 ml-3">Help & Support</Text>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </Pressable>
              </View>

              {/* Logout Button */}
              <Pressable
                onPress={() => setShowLogoutModal(true)}
                className="flex-row items-center justify-center bg-red-500/10 p-4 rounded-2xl mb-6"
              >
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                <Text className="text-red-400 font-semibold ml-2">Log Out</Text>
              </Pressable>
            </View>
          )}
        </PageContainer>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} animationType="fade" transparent>
        <Pressable
          className="flex-1 bg-black/70 items-center justify-center px-8"
          onPress={() => setShowLogoutModal(false)}
        >
          <View className="bg-[#1C1C24] rounded-3xl p-6 w-full">
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-red-500/20 items-center justify-center mb-4">
                <Ionicons name="log-out-outline" size={32} color="#EF4444" />
              </View>
              <Text className="text-white text-xl font-bold">Log Out?</Text>
              <Text className="text-gray-400 text-center mt-2">
                Are you sure you want to log out of your account?
              </Text>
            </View>
            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={() => setShowLogoutModal(false)}
                className="flex-1 bg-[#2A2A3E] py-4 rounded-xl"
              >
                <Text className="text-white text-center font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleLogout}
                className="flex-1 bg-red-500 py-4 rounded-xl"
              >
                <Text className="text-white text-center font-semibold">Log Out</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Avatar Upload Modal */}
      <Modal visible={showAvatarModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-[#151520] rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">Update Profile Picture</Text>
              <Pressable onPress={() => setShowAvatarModal(false)}>
                <Ionicons name="close" size={28} color="white" />
              </Pressable>
            </View>

            {/* Upload Options */}
            <View className="mb-6">
              <View className="flex-row gap-3 mb-4">
                <Pressable
                  onPress={takePhoto}
                  className="flex-1 bg-purple-600 rounded-xl py-4 items-center"
                >
                  <Ionicons name="camera" size={24} color="white" />
                  <Text className="text-white font-semibold mt-2">Take Photo</Text>
                </Pressable>
                <Pressable
                  onPress={pickImage}
                  className="flex-1 bg-pink-600 rounded-xl py-4 items-center"
                >
                  <Ionicons name="images" size={24} color="white" />
                  <Text className="text-white font-semibold mt-2">Choose from Gallery</Text>
                </Pressable>
              </View>

              <Text className="text-gray-400 text-center text-sm mb-2">OR</Text>

              <Text className="text-gray-400 text-sm mb-2">Paste an image URL:</Text>
              <TextInput
                placeholder="https://example.com/your-image.jpg"
                placeholderTextColor="#6B7280"
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                autoCapitalize="none"
              />
            </View>

            {avatarUrl.trim() && (
              <View className="mb-4 items-center">
                <Text className="text-gray-400 text-sm mb-2">Preview:</Text>
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: "#8B5CF6" }}
                  contentFit="cover"
                />
              </View>
            )}

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  setAvatarUrl("");
                  updateUser({ avatar: "" });
                  setShowAvatarModal(false);
                }}
                className="flex-1 bg-red-600/20 py-4 rounded-xl border border-red-600/50"
              >
                <Text className="text-red-400 text-center font-bold">Remove Picture</Text>
              </Pressable>
              <Pressable
                onPress={handleUpdateAvatar}
                className="flex-1 bg-purple-600 py-4 rounded-xl"
              >
                <Text className="text-white text-center font-bold">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Achievements Modal */}
      <Modal visible={showAchievements} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-[#151520] rounded-t-3xl p-6" style={{ maxHeight: "80%" }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">Achievements</Text>
              <Pressable onPress={() => setShowAchievements(false)}>
                <Ionicons name="close" size={28} color="white" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {achievements.map((achievement) => {
                const isUnlocked = userAchievements.includes(achievement.id);
                const progress =
                  achievement.type === "referrals"
                    ? userReferrals.length
                    : achievement.type === "followers"
                      ? user.followedStreamers.length
                      : 0;

                return (
                  <View
                    key={achievement.id}
                    className={`mb-4 rounded-xl p-4 border ${isUnlocked
                      ? "bg-[#0A0A0F] border-gray-700"
                      : "bg-gray-800/30 border-gray-800"
                      }`}
                  >
                    <View className="flex-row items-center">
                      <View
                        className="w-16 h-16 rounded-full items-center justify-center mr-4"
                        style={{
                          backgroundColor: isUnlocked
                            ? achievement.color + "40"
                            : "#374151",
                        }}
                      >
                        <Ionicons
                          name={achievement.icon as any}
                          size={32}
                          color={isUnlocked ? achievement.color : "#6B7280"}
                        />
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`font-bold text-lg ${isUnlocked ? "text-white" : "text-gray-500"
                            }`}
                        >
                          {achievement.name}
                        </Text>
                        <Text className="text-gray-400 text-sm mb-1">
                          {achievement.description}
                        </Text>
                        {!isUnlocked && (
                          <Text className="text-gray-500 text-xs">
                            Progress: {progress}/{achievement.requirement}
                          </Text>
                        )}
                      </View>
                      {isUnlocked && (
                        <View className="bg-green-500/20 rounded-full p-2">
                          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-[#151520] rounded-t-3xl p-6" style={{ maxHeight: "90%" }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">Edit Profile</Text>
              <Pressable onPress={() => setShowEditProfile(false)}>
                <Ionicons name="close" size={28} color="white" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Username */}
              <View className="mb-6">
                <Text className="text-gray-400 text-sm mb-2">Username</Text>
                <TextInput
                  placeholder="Enter username"
                  placeholderTextColor="#6B7280"
                  value={editUsername}
                  onChangeText={setEditUsername}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  autoCapitalize="none"
                />
              </View>

              {/* Bio */}
              <View className="mb-6">
                <Text className="text-gray-400 text-sm mb-2">Bio</Text>
                <TextInput
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#6B7280"
                  value={editBio}
                  onChangeText={setEditBio}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={200}
                  style={{ minHeight: 100 }}
                />
                <Text className="text-gray-500 text-xs mt-1 text-right">
                  {editBio.length}/200 characters
                </Text>
              </View>

              {/* Social Media Links */}
              <Text className="text-white text-lg font-bold mb-4">Social Media</Text>

              {/* Twitch */}
              <View className="mb-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="logo-twitch" size={20} color="#9146FF" />
                  <Text className="text-gray-400 text-sm ml-2">Twitch</Text>
                </View>
                <TextInput
                  placeholder="Enter Twitch username or URL"
                  placeholderTextColor="#6B7280"
                  value={editSocialLinks.twitch}
                  onChangeText={(text) => setEditSocialLinks({ ...editSocialLinks, twitch: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  autoCapitalize="none"
                />
              </View>

              {/* YouTube */}
              <View className="mb-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                  <Text className="text-gray-400 text-sm ml-2">YouTube</Text>
                </View>
                <TextInput
                  placeholder="Enter YouTube channel or URL"
                  placeholderTextColor="#6B7280"
                  value={editSocialLinks.youtube}
                  onChangeText={(text) => setEditSocialLinks({ ...editSocialLinks, youtube: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  autoCapitalize="none"
                />
              </View>

              {/* Instagram */}
              <View className="mb-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                  <Text className="text-gray-400 text-sm ml-2">Instagram</Text>
                </View>
                <TextInput
                  placeholder="Enter Instagram username or URL"
                  placeholderTextColor="#6B7280"
                  value={editSocialLinks.instagram}
                  onChangeText={(text) => setEditSocialLinks({ ...editSocialLinks, instagram: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  autoCapitalize="none"
                />
              </View>

              {/* Twitter */}
              <View className="mb-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
                  <Text className="text-gray-400 text-sm ml-2">Twitter</Text>
                </View>
                <TextInput
                  placeholder="Enter Twitter username or URL"
                  placeholderTextColor="#6B7280"
                  value={editSocialLinks.twitter}
                  onChangeText={(text) => setEditSocialLinks({ ...editSocialLinks, twitter: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  autoCapitalize="none"
                />
              </View>

              {/* TikTok */}
              <View className="mb-6">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="logo-tiktok" size={20} color="#00F2EA" />
                  <Text className="text-gray-400 text-sm ml-2">TikTok</Text>
                </View>
                <TextInput
                  placeholder="Enter TikTok username or URL"
                  placeholderTextColor="#6B7280"
                  value={editSocialLinks.tiktok}
                  onChangeText={(text) => setEditSocialLinks({ ...editSocialLinks, tiktok: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  autoCapitalize="none"
                />
              </View>

              {/* Save Button */}
              <Pressable
                onPress={handleSaveProfile}
                className="bg-purple-600 py-4 rounded-xl mb-4"
              >
                <Text className="text-white text-center font-bold text-base">Save Changes</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Following Modal */}
      <Modal visible={showFollowingModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-[#151520] rounded-t-3xl p-6" style={{ maxHeight: "80%" }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">Following</Text>
              <Pressable onPress={() => setShowFollowingModal(false)}>
                <Ionicons name="close" size={28} color="white" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Followed Streamers */}
              {user.followedStreamers && user.followedStreamers.length > 0 && (
                <View className="mb-4">
                  <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                    Streamers
                  </Text>
                  {streamers
                    .filter((s) => user.followedStreamers?.includes(s.id))
                    .map((streamer) => (
                      <View
                        key={streamer.id}
                        className="flex-row items-center bg-[#0A0A0F] p-4 rounded-2xl mb-3"
                      >
                        <Pressable
                          onPress={() => { setShowFollowingModal(false); navigation.navigate("StreamerProfile", { streamerId: streamer.id }); }}
                          className="flex-row items-center flex-1"
                        >
                          <Image
                            source={{ uri: streamer.avatar }}
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 28,
                              borderWidth: 2,
                              borderColor: streamer.isLive ? "#EC4899" : "#374151"
                            }}
                            contentFit="cover"
                          />
                          <View className="flex-1 ml-4">
                            <View className="flex-row items-center">
                              <Text className="text-white font-bold text-base">{streamer.name}</Text>
                              {streamer.isLive && (
                                <View className="ml-2 bg-pink-500 px-2 py-0.5 rounded-full">
                                  <Text className="text-white text-xs font-bold">LIVE</Text>
                                </View>
                              )}
                            </View>
                            <Text className="text-purple-400 text-sm">@{streamer.gamertag}</Text>
                            <Text className="text-gray-500 text-xs mt-1">
                              {streamer.followerCount.toLocaleString()} followers
                            </Text>
                          </View>
                        </Pressable>
                        <Pressable
                          onPress={() => handleUnfollowStreamer(streamer.id)}
                          className="bg-[#1C1C24] px-4 py-2 rounded-lg"
                        >
                          <Text className="text-gray-400 font-semibold text-sm">Following</Text>
                        </Pressable>
                      </View>
                    ))}
                </View>
              )}

              {/* Followed Users */}
              {user.followingUsers && user.followingUsers.length > 0 && (
                <View className="mb-4">
                  <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                    People
                  </Text>
                  {userAccounts
                    .filter((account) => user.followingUsers?.includes(account.user.id))
                    .map((account) => (
                      <View
                        key={account.user.id}
                        className="flex-row items-center bg-[#0A0A0F] p-4 rounded-2xl mb-3"
                      >
                        {account.user.avatar ? (
                          <Image
                            source={{ uri: account.user.avatar }}
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 28,
                              borderWidth: 2,
                              borderColor: account.user.isVerified ? "#A855F7" : "#374151"
                            }}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            className="w-14 h-14 rounded-full items-center justify-center"
                            style={{
                              backgroundColor: "#1C1C24",
                              borderWidth: 2,
                              borderColor: account.user.isVerified ? "#A855F7" : "#374151"
                            }}
                          >
                            <Text className="text-white text-xl font-bold">
                              {account.user.username.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View className="flex-1 ml-4">
                          <View className="flex-row items-center">
                            <Text className="text-white font-bold text-base">
                              {account.user.username}
                            </Text>
                            {account.user.isVerified && (
                              <View className="ml-1.5 bg-purple-500 rounded-full p-0.5">
                                <Ionicons name="checkmark" size={10} color="white" />
                              </View>
                            )}
                            {account.user.isInfluencer && (
                              <View className="ml-1.5 bg-amber-500 rounded-full p-0.5">
                                <Ionicons name="star" size={10} color="white" />
                              </View>
                            )}
                          </View>
                          {account.user.bio && (
                            <Text className="text-gray-400 text-sm" numberOfLines={1}>
                              {account.user.bio}
                            </Text>
                          )}
                          <Text className="text-gray-500 text-xs mt-1">
                            {account.user.followers?.length || 0} followers
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => handleUnfollowUser(account.user.id)}
                          className="bg-[#1C1C24] px-4 py-2 rounded-lg"
                        >
                          <Text className="text-gray-400 font-semibold text-sm">Following</Text>
                        </Pressable>
                      </View>
                    ))}
                </View>
              )}

              {/* Empty State */}
              {(!user.followedStreamers || user.followedStreamers.length === 0) &&
                (!user.followingUsers || user.followingUsers.length === 0) && (
                  <View className="items-center py-12">
                    <View className="w-20 h-20 rounded-full bg-gray-800/50 items-center justify-center mb-4">
                      <Ionicons name="people-outline" size={40} color="#6B7280" />
                    </View>
                    <Text className="text-white text-lg font-semibold mb-2">Not following anyone yet</Text>
                    <Text className="text-gray-400 text-center text-sm px-4">
                      Follow streamers and people to see their updates and content in your feed
                    </Text>
                    <Pressable
                      onPress={() => { setShowFollowingModal(false); navigation.navigate("DiscoverPeople"); }}
                      className="mt-6 bg-purple-500 px-6 py-3 rounded-xl"
                    >
                      <Text className="text-white font-semibold">Discover People</Text>
                    </Pressable>
                  </View>
                )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Verification Request Modal */}
      <Modal visible={showVerificationModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setShowVerificationModal(false)}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View className="bg-[#151520] rounded-t-3xl p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white text-xl font-bold">Request Verification</Text>
                  <Pressable onPress={() => setShowVerificationModal(false)}>
                    <Ionicons name="close" size={28} color="white" />
                  </Pressable>
                </View>

                <View className="items-center mb-6">
                  <View className="w-16 h-16 rounded-full bg-purple-500/20 items-center justify-center mb-3">
                    <Ionicons name="checkmark-circle" size={40} color="#A855F7" />
                  </View>
                  <Text className="text-gray-400 text-center text-sm px-4">
                    The purple checkmark helps people know your account is authentic. Tell us why you should be verified.
                  </Text>
                </View>

                <Text className="text-gray-400 text-sm mb-2">Why should you be verified? *</Text>
                <TextInput
                  placeholder="I am a content creator, public figure, or notable in my field..."
                  placeholderTextColor="#6B7280"
                  value={verificationReason}
                  onChangeText={setVerificationReason}
                  multiline
                  numberOfLines={3}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  style={{ minHeight: 80, textAlignVertical: "top" }}
                />

                <Text className="text-gray-400 text-sm mb-2">Social media links (optional)</Text>
                <TextInput
                  placeholder="Links to your other social profiles..."
                  placeholderTextColor="#6B7280"
                  value={verificationSocialProof}
                  onChangeText={setVerificationSocialProof}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-6"
                  autoCapitalize="none"
                />

                <Pressable
                  onPress={handleRequestVerification}
                  className="bg-purple-600 py-4 rounded-xl"
                >
                  <Text className="text-white text-center font-bold">Submit Request</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View >
  );
};
