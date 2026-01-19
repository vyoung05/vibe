import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  Share,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { PostCard } from "../components/PostCard";
import { mockPosts } from "../data/mockPosts";
import type { Post } from "../types/post";
import type { Report, ReportReason } from "../types";
import { useAppStore } from "../state/appStore";
import { useAuthStore } from "../state/authStore";

type HomeFeedScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function HomeFeedScreen() {
  const navigation = useNavigation<HomeFeedScreenNavigationProp>();
  const user = useAuthStore((s) => s.user);
  const getPosts = useAppStore((s) => s.getPosts);
  const likePost = useAppStore((s) => s.likePost);
  const savePost = useAppStore((s) => s.savePost);
  const deletePost = useAppStore((s) => s.deletePost);
  const submitReport = useAppStore((s) => s.submitReport);
  const voteHot = useAppStore((s) => s.voteHot);
  const voteNot = useAppStore((s) => s.voteNot);

  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load posts when screen comes into focus or when user data changes
  useFocusEffect(
    React.useCallback(() => {
      loadPosts();
    }, [user?.id, user?.avatar, user?.username])
  );

  const loadPosts = () => {
    const storePosts = getPosts(user?.id);

    // Get all user accounts to sync avatars
    const userAccounts = useAppStore.getState().userAccounts;
    const streamerAccounts = useAppStore.getState().streamerAccounts;

    // Update posts with current user avatars
    const postsWithUpdatedAvatars = storePosts.map((post) => {
      // First check if this is the current logged-in user's post
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

      // Update avatar if we found the user or streamer account
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
        // Use the streamer data from streamerAccounts (this includes dynamically created streamers)
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

    // Combine store posts with mock posts
    setPosts([...postsWithUpdatedAvatars, ...mockPosts]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleLike = (postId: string) => {
    if (!user) return;
    likePost(postId, user.id);
    loadPosts();
  };

  const handleSave = (postId: string) => {
    if (!user) return;
    savePost(postId, user.id);
    loadPosts();
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

  const handleDelete = (postId: string) => {
    if (!user) return;

    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const success = deletePost(postId, user.id);
            if (success) {
              loadPosts();
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

  return (
    <SafeAreaView className="flex-1 bg-[#050509]" edges={["top"]}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
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
