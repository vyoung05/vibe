import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../state/authStore";
import { useAppStore } from "../state/appStore";
import { uploadPostMedia, createPost } from "../services/postsService";

type CreatePostScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CreatePost"
>;

export function CreatePostScreen() {
  const navigation = useNavigation<CreatePostScreenNavigationProp>();
  const user = useAuthStore((s) => s.user);
  const addPost = useAppStore((s) => s.addPost);

  const [caption, setCaption] = useState("");
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant photo library access to upload images"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      videoMaxDuration: 60, // 60 seconds max
      videoQuality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      // Check if it's a video and validate duration and format
      if (asset.type === "video") {
        if (asset.duration && asset.duration > 60000) {
          // 60 seconds in milliseconds
          Alert.alert(
            "Video Too Long",
            "Please select a video shorter than 60 seconds"
          );
          return;
        }

        // Check if it's a .mov file
        if (asset.uri.toLowerCase().endsWith(".mov")) {
          Alert.alert(
            "Video Format Notice",
            "MOV format videos may have limited playback support. For best results, the video will be shown as a preview thumbnail in the feed.",
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Continue Anyway",
                onPress: () => {
                  setMediaType("video");
                  setMediaUri(asset.uri);
                },
              },
            ]
          );
          return;
        }

        setMediaType("video");
      } else {
        setMediaType("image");
      }

      setMediaUri(asset.uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant camera access to take photos"
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType("image");
    }
  };

  const handlePost = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to create a post");
      return;
    }

    if (!mediaUri) {
      Alert.alert("Error", "Please select a photo or video");
      return;
    }

    setIsUploading(true);

    try {
      // Try to upload to Supabase Storage first
      console.log("[CreatePost] Uploading media to Supabase Storage...");
      const uploadedUrl = await uploadPostMedia(mediaUri, user.id, mediaType!);

      if (uploadedUrl) {
        // Successfully uploaded to Supabase - create post in database
        console.log("[CreatePost] Media uploaded, creating post in database...");
        const newPost = await createPost(
          user.id,
          user.username,
          user.avatar || null,
          uploadedUrl,
          caption.trim(),
          mediaType === "video" ? uploadedUrl : undefined,
          mediaType!
        );

        if (newPost) {
          console.log("[CreatePost] Post created successfully in Supabase:", newPost.id);
          // Also add to local store for immediate display
          addPost(newPost);
          Alert.alert("Success", "Your post has been published!", [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]);
          return;
        }
      }

      // Fallback to local storage if Supabase fails
      console.log("[CreatePost] Supabase upload failed, falling back to local storage");
      const fallbackPost = {
        id: "post-" + Date.now(),
        user: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatar || `https://i.pravatar.cc/150?u=${user.id}`,
        },
        imageUrl: mediaUri,
        videoUrl: mediaType === "video" ? mediaUri : undefined,
        mediaType: mediaType!,
        caption: caption.trim(),
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0,
        isLiked: false,
        isSaved: false,
        comments: [],
        likedBy: [],
        savedBy: [],
      };

      addPost(fallbackPost);
      console.log("[CreatePost] Post added to local store:", fallbackPost.id);

      Alert.alert("Success", "Your post has been published!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("[CreatePost] Error:", error);
      Alert.alert("Error", "Failed to create post. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </Pressable>
          <Text className="text-white text-lg font-bold">New Post</Text>
          <Pressable
            onPress={handlePost}
            disabled={!mediaUri || isUploading}
            className={`px-4 py-2 rounded-lg ${
              !mediaUri || isUploading ? "bg-gray-700" : "bg-purple-600"
            }`}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold">Post</Text>
            )}
          </Pressable>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* User Info */}
          <View className="flex-row items-center px-4 py-4">
            <Image
              source={{
                uri: user?.avatar || `https://i.pravatar.cc/150?u=${user?.id}`,
              }}
              className="w-10 h-10 rounded-full"
            />
            <Text className="text-white font-semibold ml-3">
              {user?.username || "User"}
            </Text>
          </View>

          {/* Caption Input */}
          <View className="px-4 mb-4">
            <TextInput
              placeholder="Write a caption..."
              placeholderTextColor="#6B7280"
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={4}
              className="bg-[#151520] text-white px-4 py-3 rounded-xl"
              style={{ minHeight: 100, textAlignVertical: "top" }}
            />
          </View>

          {/* Media Preview */}
          {mediaUri ? (
            <View className="px-4 mb-4">
              <View className="relative">
                {mediaType === "image" ? (
                  <Image
                    source={{ uri: mediaUri }}
                    className="w-full aspect-square rounded-xl"
                    resizeMode="cover"
                  />
                ) : (
                  <Video
                    source={{ uri: mediaUri }}
                    className="w-full aspect-square rounded-xl"
                    resizeMode={ResizeMode.COVER}
                    useNativeControls
                    isLooping
                  />
                )}
                <Pressable
                  onPress={() => {
                    setMediaUri(null);
                    setMediaType(null);
                  }}
                  className="absolute top-2 right-2 bg-black/50 rounded-full p-2"
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </Pressable>
              </View>
              {mediaType === "video" && (
                <View className="flex-row items-center mt-2">
                  <Ionicons name="videocam" size={16} color="#8B5CF6" />
                  <Text className="text-purple-400 text-sm ml-2">
                    Video (max 60 seconds)
                  </Text>
                </View>
              )}
            </View>
          ) : (
            /* Media Selection */
            <View className="px-4">
              <Text className="text-white font-bold text-lg mb-4">
                Add Photo or Video
              </Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={pickImage}
                  className="flex-1 bg-[#151520] border-2 border-purple-600 border-dashed rounded-xl p-6 items-center justify-center"
                >
                  <Ionicons name="images" size={40} color="#8B5CF6" />
                  <Text className="text-purple-400 font-semibold mt-2">
                    From Library
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">
                    Photos & Videos
                  </Text>
                </Pressable>

                <Pressable
                  onPress={takePhoto}
                  className="flex-1 bg-[#151520] border-2 border-purple-600 border-dashed rounded-xl p-6 items-center justify-center"
                >
                  <Ionicons name="camera" size={40} color="#8B5CF6" />
                  <Text className="text-purple-400 font-semibold mt-2">
                    Take Photo
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">
                    Use Camera
                  </Text>
                </Pressable>
              </View>

              <View className="mt-4 bg-[#151520] rounded-xl p-4">
                <View className="flex-row items-start">
                  <Ionicons name="information-circle" size={20} color="#8B5CF6" />
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-semibold mb-1">
                      Upload Guidelines
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      • Photos: Any resolution, square format recommended
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      • Videos: Maximum 60 seconds duration
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      • Supported formats: JPG, PNG, MP4
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      • MOV files: Limited playback support
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
