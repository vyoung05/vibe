import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../state/authStore";
import { useAppStore } from "../state/appStore";
import type { Track } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CreateMusicSheetRouteProp = RouteProp<RootStackParamList, "CreateMusicSheet">;

export const CreateMusicSheetScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CreateMusicSheetRouteProp>();
  const { artistId } = route.params;

  const user = useAuthStore((s) => s.user);
  const artists = useAppStore((s) => s.artists);
  const addTrack = useAppStore((s) => s.addTrack);
  const addPost = useAppStore((s) => s.addPost);

  const artist = artists.find((a) => a.id === artistId);

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [coverArt, setCoverArt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const genres = ["Hip Hop", "R&B", "Pop", "Rock", "Electronic", "Jazz", "Classical", "Country", "Reggae", "Latin"];
  const moods = ["Energetic", "Chill", "Sad", "Happy", "Romantic", "Dark", "Uplifting", "Aggressive"];

  const handlePickCoverArt = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverArt(result.assets[0].uri);
    }
  };

  const handleCreateMusic = async () => {
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate music creation process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create a new track entry
    const newTrack: Track = {
      id: "track-" + Date.now(),
      artistId: artistId,
      title: title.trim(),
      coverArt: coverArt || artist?.avatar || "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Placeholder audio
      duration: 180,
      price: undefined,
      isSnippetOnly: false,
      snippetDuration: 30,
      playCount: 0,
      hotVotes: 0,
      notVotes: 0,
      purchaseCount: 0,
      createdAt: new Date().toISOString(),
    };

    addTrack(artistId, newTrack);

    // Also create a post to share on feed
    if (user && artist) {
      const newPost = {
        id: "post-" + Date.now(),
        user: {
          id: artist.id,
          username: artist.stageName,
          avatar: artist.avatar,
          isArtist: true,
          isVerified: artist.isVerified,
        },
        caption: `New track "${title}" is out now! ${genre ? `#${genre.replace(/\s/g, "")}` : ""} ${mood ? `#${mood}` : ""}`,
        imageUrl: coverArt || artist.avatar,
        videoUrl: undefined,
        audioUrl: newTrack.audioUrl,
        isAudioPost: true,
        trackId: newTrack.id,
        artistId: artist.id,
        likeCount: 0,
        commentCount: 0,
        comments: [],
        likedBy: [],
        savedBy: [],
        createdAt: new Date().toISOString(),
      };

      addPost(newPost);
    }

    setIsCreating(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  if (!artist) {
    return (
      <View className="flex-1 bg-[#0A0A0F] items-center justify-center">
        <Text className="text-white text-lg">Artist not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-5 pb-4 border-b border-[#1F1F2E]"
          style={{ paddingTop: insets.top + 12 }}
        >
          <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Ionicons name="close" size={28} color="white" />
          </Pressable>
          <Text className="text-white text-lg font-bold">Create Music</Text>
          <Pressable
            onPress={handleCreateMusic}
            disabled={!title.trim() || isCreating}
            className={`px-5 py-2 rounded-full ${title.trim() && !isCreating ? "bg-purple-600" : "bg-gray-700"}`}
          >
            <Text className={`font-bold ${title.trim() && !isCreating ? "text-white" : "text-gray-400"}`}>
              {isCreating ? "Creating..." : "Create"}
            </Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="p-5">
            {/* Cover Art */}
            <View className="items-center mb-6">
              <Pressable onPress={handlePickCoverArt} className="relative">
                {coverArt ? (
                  <Image
                    source={{ uri: coverArt }}
                    className="w-48 h-48 rounded-2xl"
                    contentFit="cover"
                  />
                ) : (
                  <View className="w-48 h-48 rounded-2xl bg-[#1F1F2E] items-center justify-center">
                    <Ionicons name="musical-notes" size={48} color="#4B5563" />
                    <Text className="text-gray-500 mt-2">Add Cover Art</Text>
                  </View>
                )}
                <View className="absolute bottom-2 right-2 bg-purple-600 rounded-full p-2">
                  <Ionicons name="camera" size={20} color="white" />
                </View>
              </Pressable>
            </View>

            {/* Title */}
            <View className="mb-5">
              <Text className="text-gray-400 text-sm mb-2">Track Title *</Text>
              <TextInput
                placeholder="Enter track title"
                placeholderTextColor="#6B7280"
                value={title}
                onChangeText={setTitle}
                className="bg-[#151520] text-white px-4 py-4 rounded-xl text-lg"
              />
            </View>

            {/* Genre Selection */}
            <View className="mb-5">
              <Text className="text-gray-400 text-sm mb-3">Genre</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row">
                  {genres.map((g) => (
                    <Pressable
                      key={g}
                      onPress={() => {
                        setGenre(genre === g ? "" : g);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      className={`px-4 py-2 rounded-full mr-2 ${
                        genre === g ? "bg-purple-600" : "bg-[#1F1F2E]"
                      }`}
                    >
                      <Text className={genre === g ? "text-white font-semibold" : "text-gray-400"}>
                        {g}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Mood Selection */}
            <View className="mb-5">
              <Text className="text-gray-400 text-sm mb-3">Mood</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row">
                  {moods.map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => {
                        setMood(mood === m ? "" : m);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      className={`px-4 py-2 rounded-full mr-2 ${
                        mood === m ? "bg-pink-600" : "bg-[#1F1F2E]"
                      }`}
                    >
                      <Text className={mood === m ? "text-white font-semibold" : "text-gray-400"}>
                        {m}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Lyrics */}
            <View className="mb-5">
              <Text className="text-gray-400 text-sm mb-2">Lyrics (optional)</Text>
              <TextInput
                placeholder="Add lyrics or notes for your track..."
                placeholderTextColor="#6B7280"
                value={lyrics}
                onChangeText={setLyrics}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="bg-[#151520] text-white px-4 py-4 rounded-xl min-h-[150px]"
              />
            </View>

            {/* Info Section */}
            <View className="bg-[#151520] rounded-xl p-4 mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="information-circle" size={20} color="#8B5CF6" />
                <Text className="text-purple-400 font-semibold ml-2">How it works</Text>
              </View>
              <Text className="text-gray-400 text-sm leading-5">
                Create your music sheet and it will be added to your profile. Your new track will also be shared on the feed for your followers to discover.
              </Text>
            </View>

            {/* Artist Preview */}
            <View className="bg-[#151520] rounded-xl p-4">
              <Text className="text-gray-400 text-sm mb-3">Posting as</Text>
              <View className="flex-row items-center">
                <Image
                  source={{ uri: artist.avatar }}
                  className="w-12 h-12 rounded-full"
                  contentFit="cover"
                />
                <View className="ml-3">
                  <View className="flex-row items-center">
                    <Text className="text-white font-bold">{artist.stageName}</Text>
                    {artist.isVerified && (
                      <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" style={{ marginLeft: 4 }} />
                    )}
                  </View>
                  <Text className="text-gray-400 text-xs">{artist.followerCount.toLocaleString()} followers</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
