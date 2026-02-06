import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  Share,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { PostCard } from "../components/PostCard";
import { GamingNewsFeed } from "../components/GamingNewsFeed";
import type { Post } from "../types/post";
import type { Report, ReportReason } from "../types";
import { useAppStore } from "../state/appStore";
import { useAuthStore } from "../state/authStore";
import {
  fetchPosts as fetchSupabasePosts,
  toggleLike,
  toggleSave,
  deletePost as deleteSupabasePost,
} from "../services/postsService";

type HomeFeedScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function HomeFeedScreen() {
  const navigation = useNavigation<HomeFeedScreenNavigationProp>();
  const user = useAuthStore((s) => s.user);
  const getLocalPosts = useAppStore((s) => s.getPosts);
  const likeLocalPost = useAppStore((s) => s.likePost);
  const saveLocalPost = useAppStore((s) => s.savePost);
  const deleteLocalPost = useAppStore((s) => s.deletePost);
  const submitReport = useAppStore((s) => s.submitReport);
  const voteHot = useAppStore((s) => s.voteHot);
  const voteNot = useAppStore((s) => s.voteNot);

  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load posts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [user?.id])
  );

  const loadPosts = async () => {
    try {
      // Try to fetch from Supabase first
      console.log("[HomeFeed] Fetching posts from Supabase...");
      const supabasePosts = await fetchSupabasePosts(user?.id);
      
      // Also get local posts that might not be synced yet
      const localPosts = getLocalPosts(user?.id);
      
      // Merge: Supabase posts take priority, but include local posts that aren't in Supabase
      const supabasePostIds = new Set(supabasePosts.map((p) => p.id));
      const localOnlyPosts = localPosts.filter((p) => !supabasePostIds.has(p.id));
      
      // Combine and sort by date (newest first)
      const allPosts = [...supabasePosts, ...localOnlyPosts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log(`[HomeFeed] Loaded ${supabasePosts.length} from Supabase, ${localOnlyPosts.length} local-only`);
      
      // Update posts with current user avatars from local accounts
      const userAccounts = useAppStore.getState().userAccounts;
      const streamerAccounts = useAppStore.getState().streamerAccounts;
      
      const postsWithUpdatedAvatars = allPosts.map((post) => {
        // Check if this is the current logged-in user's post
        if (user && post.user.id === user.id) {
          return {
            ...post,
            user: {
              ...post.user,
              avatarUrl: user.avatar || post.user.avatarUrl,
              username: user.username,
            },
          };
        }

        // Find the user account for this post
        const userAccount = userAccounts.find((acc) => acc.user.id === post.user.id);
        const streamerAccount = streamerAccounts.find((acc) => acc.streamer.id === post.user.id);

        if (userAccount) {
          return {
            ...post,
            user: {
              ...post.user,
              avatarUrl: userAccount.user.avatar || post.user.avatarUrl,
              username: userAccount.user.username,
            },
          };
        } else if (streamerAccount) {
          return {
            ...post,
            user: {
              ...post.user,
              avatarUrl: streamerAccount.streamer.avatar || post.user.avatarUrl,
              username: streamerAccount.streamer.name,
            },
          };
        }

        return post;
      });

      setPosts(postsWithUpdatedAvatars);
    } catch (error) {
      console.error("[HomeFeed] Error loading posts:", error);
      // Fallback to local posts only
      const localPosts = getLocalPosts(user?.id);
      setPosts(localPosts);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    
    // Optimistic update
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          const newIsLiked = !p.isLiked;
          return {
            ...p,
            isLiked: newIsLiked,
            likeCount: newIsLiked ? p.likeCount + 1 : Math.max(0, p.likeCount - 1),
          };
        }
        return p;
      })
    );

    // Try Supabase first, fallback to local
    try {
      await toggleLike(postId, user.id);
    } catch (error) {
      likeLocalPost(postId, user.id);
    }
  };

  const handleSave = async (postId: string) => {
    if (!user) return;
    
    // Optimistic update
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          return { ...p, isSaved: !p.isSaved };
        }
        return p;
      })
    );

    // Try Supabase first, fallback to local
    try {
      await toggleSave(postId, user.id);
    } catch (error) {
      saveLocalPost(postId, user.id);
    }
  };

  const handleShare = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      try {
        await Share.share({
          message: `Check out this post from ${post.user.username}: ${post.caption}`,
        });
      } catch (error) {
        console.error("Share error:", error);
      }
    }
  };

  const handleCommentPress = (postId: string) => {
    navigation.navigate("PostDetail", { postId });
  };

  const handleReport = (postId: string, reason: ReportReason, details?: string) => {
    if (!user) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const report: Report = {
      id: "report-" + Date.now(),
      reporterId: user.id,
      reporterUsername: user.username,
      targetType: "post",
      targetId: postId,
      targetUserId: post.user.id,
      targetUsername: post.user.username,
      reason,
      details,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    submitReport(report);
    Alert.alert(
      "Report Submitted",
      "Thank you for reporting. Our team will review this content."
    );
  };

  const handleDelete = async (postId: string) => {
    if (!user) return;

    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Optimistic update
            setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));

            // Try Supabase first, fallback to local
            try {
              const success = await deleteSupabasePost(postId, user.id);
              if (!success) {
                deleteLocalPost(postId, user.id);
              }
            } catch (error) {
              deleteLocalPost(postId, user.id);
            }
          },
        },
      ]
    );
  };

  const handleHotVote = (postId: string) => {
    if (!user) return;
    voteHot(postId, user.id);
    loadPosts();
  };

  const handleNotVote = (postId: string) => {
    if (!user) return;
    voteNot(postId, user.id);
    loadPosts();
  };

  const handleUserPress = (userId: string, isArtist?: boolean) => {
    if (isArtist) {
      navigation.navigate("ArtistProfile", { artistId: userId });
    }
  };

  const renderHeader = () => (
    <View>
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-[#050509]">
        <Text className="text-white text-2xl font-bold">Feed</Text>
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.navigate("CreatePost")} className="mr-4">
            <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" />
          </Pressable>
          <Pressable>
            <Ionicons name="paper-plane-outline" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
      
      {/* Gaming News & Events Feed */}
      <GamingNewsFeed 
        maxNews={5}
        maxEvents={3}
        showEvents={true}
      />
    </View>
  );

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      currentUserId={user?.id}
      onLike={handleLike}
      onSave={handleSave}
      onShare={handleShare}
      onCommentPress={handleCommentPress}
      onReport={handleReport}
      onDelete={handleDelete}
      onHotVote={item.isAudioPost ? handleHotVote : undefined}
      onNotVote={item.isAudioPost ? handleNotVote : undefined}
      onUserPress={handleUserPress}
    />
  );

  const renderEmpty = () => (
    <View className="items-center justify-center py-20">
      {loading ? (
        <ActivityIndicator size="large" color="#8B5CF6" />
      ) : (
        <>
          <Ionicons name="images-outline" size={64} color="#6B7280" />
          <Text className="text-gray-400 text-lg mt-4">No posts yet</Text>
          <Text className="text-gray-500 text-sm mt-2">Be the first to share something!</Text>
          <Pressable
            onPress={() => navigation.navigate("CreatePost")}
            className="mt-6 bg-purple-600 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">Create Post</Text>
          </Pressable>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#050509]" edges={["top"]}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={Platform.OS === 'web' ? { maxWidth: 600, width: '100%', alignSelf: 'center' } : {}}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B5CF6"
            colors={["#8B5CF6"]}
          />
        }
      />
    </SafeAreaView>
  );
}
