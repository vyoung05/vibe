import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps, NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { Streamer, StreamSchedule } from "../types";
import { useAppStore } from "../state/appStore";

type Props = NativeStackScreenProps<RootStackParamList, "EditStreamerProfile">;
type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export function EditStreamerProfileScreen({ navigation, route }: Props) {
  const { streamerId } = route.params;
  const rootNavigation = useNavigation<RootNavigation>();
  const streamers = useAppStore((s) => s.streamers);
  const updateStreamer = useAppStore((s) => s.updateStreamer);

  const streamer = streamers.find((s) => s.id === streamerId);

  // Form state - initialize with defaults before early return
  const [displayName, setDisplayName] = useState(streamer?.name || "");
  const [handle, setHandle] = useState(streamer?.gamertag || "");
  const [bio, setBio] = useState(streamer?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(streamer?.avatar || "");
  const [coverImages, setCoverImages] = useState(streamer?.headerImages || []);
  const [twitchUrl, setTwitchUrl] = useState(streamer?.streamPlatforms?.twitch || "");
  const [youtubeUrl, setYoutubeUrl] = useState(streamer?.streamPlatforms?.youtube || "");
  const [tiktokUrl, setTiktokUrl] = useState(streamer?.streamPlatforms?.tiktok || "");
  const [instagramUrl, setInstagramUrl] = useState(streamer?.streamPlatforms?.instagram || "");
  const [kickUrl, setKickUrl] = useState(streamer?.socialLinks?.kick || "");
  const [twitterUrl, setTwitterUrl] = useState(streamer?.socialLinks?.twitter || "");
  const [schedule, setSchedule] = useState<StreamSchedule[]>(streamer?.schedule || []);
  const [loading, setLoading] = useState(false);
  const [handleError, setHandleError] = useState("");

  const bioMaxLength = 250;
  const bioCharCount = bio.length;

  if (!streamer) {
    return (
      <View className="flex-1 bg-[#050509] items-center justify-center">
        <Text className="text-white">Streamer not found</Text>
      </View>
    );
  }

  // Image picker for avatar
  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  // Image picker for cover
  const pickCoverImage = async (index?: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newCoverImages = [...coverImages];
      if (index !== undefined && index < newCoverImages.length) {
        // Replace existing image at index
        newCoverImages[index] = result.assets[0].uri;
      } else {
        // Add new image
        newCoverImages.push(result.assets[0].uri);
      }
      setCoverImages(newCoverImages);
    }
  };

  // Remove cover image
  const removeCoverImage = (index: number) => {
    Alert.alert(
      "Remove Image",
      "Are you sure you want to remove this cover image?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const newCoverImages = coverImages.filter((_, i) => i !== index);
            setCoverImages(newCoverImages);
          },
        },
      ]
    );
  };

  // Move cover image up in carousel
  const moveCoverImageUp = (index: number) => {
    if (index === 0) return;
    const newCoverImages = [...coverImages];
    [newCoverImages[index - 1], newCoverImages[index]] = [newCoverImages[index], newCoverImages[index - 1]];
    setCoverImages(newCoverImages);
  };

  // Move cover image down in carousel
  const moveCoverImageDown = (index: number) => {
    if (index === coverImages.length - 1) return;
    const newCoverImages = [...coverImages];
    [newCoverImages[index], newCoverImages[index + 1]] = [newCoverImages[index + 1], newCoverImages[index]];
    setCoverImages(newCoverImages);
  };

  // Validate handle
  const validateHandle = (text: string) => {
    setHandle(text);
    setHandleError("");

    // Basic validation
    const handleRegex = /^[a-zA-Z0-9_.]+$/;
    if (!handleRegex.test(text)) {
      setHandleError("Only letters, numbers, underscore, and dots allowed");
      return;
    }

    // Check uniqueness (simulate - in real app, call API)
    const existingStreamer = streamers.find(
      (s) => s.id !== streamerId && s.gamertag.toLowerCase() === text.toLowerCase()
    );
    if (existingStreamer) {
      setHandleError("Handle already taken");
    }
  };

  // Add schedule slot
  const addScheduleSlot = () => {
    const newSlot: StreamSchedule = {
      day: "Monday",
      startTime: "20:00",
      endTime: "23:00",
      timezone: "EST",
    };
    setSchedule([...schedule, newSlot]);
  };

  // Update schedule slot
  const updateScheduleSlot = (index: number, field: keyof StreamSchedule, value: string) => {
    const updatedSchedule = [...schedule];
    updatedSchedule[index] = { ...updatedSchedule[index], [field]: value };
    setSchedule(updatedSchedule);
  };

  // Delete schedule slot
  const deleteScheduleSlot = (index: number) => {
    const updatedSchedule = schedule.filter((_, i) => i !== index);
    setSchedule(updatedSchedule);
  };

  // Validate URL
  const isValidUrl = (url: string) => {
    if (!url) return true; // Optional field
    return url.startsWith("http://") || url.startsWith("https://");
  };

  // Save changes
  const handleSave = async () => {
    // Validation
    if (!displayName.trim()) {
      Alert.alert("Error", "Display name is required");
      return;
    }

    if (displayName.trim().length < 2 || displayName.trim().length > 30) {
      Alert.alert("Error", "Display name must be 2-30 characters");
      return;
    }

    if (!handle.trim()) {
      Alert.alert("Error", "Handle is required");
      return;
    }

    if (handleError) {
      Alert.alert("Error", "Please fix handle errors before saving");
      return;
    }

    if (twitchUrl && !isValidUrl(twitchUrl)) {
      Alert.alert("Error", "Twitch URL must start with https://");
      return;
    }

    if (youtubeUrl && !isValidUrl(youtubeUrl)) {
      Alert.alert("Error", "YouTube URL must start with https://");
      return;
    }

    // Validate schedule times
    for (const slot of schedule) {
      if (slot.startTime >= slot.endTime) {
        Alert.alert("Error", `End time must be after start time for ${slot.day}`);
        return;
      }
    }

    setLoading(true);

    // Update streamer
    const updatedStreamer: Streamer = {
      ...streamer,
      name: displayName.trim(),
      gamertag: handle.trim(),
      bio: bio.trim(),
      avatar: avatarUrl,
      headerImages: coverImages,
      schedule,
      streamPlatforms: {
        ...streamer.streamPlatforms,
        twitch: twitchUrl || undefined,
        youtube: youtubeUrl || undefined,
        tiktok: tiktokUrl || undefined,
        instagram: instagramUrl || undefined,
      },
      socialLinks: {
        ...streamer.socialLinks,
        kick: kickUrl || undefined,
        twitter: twitterUrl || undefined,
        twitch: twitchUrl || undefined,
        youtube: youtubeUrl || undefined,
        tiktok: tiktokUrl || undefined,
        instagram: instagramUrl || undefined,
      },
    };

    updateStreamer(streamer.id, updatedStreamer);

    setLoading(false);
    Alert.alert("Success", "Profile updated successfully!", [
      { text: "OK", onPress: () => navigation.goBack() },
    ]);
  };

  const handleCancel = () => {
    Alert.alert("Discard Changes?", "Are you sure you want to discard your changes?", [
      { text: "Cancel", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#050509]" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <Pressable onPress={handleCancel}>
            <Text className="text-gray-400 text-base">Cancel</Text>
          </Pressable>
          <Text className="text-white text-lg font-semibold">Edit Profile</Text>
          <Pressable onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#8B5CF6" />
            ) : (
              <Text className="text-[#8B5CF6] text-base font-semibold">Save</Text>
            )}
          </Pressable>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4">
            {/* Hero/Cover Images (Carousel) */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white text-sm font-semibold">Hero Slide Images</Text>
                <Pressable
                  onPress={() => pickCoverImage()}
                  className="flex-row items-center"
                >
                  <Ionicons name="add-circle" size={20} color="#8B5CF6" />
                  <Text className="text-[#8B5CF6] text-sm ml-1">Add Image</Text>
                </Pressable>
              </View>
              <Text className="text-gray-500 text-xs mb-3">
                These images appear as a carousel on your profile. First image is shown on the homepage.
              </Text>

              {coverImages.length > 0 ? (
                <View>
                  {coverImages.map((imageUri, index) => (
                    <View
                      key={`cover-${index}`}
                      className="bg-[#1A1A1F] rounded-xl overflow-hidden mb-3"
                    >
                      <Pressable
                        onPress={() => pickCoverImage(index)}
                        style={{ aspectRatio: 16 / 9 }}
                      >
                        <Image source={{ uri: imageUri }} className="w-full h-full" />
                        <View className="absolute inset-0 items-center justify-center bg-black/40">
                          <Ionicons name="camera" size={28} color="#FFFFFF" />
                          <Text className="text-white text-xs mt-1">Tap to Replace</Text>
                        </View>
                        <View className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded-full">
                          <Text className="text-white text-xs font-bold">
                            {index === 0 ? "Main" : `Slide ${index + 1}`}
                          </Text>
                        </View>
                      </Pressable>

                      {/* Image Controls */}
                      <View className="flex-row items-center justify-between p-3 bg-[#0A0A0F]">
                        <View className="flex-row items-center">
                          <Pressable
                            onPress={() => moveCoverImageUp(index)}
                            disabled={index === 0}
                            className={`p-2 rounded-lg mr-2 ${index === 0 ? "bg-gray-800" : "bg-purple-600/30"}`}
                          >
                            <Ionicons
                              name="arrow-up"
                              size={18}
                              color={index === 0 ? "#4B5563" : "#8B5CF6"}
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => moveCoverImageDown(index)}
                            disabled={index === coverImages.length - 1}
                            className={`p-2 rounded-lg ${index === coverImages.length - 1 ? "bg-gray-800" : "bg-purple-600/30"}`}
                          >
                            <Ionicons
                              name="arrow-down"
                              size={18}
                              color={index === coverImages.length - 1 ? "#4B5563" : "#8B5CF6"}
                            />
                          </Pressable>
                        </View>
                        <Pressable
                          onPress={() => removeCoverImage(index)}
                          className="bg-red-600/20 p-2 rounded-lg"
                        >
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Pressable
                  onPress={() => pickCoverImage()}
                  className="bg-[#1A1A1F] rounded-xl overflow-hidden border-2 border-dashed border-gray-700"
                  style={{ aspectRatio: 16 / 9 }}
                >
                  <View className="flex-1 items-center justify-center">
                    <Ionicons name="images-outline" size={48} color="#6B7280" />
                    <Text className="text-gray-400 mt-2">Add Hero Slide Images</Text>
                    <Text className="text-gray-600 text-xs mt-1">Tap to add your first image</Text>
                  </View>
                </Pressable>
              )}
            </View>

            {/* Avatar */}
            <View className="mb-6">
              <Text className="text-white text-sm font-semibold mb-2">Profile Picture</Text>
              <Pressable onPress={pickAvatar} className="self-start">
                <View className="relative">
                  <Image source={{ uri: avatarUrl }} className="w-24 h-24 rounded-full" />
                  <View className="absolute inset-0 items-center justify-center bg-black/40 rounded-full">
                    <Ionicons name="camera" size={24} color="#FFFFFF" />
                  </View>
                </View>
              </Pressable>
            </View>

            {/* Display Name */}
            <View className="mb-4">
              <Text className="text-white text-sm font-semibold mb-2">Display Name *</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter display name"
                placeholderTextColor="#6B7280"
                className="bg-[#1A1A1F] text-white px-4 py-3 rounded-xl"
                maxLength={30}
              />
              <Text className="text-gray-500 text-xs mt-1">
                {displayName.length}/30 characters
              </Text>
            </View>

            {/* Handle */}
            <View className="mb-4">
              <Text className="text-white text-sm font-semibold mb-2">Handle *</Text>
              <View className="flex-row items-center bg-[#1A1A1F] rounded-xl px-4">
                <Text className="text-gray-400 text-base">@</Text>
                <TextInput
                  value={handle}
                  onChangeText={validateHandle}
                  placeholder="username"
                  placeholderTextColor="#6B7280"
                  className="flex-1 text-white py-3 px-2"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {handleError ? (
                <Text className="text-red-500 text-xs mt-1">{handleError}</Text>
              ) : null}
            </View>

            {/* Bio */}
            <View className="mb-6">
              <Text className="text-white text-sm font-semibold mb-2">Bio</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Tell your fans about yourself..."
                placeholderTextColor="#6B7280"
                className="bg-[#1A1A1F] text-white px-4 py-3 rounded-xl"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={bioMaxLength}
                style={{ minHeight: 100 }}
              />
              <Text className="text-gray-500 text-xs mt-1">
                {bioCharCount}/{bioMaxLength} characters
              </Text>
            </View>

            {/* Booking & Events Management */}
            <View className="mb-6">
              <Text className="text-white text-base font-semibold mb-3">Business Settings</Text>

              {/* Booking Settings */}
              <Pressable
                onPress={() => rootNavigation.navigate("StreamerBookingSettings", { streamerId })}
                className="bg-[#1A1A1F] rounded-xl p-4 mb-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-green-600/20 items-center justify-center mr-3">
                    <Ionicons name="calendar-outline" size={20} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold">Booking Settings</Text>
                    <Text className="text-gray-400 text-xs mt-1">
                      {streamer?.bookingSettings?.isBookable
                        ? `${streamer.bookingSettings.services.length} services available`
                        : "Set up bookable services"}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </Pressable>

              {/* Events */}
              <Pressable
                onPress={() => rootNavigation.navigate("StreamerEvents", { streamerId })}
                className="bg-[#1A1A1F] rounded-xl p-4 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-purple-600/20 items-center justify-center mr-3">
                    <Ionicons name="megaphone-outline" size={20} color="#8B5CF6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold">Events</Text>
                    <Text className="text-gray-400 text-xs mt-1">
                      {streamer?.events && streamer.events.length > 0
                        ? `${streamer.events.length} event${streamer.events.length > 1 ? "s" : ""} scheduled`
                        : "Create and manage events"}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </Pressable>
            </View>

            {/* Social Links */}
            <View className="mb-6">
              <Text className="text-white text-base font-semibold mb-3">Streaming Platforms</Text>

              <View className="mb-3">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="logo-twitch" size={18} color="#9146FF" />
                  <Text className="text-gray-400 text-sm ml-2">Twitch</Text>
                </View>
                <TextInput
                  value={twitchUrl}
                  onChangeText={setTwitchUrl}
                  placeholder="https://twitch.tv/yourhandle"
                  placeholderTextColor="#6B7280"
                  className="bg-[#1A1A1F] text-white px-4 py-3 rounded-xl"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>

              <View className="mb-3">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="logo-youtube" size={18} color="#FF0000" />
                  <Text className="text-gray-400 text-sm ml-2">YouTube</Text>
                </View>
                <TextInput
                  value={youtubeUrl}
                  onChangeText={setYoutubeUrl}
                  placeholder="https://youtube.com/@yourhandle"
                  placeholderTextColor="#6B7280"
                  className="bg-[#1A1A1F] text-white px-4 py-3 rounded-xl"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>

              <View className="mb-3">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="logo-tiktok" size={18} color="#FFFFFF" />
                  <Text className="text-gray-400 text-sm ml-2">TikTok</Text>
                </View>
                <TextInput
                  value={tiktokUrl}
                  onChangeText={setTiktokUrl}
                  placeholder="https://tiktok.com/@yourhandle"
                  placeholderTextColor="#6B7280"
                  className="bg-[#1A1A1F] text-white px-4 py-3 rounded-xl"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>

              <View className="mb-3">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="logo-instagram" size={18} color="#E4405F" />
                  <Text className="text-gray-400 text-sm ml-2">Instagram</Text>
                </View>
                <TextInput
                  value={instagramUrl}
                  onChangeText={setInstagramUrl}
                  placeholder="https://instagram.com/yourhandle"
                  placeholderTextColor="#6B7280"
                  className="bg-[#1A1A1F] text-white px-4 py-3 rounded-xl"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>

              <View className="mb-3">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="game-controller" size={18} color="#53FC18" />
                  <Text className="text-gray-400 text-sm ml-2">Kick</Text>
                </View>
                <TextInput
                  value={kickUrl}
                  onChangeText={setKickUrl}
                  placeholder="https://kick.com/yourhandle"
                  placeholderTextColor="#6B7280"
                  className="bg-[#1A1A1F] text-white px-4 py-3 rounded-xl"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>

              <View>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="logo-twitter" size={18} color="#1DA1F2" />
                  <Text className="text-gray-400 text-sm ml-2">Twitter / X</Text>
                </View>
                <TextInput
                  value={twitterUrl}
                  onChangeText={setTwitterUrl}
                  placeholder="https://twitter.com/yourhandle"
                  placeholderTextColor="#6B7280"
                  className="bg-[#1A1A1F] text-white px-4 py-3 rounded-xl"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>
            </View>

            {/* Streaming Schedule */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-base font-semibold">Streaming Schedule</Text>
                <Pressable onPress={addScheduleSlot}>
                  <View className="flex-row items-center">
                    <Ionicons name="add-circle" size={20} color="#8B5CF6" />
                    <Text className="text-[#8B5CF6] text-sm ml-1">Add Slot</Text>
                  </View>
                </Pressable>
              </View>

              {schedule.map((slot, index) => (
                <View key={`${slot.day}-${index}`} className="bg-[#1A1A1F] rounded-xl p-4 mb-3">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-white font-medium">Slot {index + 1}</Text>
                    <Pressable onPress={() => deleteScheduleSlot(index)}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </Pressable>
                  </View>

                  {/* Day of Week */}
                  <View className="mb-2">
                    <Text className="text-gray-400 text-xs mb-1">Day</Text>
                    <TextInput
                      value={slot.day}
                      onChangeText={(text) => updateScheduleSlot(index, "day", text)}
                      placeholder="Monday"
                      placeholderTextColor="#6B7280"
                      className="bg-[#0A0A0F] text-white px-3 py-2 rounded-lg"
                    />
                  </View>

                  {/* Start Time */}
                  <View className="mb-2">
                    <Text className="text-gray-400 text-xs mb-1">Start Time</Text>
                    <TextInput
                      value={slot.startTime}
                      onChangeText={(text) => updateScheduleSlot(index, "startTime", text)}
                      placeholder="20:00"
                      placeholderTextColor="#6B7280"
                      className="bg-[#0A0A0F] text-white px-3 py-2 rounded-lg"
                    />
                  </View>

                  {/* End Time */}
                  <View className="mb-2">
                    <Text className="text-gray-400 text-xs mb-1">End Time</Text>
                    <TextInput
                      value={slot.endTime}
                      onChangeText={(text) => updateScheduleSlot(index, "endTime", text)}
                      placeholder="23:00"
                      placeholderTextColor="#6B7280"
                      className="bg-[#0A0A0F] text-white px-3 py-2 rounded-lg"
                    />
                  </View>

                  {/* Timezone */}
                  <View>
                    <Text className="text-gray-400 text-xs mb-1">Timezone</Text>
                    <TextInput
                      value={slot.timezone}
                      onChangeText={(text) => updateScheduleSlot(index, "timezone", text)}
                      placeholder="EST"
                      placeholderTextColor="#6B7280"
                      className="bg-[#0A0A0F] text-white px-3 py-2 rounded-lg"
                    />
                  </View>
                </View>
              ))}

              {schedule.length === 0 && (
                <View className="bg-[#1A1A1F] rounded-xl p-6 items-center">
                  <Ionicons name="calendar-outline" size={48} color="#6B7280" />
                  <Text className="text-gray-400 text-sm mt-2">No schedule added yet</Text>
                  <Text className="text-gray-500 text-xs text-center mt-1">
                    Add your streaming schedule so fans know when to tune in
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
