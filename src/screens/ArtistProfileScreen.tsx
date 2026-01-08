import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../state/authStore";
import { useAppStore } from "../state/appStore";
import type { Artist, Track, Album } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ArtistProfileRouteProp = RouteProp<RootStackParamList, "ArtistProfile">;

export const ArtistProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ArtistProfileRouteProp>();
  const { artistId } = route.params;

  const user = useAuthStore((s) => s.user);
  const artists = useAppStore((s) => s.artists);
  const addTrack = useAppStore((s) => s.addTrack);
  const updateTrack = useAppStore((s) => s.updateTrack);
  const deleteTrack = useAppStore((s) => s.deleteTrack);
  const followArtist = useAppStore((s) => s.followArtist);
  const unfollowArtist = useAppStore((s) => s.unfollowArtist);
  const incrementPlayCount = useAppStore((s) => s.incrementPlayCount);

  const artist = artists.find((a) => a.id === artistId);
  const isOwnProfile = user?.id === artistId || user?.role === "admin";

  const [activeTab, setActiveTab] = useState<"music" | "albums" | "about">("music");
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [showEditTrack, setShowEditTrack] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const [trackForm, setTrackForm] = useState({
    title: "",
    coverArt: "",
    audioUrl: "",
    duration: "180",
    price: "",
    isSnippetOnly: false,
    snippetDuration: "30",
  });

  const isFollowing = user?.followedArtists?.includes(artistId) ?? false;

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const resetTrackForm = () => {
    setTrackForm({
      title: "",
      coverArt: "",
      audioUrl: "",
      duration: "180",
      price: "",
      isSnippetOnly: false,
      snippetDuration: "30",
    });
  };

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
      setTrackForm({ ...trackForm, coverArt: result.assets[0].uri });
    }
  };

  const handlePickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setTrackForm({ ...trackForm, audioUrl: result.assets[0].uri });
        if (!trackForm.title && result.assets[0].name) {
          const nameWithoutExt = result.assets[0].name.replace(/\.[^/.]+$/, "");
          setTrackForm((prev) => ({ ...prev, audioUrl: result.assets[0].uri, title: nameWithoutExt }));
        }
      }
    } catch (error) {
      console.log("Error picking audio:", error);
    }
  };

  const handleAddTrack = () => {
    if (!trackForm.title || !trackForm.audioUrl) {
      return;
    }

    const newTrack: Track = {
      id: "track-" + Date.now(),
      artistId: artistId,
      title: trackForm.title,
      coverArt: trackForm.coverArt || artist?.avatar || "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400",
      audioUrl: trackForm.audioUrl,
      duration: parseInt(trackForm.duration) || 180,
      price: trackForm.price ? parseFloat(trackForm.price) : undefined,
      isSnippetOnly: trackForm.isSnippetOnly,
      snippetDuration: parseInt(trackForm.snippetDuration) || 30,
      playCount: 0,
      hotVotes: 0,
      notVotes: 0,
      purchaseCount: 0,
      createdAt: new Date().toISOString(),
    };

    addTrack(artistId, newTrack);
    resetTrackForm();
    setShowAddTrack(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleEditTrack = () => {
    if (!selectedTrack || !trackForm.title) return;

    updateTrack(artistId, selectedTrack.id, {
      title: trackForm.title,
      coverArt: trackForm.coverArt || selectedTrack.coverArt,
      audioUrl: trackForm.audioUrl || selectedTrack.audioUrl,
      duration: parseInt(trackForm.duration) || selectedTrack.duration,
      price: trackForm.price ? parseFloat(trackForm.price) : undefined,
      isSnippetOnly: trackForm.isSnippetOnly,
      snippetDuration: parseInt(trackForm.snippetDuration) || 30,
    });

    resetTrackForm();
    setSelectedTrack(null);
    setShowEditTrack(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteTrack = (trackId: string) => {
    deleteTrack(artistId, trackId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const openEditTrack = (track: Track) => {
    setSelectedTrack(track);
    setTrackForm({
      title: track.title,
      coverArt: track.coverArt,
      audioUrl: track.audioUrl,
      duration: track.duration.toString(),
      price: track.price?.toString() || "",
      isSnippetOnly: track.isSnippetOnly,
      snippetDuration: track.snippetDuration?.toString() || "30",
    });
    setShowEditTrack(true);
  };

  const handlePlayTrack = async (track: Track) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (currentlyPlaying === track.id && sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.audioUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPlaybackPosition(status.positionMillis || 0);
            setPlaybackDuration(status.durationMillis || 0);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setCurrentlyPlaying(null);
            }
          }
        }
      );

      setSound(newSound);
      setCurrentlyPlaying(track.id);
      setIsPlaying(true);
      incrementPlayCount(artistId, track.id);
    } catch (error) {
      console.log("Error playing track:", error);
    }
  };

  const handleFollowToggle = () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isFollowing) {
      unfollowArtist(user.id, artistId);
    } else {
      followArtist(user.id, artistId);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!artist) {
    return (
      <View className="flex-1 bg-[#0A0A0F] items-center justify-center">
        <Text className="text-white text-lg">Artist not found</Text>
        <Pressable onPress={() => navigation.goBack()} className="mt-4 bg-purple-600 px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const renderTrackItem = ({ item: track }: { item: Track }) => {
    const isCurrentTrack = currentlyPlaying === track.id;

    return (
      <Pressable
        onPress={() => handlePlayTrack(track)}
        className={`flex-row items-center p-4 mb-3 rounded-2xl ${isCurrentTrack ? "bg-purple-900/40" : "bg-[#151520]"}`}
      >
        <View className="relative">
          <Image
            source={{ uri: track.coverArt }}
            className="w-14 h-14 rounded-xl"
            contentFit="cover"
          />
          <View className="absolute inset-0 items-center justify-center">
            <View className="w-8 h-8 rounded-full bg-black/60 items-center justify-center">
              <Ionicons
                name={isCurrentTrack && isPlaying ? "pause" : "play"}
                size={16}
                color="white"
              />
            </View>
          </View>
          {track.isHot && (
            <View className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-1">
              <Ionicons name="flame" size={10} color="white" />
            </View>
          )}
        </View>

        <View className="flex-1 ml-4">
          <Text className="text-white font-bold text-base" numberOfLines={1}>
            {track.title}
          </Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="play" size={12} color="#9CA3AF" />
            <Text className="text-gray-400 text-xs ml-1">{track.playCount.toLocaleString()} plays</Text>
            <Text className="text-gray-600 mx-2">|</Text>
            <Text className="text-gray-400 text-xs">{formatDuration(track.duration)}</Text>
            {track.price && (
              <>
                <Text className="text-gray-600 mx-2">|</Text>
                <Text className="text-green-400 text-xs font-bold">${track.price}</Text>
              </>
            )}
          </View>
        </View>

        {isOwnProfile && (
          <View className="flex-row">
            <Pressable
              onPress={() => openEditTrack(track)}
              className="p-2 mr-1"
            >
              <Ionicons name="create-outline" size={20} color="#8B5CF6" />
            </Pressable>
            <Pressable
              onPress={() => handleDeleteTrack(track.id)}
              className="p-2"
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </Pressable>
          </View>
        )}
      </Pressable>
    );
  };

  const renderAlbumItem = ({ item: album }: { item: Album }) => (
    <Pressable className="mr-4 w-36">
      <Image
        source={{ uri: album.coverArt }}
        className="w-36 h-36 rounded-2xl"
        contentFit="cover"
      />
      <Text className="text-white font-bold mt-2" numberOfLines={1}>{album.title}</Text>
      <Text className="text-gray-400 text-xs">{album.trackIds.length} tracks</Text>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View className="relative h-64">
          <Image
            source={{ uri: artist.headerImages[0] || artist.avatar }}
            className="w-full h-full"
            contentFit="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(10, 10, 15, 0.8)", "#0A0A0F"]}
            style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 120 }}
          />
          <Pressable
            onPress={() => navigation.goBack()}
            className="absolute left-4 bg-black/50 rounded-full p-2"
            style={{ top: insets.top + 8 }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
        </View>

        {/* Artist Info */}
        <View className="px-5 -mt-16">
          <View className="flex-row items-end">
            <Image
              source={{ uri: artist.avatar }}
              className="w-28 h-28 rounded-2xl border-4 border-[#0A0A0F]"
              contentFit="cover"
            />
            <View className="flex-1 ml-4 mb-2">
              <View className="flex-row items-center">
                <Text className="text-white text-2xl font-bold">{artist.stageName}</Text>
                {artist.isVerified && (
                  <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" style={{ marginLeft: 6 }} />
                )}
                {artist.hotStatus && (
                  <View className="ml-2 flex-row items-center bg-orange-500/20 px-2 py-0.5 rounded-full">
                    <Ionicons name="flame" size={12} color="#F97316" />
                    <Text className="text-orange-400 text-xs font-bold ml-1">HOT</Text>
                  </View>
                )}
              </View>
              {artist.genre && (
                <Text className="text-purple-400 text-sm">{artist.genre}</Text>
              )}
            </View>
          </View>

          {/* Stats */}
          <View className="flex-row mt-5 mb-4">
            <View className="flex-1 items-center">
              <Text className="text-white text-xl font-bold">{artist.followerCount.toLocaleString()}</Text>
              <Text className="text-gray-400 text-xs">Followers</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-white text-xl font-bold">{artist.tracks.length}</Text>
              <Text className="text-gray-400 text-xs">Tracks</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-white text-xl font-bold">{artist.totalPlays.toLocaleString()}</Text>
              <Text className="text-gray-400 text-xs">Plays</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-white text-xl font-bold">{artist.albums.length}</Text>
              <Text className="text-gray-400 text-xs">Albums</Text>
            </View>
          </View>

          {/* Follow / Edit Button */}
          {!isOwnProfile ? (
            <Pressable
              onPress={handleFollowToggle}
              className={`py-3 rounded-xl mb-4 ${isFollowing ? "bg-[#1F1F2E]" : "bg-purple-600"}`}
            >
              <Text className={`text-center font-bold ${isFollowing ? "text-purple-400" : "text-white"}`}>
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </Pressable>
          ) : (
            <View className="flex-row mb-4">
              <Pressable
                onPress={() => navigation.navigate("CreateMusicSheet" as any, { artistId })}
                className="flex-1 bg-pink-600 py-3 rounded-xl mr-2 flex-row items-center justify-center"
              >
                <Ionicons name="musical-notes" size={18} color="white" />
                <Text className="text-white font-bold ml-2">Create Music</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  resetTrackForm();
                  setShowAddTrack(true);
                }}
                className="flex-1 bg-purple-600 py-3 rounded-xl flex-row items-center justify-center"
              >
                <Ionicons name="cloud-upload" size={18} color="white" />
                <Text className="text-white font-bold ml-2">Upload Track</Text>
              </Pressable>
            </View>
          )}

          {/* Tabs */}
          <View className="flex-row bg-[#151520] rounded-xl p-1 mb-4">
            {(["music", "albums", "about"] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-lg ${activeTab === tab ? "bg-purple-600" : ""}`}
              >
                <Text className={`text-center font-semibold capitalize ${activeTab === tab ? "text-white" : "text-gray-400"}`}>
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Tab Content */}
          {activeTab === "music" && (
            <View className="pb-8">
              {artist.tracks.length === 0 ? (
                <View className="items-center py-12">
                  <Ionicons name="musical-notes-outline" size={48} color="#4B5563" />
                  <Text className="text-gray-400 mt-4 text-center">No tracks uploaded yet</Text>
                  {isOwnProfile && (
                    <Pressable
                      onPress={() => setShowAddTrack(true)}
                      className="mt-4 bg-purple-600 px-6 py-3 rounded-xl"
                    >
                      <Text className="text-white font-bold">Upload Your First Track</Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <FlatList
                  data={artist.tracks}
                  renderItem={renderTrackItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              )}
            </View>
          )}

          {activeTab === "albums" && (
            <View className="pb-8">
              {artist.albums.length === 0 ? (
                <View className="items-center py-12">
                  <Ionicons name="albums-outline" size={48} color="#4B5563" />
                  <Text className="text-gray-400 mt-4 text-center">No albums yet</Text>
                </View>
              ) : (
                <FlatList
                  data={artist.albums}
                  renderItem={renderAlbumItem}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                />
              )}
            </View>
          )}

          {activeTab === "about" && (
            <View className="pb-8">
              <Text className="text-gray-300 text-base leading-6 mb-6">{artist.bio || "No bio available"}</Text>

              {/* Social Links */}
              <Text className="text-white font-bold text-lg mb-4">Connect</Text>
              <View className="flex-row flex-wrap">
                {artist.socialLinks.spotify && (
                  <View className="flex-row items-center bg-[#1DB954]/20 px-4 py-2 rounded-full mr-2 mb-2">
                    <Ionicons name="disc" size={18} color="#1DB954" />
                    <Text className="text-[#1DB954] ml-2">Spotify</Text>
                  </View>
                )}
                {artist.socialLinks.appleMusic && (
                  <View className="flex-row items-center bg-[#FC3C44]/20 px-4 py-2 rounded-full mr-2 mb-2">
                    <Ionicons name="musical-note" size={18} color="#FC3C44" />
                    <Text className="text-[#FC3C44] ml-2">Apple Music</Text>
                  </View>
                )}
                {artist.socialLinks.soundcloud && (
                  <View className="flex-row items-center bg-[#FF5500]/20 px-4 py-2 rounded-full mr-2 mb-2">
                    <Ionicons name="cloud" size={18} color="#FF5500" />
                    <Text className="text-[#FF5500] ml-2">SoundCloud</Text>
                  </View>
                )}
                {artist.socialLinks.instagram && (
                  <View className="flex-row items-center bg-[#E4405F]/20 px-4 py-2 rounded-full mr-2 mb-2">
                    <Ionicons name="logo-instagram" size={18} color="#E4405F" />
                    <Text className="text-[#E4405F] ml-2">Instagram</Text>
                  </View>
                )}
                {artist.socialLinks.twitter && (
                  <View className="flex-row items-center bg-[#1DA1F2]/20 px-4 py-2 rounded-full mr-2 mb-2">
                    <Ionicons name="logo-twitter" size={18} color="#1DA1F2" />
                    <Text className="text-[#1DA1F2] ml-2">Twitter</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Now Playing Bar */}
      {currentlyPlaying && (
        <View className="absolute bottom-0 left-0 right-0 bg-[#1F1F2E] border-t border-[#2A2A3E]" style={{ paddingBottom: insets.bottom }}>
          <View className="flex-row items-center p-4">
            {(() => {
              const playingTrack = artist.tracks.find((t) => t.id === currentlyPlaying);
              if (!playingTrack) return null;
              return (
                <>
                  <Image source={{ uri: playingTrack.coverArt }} className="w-12 h-12 rounded-lg" contentFit="cover" />
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-bold" numberOfLines={1}>{playingTrack.title}</Text>
                    <Text className="text-gray-400 text-xs">{artist.stageName}</Text>
                  </View>
                  <Pressable onPress={() => handlePlayTrack(playingTrack)} className="p-3">
                    <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="white" />
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      if (sound) {
                        await sound.unloadAsync();
                        setSound(null);
                      }
                      setCurrentlyPlaying(null);
                      setIsPlaying(false);
                    }}
                    className="p-3"
                  >
                    <Ionicons name="close" size={24} color="#9CA3AF" />
                  </Pressable>
                </>
              );
            })()}
          </View>
        </View>
      )}

      {/* Add Track Modal */}
      <Modal visible={showAddTrack} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <Pressable className="flex-1 bg-black/50" onPress={() => setShowAddTrack(false)} />
          <View className="bg-[#151520] rounded-t-3xl p-6" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">Upload New Track</Text>
              <Pressable onPress={() => setShowAddTrack(false)}>
                <Ionicons name="close" size={28} color="white" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput
                placeholder="Track Title *"
                placeholderTextColor="#6B7280"
                value={trackForm.title}
                onChangeText={(text) => setTrackForm({ ...trackForm, title: text })}
                className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
              />

              <View className="flex-row mb-4">
                <Pressable
                  onPress={handlePickAudioFile}
                  className="flex-1 bg-pink-600 py-3 rounded-xl flex-row items-center justify-center"
                >
                  <Ionicons name="cloud-upload" size={20} color="white" />
                  <Text className="text-white font-bold ml-2">Upload Audio</Text>
                </Pressable>
              </View>

              {trackForm.audioUrl ? (
                <View className="flex-row items-center bg-green-900/30 p-3 rounded-xl mb-4">
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text className="text-green-400 text-sm ml-2 flex-1" numberOfLines={1}>
                    {trackForm.audioUrl.includes("/") ? trackForm.audioUrl.split("/").pop() : "Audio selected"}
                  </Text>
                  <Pressable onPress={() => setTrackForm({ ...trackForm, audioUrl: "" })}>
                    <Ionicons name="close-circle" size={20} color="#6B7280" />
                  </Pressable>
                </View>
              ) : (
                <TextInput
                  placeholder="Or paste Audio URL"
                  placeholderTextColor="#6B7280"
                  value={trackForm.audioUrl}
                  onChangeText={(text) => setTrackForm({ ...trackForm, audioUrl: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
              )}

              <Pressable
                onPress={handlePickCoverArt}
                className="bg-[#1F1F2E] py-3 rounded-xl flex-row items-center justify-center mb-4"
              >
                <Ionicons name="image" size={20} color="#8B5CF6" />
                <Text className="text-purple-400 font-bold ml-2">Add Cover Art</Text>
              </Pressable>

              {trackForm.coverArt && (
                <View className="flex-row items-center bg-purple-900/30 p-3 rounded-xl mb-4">
                  <Image source={{ uri: trackForm.coverArt }} className="w-12 h-12 rounded-lg" contentFit="cover" />
                  <Text className="text-purple-400 text-sm ml-3 flex-1">Cover selected</Text>
                  <Pressable onPress={() => setTrackForm({ ...trackForm, coverArt: "" })}>
                    <Ionicons name="close-circle" size={20} color="#6B7280" />
                  </Pressable>
                </View>
              )}

              <View className="flex-row mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-gray-400 text-xs mb-1">Duration (sec)</Text>
                  <TextInput
                    placeholder="180"
                    placeholderTextColor="#6B7280"
                    value={trackForm.duration}
                    onChangeText={(text) => setTrackForm({ ...trackForm, duration: text })}
                    keyboardType="numeric"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-gray-400 text-xs mb-1">Price ($)</Text>
                  <TextInput
                    placeholder="Free"
                    placeholderTextColor="#6B7280"
                    value={trackForm.price}
                    onChangeText={(text) => setTrackForm({ ...trackForm, price: text })}
                    keyboardType="numeric"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  />
                </View>
              </View>

              <Pressable
                onPress={handleAddTrack}
                className="bg-purple-600 py-4 rounded-xl mt-2"
              >
                <Text className="text-white font-bold text-center text-lg">Upload Track</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Track Modal */}
      <Modal visible={showEditTrack} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <Pressable className="flex-1 bg-black/50" onPress={() => setShowEditTrack(false)} />
          <View className="bg-[#151520] rounded-t-3xl p-6" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">Edit Track</Text>
              <Pressable onPress={() => setShowEditTrack(false)}>
                <Ionicons name="close" size={28} color="white" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput
                placeholder="Track Title *"
                placeholderTextColor="#6B7280"
                value={trackForm.title}
                onChangeText={(text) => setTrackForm({ ...trackForm, title: text })}
                className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
              />

              <View className="flex-row mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-gray-400 text-xs mb-1">Duration (sec)</Text>
                  <TextInput
                    placeholder="180"
                    placeholderTextColor="#6B7280"
                    value={trackForm.duration}
                    onChangeText={(text) => setTrackForm({ ...trackForm, duration: text })}
                    keyboardType="numeric"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-gray-400 text-xs mb-1">Price ($)</Text>
                  <TextInput
                    placeholder="Free"
                    placeholderTextColor="#6B7280"
                    value={trackForm.price}
                    onChangeText={(text) => setTrackForm({ ...trackForm, price: text })}
                    keyboardType="numeric"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  />
                </View>
              </View>

              <Pressable
                onPress={handleEditTrack}
                className="bg-purple-600 py-4 rounded-xl mt-2"
              >
                <Text className="text-white font-bold text-center text-lg">Save Changes</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};
