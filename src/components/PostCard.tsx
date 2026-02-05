import React, { useState, useEffect } from "react";
import { View, Text, Image, Pressable, Modal, Share, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import type { Post } from "../types/post";
import type { ReportReason } from "../types";
import { isYouTubeUrl, getPostThumbnail } from "../utils/videoUtils";

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onShare: (postId: string) => void;
  onCommentPress: (postId: string) => void;
  onReport?: (postId: string, reason: ReportReason, details?: string) => void;
  onDelete?: (postId: string) => void;
  onHotVote?: (postId: string) => void;
  onNotVote?: (postId: string) => void;
  onUserPress?: (userId: string, isArtist?: boolean) => void;
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onSave,
  onShare,
  onCommentPress,
  onReport,
  onDelete,
  onHotVote,
  onNotVote,
  onUserPress,
}: PostCardProps) {
  const [isDoubleTapLike, setIsDoubleTapLike] = useState(false);
  const [lastTap, setLastTap] = useState<number>(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState<ReportReason | null>(null);
  // Audio state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const isOwner = currentUserId === post.user.id;

  // Check if this is a playable video
  const isYouTubeVideo = post.videoUrl ? isYouTubeUrl(post.videoUrl) : false;
  const shouldShowVideoPlayer = post.mediaType === "video" && post.videoUrl && !isYouTubeVideo;
  const thumbnailUrl = getPostThumbnail(post);

  // Create video player using expo-video hook
  const player = useVideoPlayer(shouldShowVideoPlayer ? post.videoUrl! : null, (player) => {
    player.loop = true;
    player.muted = false;
  });

  // Listen for player status changes
  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener("statusChange", (event) => {
      if (event.status === "readyToPlay") {
        setVideoError(null);
      } else if (event.status === "error") {
        setVideoError("Video unavailable");
        setShowThumbnail(true);
      }
    });

    const playingSubscription = player.addListener("playingChange", (event) => {
      setIsVideoPlaying(event.isPlaying);
      if (event.isPlaying) {
        setShowThumbnail(false);
      }
    });

    return () => {
      subscription.remove();
      playingSubscription.remove();
    };
  }, [player]);

  // Reset state when post changes
  useEffect(() => {
    setIsVideoPlaying(false);
    setShowThumbnail(true);
    setVideoError(null);
  }, [post.id]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Audio playback for audio posts
  const handleAudioPlay = async () => {
    if (!post.audioUrl) return;

    try {
      if (sound) {
        if (isAudioPlaying) {
          await sound.pauseAsync();
          setIsAudioPlaying(false);
        } else {
          await sound.playAsync();
          setIsAudioPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: post.audioUrl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setAudioProgress(status.positionMillis / (status.durationMillis || 1));
              if (status.didJustFinish) {
                setIsAudioPlaying(false);
                setAudioProgress(0);
              }
            }
          }
        );
        setSound(newSound);
        setIsAudioPlaying(true);
      }
    } catch (error) {
      console.error("Audio playback error:", error);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Check out this post from ${post.user.username} on DDNS: ${post.caption}`,
      });
      onShare(post.id);
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleReport = (reason: ReportReason) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (onReport) {
      onReport(post.id, reason);
    }
    setShowReportModal(false);
    setShowOptionsModal(false);
    setSelectedReportReason(null);
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (onDelete) {
      onDelete(post.id);
    }
    setShowOptionsModal(false);
  };

  const reportReasons: { key: ReportReason; label: string; icon: string }[] = [
    { key: "inappropriate", label: "Inappropriate Content", icon: "alert-circle" },
    { key: "spam", label: "Spam", icon: "megaphone" },
    { key: "harassment", label: "Harassment or Bullying", icon: "sad" },
    { key: "fraud", label: "Fraud or Scam", icon: "warning" },
    { key: "hacking", label: "Hacking or Security Threat", icon: "shield" },
    { key: "hate_speech", label: "Hate Speech", icon: "ban" },
    { key: "violence", label: "Violence or Threats", icon: "skull" },
    { key: "other", label: "Other", icon: "ellipsis-horizontal" },
  ];

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      if (!post.isLiked) {
        onLike(post.id);
        setIsDoubleTapLike(true);
        setTimeout(() => setIsDoubleTapLike(false), 1000);
      }
    }
    setLastTap(now);
  };

  const handleVideoPress = () => {
    if (!player) return;

    if (videoError) {
      // Try to replay on error
      setVideoError(null);
      player.play();
      return;
    }

    if (isVideoPlaying) {
      player.pause();
      setIsVideoPlaying(false);
    } else {
      player.play();
      setIsVideoPlaying(true);
      setShowThumbnail(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  const formatLikeCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <View className="bg-[#050509] mb-4">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => onUserPress?.(post.user.id, post.user.isArtist)}
          className="flex-row items-center flex-1"
        >
          <Image
            source={{ uri: post.user.avatarUrl || `https://i.pravatar.cc/150?u=${post.user.id}` }}
            className="w-10 h-10 rounded-full"
            defaultSource={{ uri: `https://i.pravatar.cc/150?u=${post.user.id}` }}
          />
          <View className="flex-row items-center ml-3 flex-1">
            <Text className="text-white font-semibold text-base">
              {post.user.username}
            </Text>
            {post.user.isVerified && (
              <View className="ml-1.5 bg-purple-500 rounded-full p-0.5">
                <Ionicons name="checkmark" size={10} color="white" />
              </View>
            )}
            {post.user.isArtist && (
              <View className="ml-1.5 bg-pink-500 rounded-full p-0.5">
                <Ionicons name="musical-notes" size={10} color="white" />
              </View>
            )}
          </View>
        </Pressable>
        <Pressable
          className="p-2"
          onPress={() => setShowOptionsModal(true)}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
        </Pressable>
      </View>

      {/* Main Image/Video/Audio */}
      <Pressable onPress={post.mediaType === "video" ? handleVideoPress : post.mediaType === "audio" ? handleAudioPlay : handleDoubleTap}>
        <View className="relative">
          {shouldShowVideoPlayer && player ? (
            <>
              {/* Video player using expo-video */}
              <VideoView
                player={player}
                style={{ width: "100%", aspectRatio: 1 }}
                contentFit="cover"
                nativeControls={false}
                allowsFullscreen={false}
                allowsPictureInPicture={false}
              />

              {/* Show thumbnail when not playing */}
              {showThumbnail && !videoError && thumbnailUrl && (
                <View className="absolute inset-0">
                  <Image
                    source={{ uri: thumbnailUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* Error state */}
              {videoError && (
                <View className="absolute inset-0 items-center justify-center bg-black/60">
                  <Ionicons name="alert-circle" size={48} color="#EF4444" />
                  <Text className="text-white text-sm mt-2">{videoError}</Text>
                  <Text className="text-gray-400 text-xs mt-1">Tap to retry</Text>
                </View>
              )}

              {/* Play button overlay */}
              {!isVideoPlaying && !videoError && (
                <View className="absolute inset-0 items-center justify-center">
                  <View className="bg-black/50 rounded-full p-4">
                    <Ionicons name="play" size={48} color="#FFFFFF" />
                  </View>
                </View>
              )}

              {/* Video badge */}
              <View className="absolute top-2 left-2 bg-purple-600/90 rounded-full px-3 py-1 flex-row items-center">
                <Ionicons name="videocam" size={16} color="#FFFFFF" />
                <Text className="text-white text-xs font-semibold ml-1">VIDEO</Text>
              </View>

              {/* Playing indicator */}
              {isVideoPlaying && (
                <View className="absolute bottom-2 right-2 bg-black/70 rounded-full px-2 py-1 flex-row items-center">
                  <Ionicons name="pause" size={16} color="#FFFFFF" />
                  <Text className="text-white text-xs ml-1">Tap to pause</Text>
                </View>
              )}
            </>
          ) : post.mediaType === "video" && thumbnailUrl ? (
            // YouTube videos - show thumbnail with YouTube branding
            <>
              <Image
                source={{ uri: thumbnailUrl }}
                className="w-full aspect-square"
                resizeMode="cover"
              />
              <View className="absolute inset-0 items-center justify-center bg-black/60">
                <View className="items-center">
                  <Ionicons name="logo-youtube" size={60} color="#FF0000" />
                  <Text className="text-white text-sm mt-2 font-semibold">YouTube Video</Text>
                  <Text className="text-gray-300 text-xs mt-1">Open in browser to watch</Text>
                </View>
                <View className="absolute top-2 left-2 bg-purple-600/90 rounded-full px-3 py-1 flex-row items-center">
                  <Ionicons name="videocam" size={16} color="#FFFFFF" />
                  <Text className="text-white text-xs font-semibold ml-1">VIDEO</Text>
                </View>
              </View>
            </>
          ) : post.mediaType === "audio" && post.imageUrl ? (
            // Audio post with cover image
            <>
              <Image
                source={{ uri: post.imageUrl }}
                className="w-full aspect-square"
                resizeMode="cover"
              />
              <View className="absolute inset-0 items-center justify-center bg-black/40">
                <View className="bg-black/70 rounded-full p-6">
                  <Ionicons
                    name={isAudioPlaying ? "pause" : "play"}
                    size={48}
                    color="#FFFFFF"
                  />
                </View>
                {/* Audio progress bar */}
                <View className="absolute bottom-4 left-4 right-4">
                  <View className="h-1 bg-white/30 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-pink-500 rounded-full"
                      style={{ width: `${audioProgress * 100}%` }}
                    />
                  </View>
                </View>
              </View>
              {/* Audio badge */}
              <View className="absolute top-2 left-2 bg-pink-600/90 rounded-full px-3 py-1 flex-row items-center">
                <Ionicons name="musical-notes" size={16} color="#FFFFFF" />
                <Text className="text-white text-xs font-semibold ml-1">AUDIO</Text>
              </View>
              {post.isSnippet && (
                <View className="absolute top-2 right-2 bg-amber-500/90 rounded-full px-2 py-1">
                  <Text className="text-white text-xs font-semibold">SNIPPET</Text>
                </View>
              )}
            </>
          ) : post.imageUrl ? (
            <Image
              source={{ uri: post.imageUrl }}
              className="w-full aspect-square"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full aspect-square bg-gray-800 items-center justify-center">
              <Ionicons name="image-outline" size={60} color="#6B7280" />
              <Text className="text-gray-400 mt-2">No media</Text>
            </View>
          )}
          {isDoubleTapLike && (
            <View className="absolute inset-0 items-center justify-center">
              <View className="bg-black/30 rounded-full p-4">
                <Ionicons name="heart" size={80} color="#FF1744" />
              </View>
            </View>
          )}
        </View>
      </Pressable>

      {/* Action Buttons */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable 
          onPress={() => onLike(post.id)} 
          className="mr-4"
          style={({ hovered }: any) => Platform.OS === "web" && hovered ? {
            transform: [{ scale: 1.2 }],
            transition: "transform 0.15s ease",
          } : {}}
        >
          <Ionicons
            name={post.isLiked ? "heart" : "heart-outline"}
            size={28}
            color={post.isLiked ? "#FF1744" : "#FFFFFF"}
          />
        </Pressable>
        <Pressable
          onPress={() => onCommentPress(post.id)}
          className="mr-4"
          style={({ hovered }: any) => Platform.OS === "web" && hovered ? {
            transform: [{ scale: 1.2 }],
            transition: "transform 0.15s ease",
          } : {}}
        >
          <Ionicons name="chatbubble-outline" size={28} color="#FFFFFF" />
        </Pressable>
        <Pressable 
          onPress={handleShare} 
          className="mr-auto"
          style={({ hovered }: any) => Platform.OS === "web" && hovered ? {
            transform: [{ scale: 1.2 }],
            transition: "transform 0.15s ease",
          } : {}}
        >
          <Ionicons name="paper-plane-outline" size={26} color="#FFFFFF" />
        </Pressable>
        <Pressable 
          onPress={() => onSave(post.id)}
          style={({ hovered }: any) => Platform.OS === "web" && hovered ? {
            transform: [{ scale: 1.2 }],
            transition: "transform 0.15s ease",
          } : {}}
        >
          <Ionicons
            name={post.isSaved ? "bookmark" : "bookmark-outline"}
            size={26}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      {/* Hot or Not Voting for Music Posts */}
      {post.isAudioPost && onHotVote && onNotVote && (
        <View className="px-4 pb-3">
          <View className="flex-row items-center justify-center bg-[#1C1C24] rounded-xl p-3">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onHotVote(post.id);
              }}
              className="flex-1 flex-row items-center justify-center py-2 bg-orange-500/20 rounded-l-lg border-r border-gray-700"
            >
              <Ionicons name="flame" size={24} color="#F97316" />
              <Text className="text-orange-400 font-bold ml-2">HOT</Text>
              <Text className="text-orange-300 text-sm ml-2">
                {post.hotVotes || 0}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onNotVote(post.id);
              }}
              className="flex-1 flex-row items-center justify-center py-2 bg-blue-500/20 rounded-r-lg"
            >
              <Ionicons name="snow" size={24} color="#3B82F6" />
              <Text className="text-blue-400 font-bold ml-2">NOT</Text>
              <Text className="text-blue-300 text-sm ml-2">
                {post.notVotes || 0}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Like Count */}
      {post.likeCount > 0 && (
        <View className="px-4 pb-2">
          <Text className="text-white font-semibold text-sm">
            {formatLikeCount(post.likeCount)} likes
          </Text>
        </View>
      )}

      {/* Caption */}
      {post.caption && (
        <View className="px-4 pb-2">
          <Text className="text-white">
            <Text className="font-semibold">{post.user.username}</Text>
            <Text className="text-gray-200"> {post.caption}</Text>
          </Text>
        </View>
      )}

      {/* View Comments */}
      {post.commentCount > 0 && (
        <Pressable
          onPress={() => onCommentPress(post.id)}
          className="px-4 pb-2"
        >
          <Text className="text-gray-400 text-sm">
            View all {post.commentCount} comments
          </Text>
        </Pressable>
      )}

      {/* Preview Comments */}
      {post.comments.length > 0 && (
        <View className="px-4 pb-2">
          {post.comments.slice(0, 2).map((comment) => (
            <View key={comment.id} className="flex-row items-start mb-1">
              {comment.avatarUrl && (
                <Image
                  source={{ uri: comment.avatarUrl }}
                  className="w-6 h-6 rounded-full mr-2"
                />
              )}
              <Text className="text-white text-sm flex-1">
                <Text className="font-semibold">{comment.username}</Text>
                <Text className="text-gray-200"> {comment.text}</Text>
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Timestamp */}
      <View className="px-4 pb-3">
        <Text className="text-gray-500 text-xs uppercase">
          {formatTimeAgo(post.createdAt)}
        </Text>
      </View>

      {/* Options Modal */}
      <Modal visible={showOptionsModal} animationType="slide" transparent>
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowOptionsModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-[#151520] rounded-t-3xl p-6">
              <View className="w-12 h-1 bg-gray-600 rounded-full self-center mb-6" />

              {isOwner && onDelete && (
                <Pressable
                  onPress={handleDelete}
                  className="flex-row items-center py-4 border-b border-gray-800"
                >
                  <View className="w-10 h-10 rounded-full bg-red-500/20 items-center justify-center">
                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  </View>
                  <Text className="text-red-400 font-semibold ml-4 text-base">Delete Post</Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => {
                  setShowOptionsModal(false);
                  setShowReportModal(true);
                }}
                className="flex-row items-center py-4 border-b border-gray-800"
              >
                <View className="w-10 h-10 rounded-full bg-orange-500/20 items-center justify-center">
                  <Ionicons name="flag-outline" size={22} color="#F97316" />
                </View>
                <Text className="text-orange-400 font-semibold ml-4 text-base">Report Post</Text>
              </Pressable>

              <Pressable
                onPress={handleShare}
                className="flex-row items-center py-4 border-b border-gray-800"
              >
                <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center">
                  <Ionicons name="share-outline" size={22} color="#3B82F6" />
                </View>
                <Text className="text-blue-400 font-semibold ml-4 text-base">Share Post</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  onSave(post.id);
                  setShowOptionsModal(false);
                }}
                className="flex-row items-center py-4"
              >
                <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center">
                  <Ionicons
                    name={post.isSaved ? "bookmark" : "bookmark-outline"}
                    size={22}
                    color="#A855F7"
                  />
                </View>
                <Text className="text-purple-400 font-semibold ml-4 text-base">
                  {post.isSaved ? "Unsave Post" : "Save Post"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setShowOptionsModal(false)}
                className="mt-4 bg-[#1C1C24] py-4 rounded-xl"
              >
                <Text className="text-white text-center font-semibold">Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Report Modal */}
      <Modal visible={showReportModal} animationType="slide" transparent>
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowReportModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-[#151520] rounded-t-3xl p-6" style={{ maxHeight: "80%" }}>
              <View className="w-12 h-1 bg-gray-600 rounded-full self-center mb-4" />

              <Text className="text-white text-xl font-bold text-center mb-2">
                Report Post
              </Text>
              <Text className="text-gray-400 text-center text-sm mb-6">
                Why are you reporting this post?
              </Text>

              {reportReasons.map((reason) => (
                <Pressable
                  key={reason.key}
                  onPress={() => handleReport(reason.key)}
                  className="flex-row items-center py-3 border-b border-gray-800"
                >
                  <View className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center">
                    <Ionicons name={reason.icon as any} size={20} color="#EF4444" />
                  </View>
                  <Text className="text-white font-medium ml-4">{reason.label}</Text>
                  <View className="flex-1" />
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </Pressable>
              ))}

              <Pressable
                onPress={() => setShowReportModal(false)}
                className="mt-4 bg-[#1C1C24] py-4 rounded-xl"
              >
                <Text className="text-white text-center font-semibold">Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
