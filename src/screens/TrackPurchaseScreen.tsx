import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { PageContainer } from "../components/PageContainer";
import { useAuthStore } from "../state/authStore";
import { useMusicStore } from "../state/musicStore";
import { useAppStore } from "../state/appStore";
import {
  fetchArtist,
  hasUserPurchasedTrack,
  recordTrackPurchase,
} from "../services/musicService";
import { supabase } from "../lib/supabase";
import type { Track, Artist } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "TrackPurchase">;

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

export const TrackPurchaseScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { trackId } = route.params;

  const user = useAuthStore((s) => s.user);
  const localArtists = useAppStore((s) => s.artists);

  const playTrack = useMusicStore((s) => s.playTrack);
  const pauseTrack = useMusicStore((s) => s.pauseTrack);
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);

  const [track, setTrack] = useState<Track | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Load track and artist
  const loadTrack = useCallback(async () => {
    try {
      // Try to find in local state first
      for (const a of localArtists) {
        const foundTrack = a.tracks?.find((t) => t.id === trackId);
        if (foundTrack) {
          setTrack(foundTrack);
          setArtist(a);
          break;
        }
      }

      // Also check Supabase
      const { data: supabaseTrack } = await supabase
        .from("tracks")
        .select(`
          *,
          artists(*)
        `)
        .eq("id", trackId)
        .single();

      if (supabaseTrack) {
        setTrack({
          id: supabaseTrack.id,
          artistId: supabaseTrack.artist_id,
          title: supabaseTrack.title,
          coverArt: supabaseTrack.cover_art,
          audioUrl: supabaseTrack.audio_url,
          duration: supabaseTrack.duration_seconds,
          price: supabaseTrack.price ? parseFloat(supabaseTrack.price) : undefined,
          isSnippetOnly: supabaseTrack.is_snippet_only,
          snippetDuration: supabaseTrack.snippet_duration_seconds,
          playCount: supabaseTrack.play_count || 0,
          hotVotes: supabaseTrack.hot_votes || 0,
          notVotes: supabaseTrack.not_votes || 0,
          purchaseCount: supabaseTrack.purchase_count || 0,
          isHot: supabaseTrack.is_hot,
          createdAt: supabaseTrack.created_at,
        });

        if (supabaseTrack.artists) {
          const a = supabaseTrack.artists;
          setArtist({
            id: a.id,
            name: a.name,
            stageName: a.stage_name,
            avatar: a.avatar,
            bio: a.bio,
            genre: a.genre,
            followerCount: a.follower_count || 0,
            referralCode: a.referral_code || "",
            headerImages: [],
            socialLinks: {},
            tracks: [],
            albums: [],
            totalPlays: a.total_plays || 0,
            totalSales: a.total_sales || 0,
          });
        }
      }

      // Check if already purchased
      if (user?.id) {
        const purchased = await hasUserPurchasedTrack(user.id, trackId);
        setIsPurchased(purchased);
      }
    } catch (error) {
      console.error("[TrackPurchaseScreen] Error loading:", error);
    } finally {
      setLoading(false);
    }
  }, [trackId, user?.id, localArtists]);

  useEffect(() => {
    loadTrack();
  }, [loadTrack]);

  const handlePlayPreview = () => {
    if (!track) return;
    if (currentTrack?.id === track.id && isPlaying) {
      pauseTrack();
    } else {
      playTrack(track);
    }
  };

  const handlePurchase = async () => {
    if (!track || !user?.id) {
      Alert.alert("Error", "Please sign in to purchase music.");
      return;
    }

    if (!track.price) {
      Alert.alert("Error", "This track is not for sale.");
      return;
    }

    setPurchasing(true);

    try {
      // Create Stripe checkout session
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: [
              {
                name: `${track.title} - ${artist?.stageName || artist?.name || "Unknown Artist"}`,
                price: Math.round(track.price * 100), // Convert to cents
                quantity: 1,
              },
            ],
            successUrl: `${Platform.OS === "web" ? window.location.origin : "ddns://"}track-purchase-success?trackId=${trackId}`,
            cancelUrl: `${Platform.OS === "web" ? window.location.origin : "ddns://"}track-purchase-cancel`,
            metadata: {
              type: "track_purchase",
              trackId: track.id,
              userId: user.id,
              artistId: track.artistId,
            },
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        // Open Stripe checkout
        if (Platform.OS === "web") {
          window.location.href = data.url;
        } else {
          await Linking.openURL(data.url);
        }

        // Record purchase (will be verified by webhook in production)
        // For demo, record immediately
        await recordTrackPurchase(user.id, track.id, track.price);
        setIsPurchased(true);
      }
    } catch (error: any) {
      console.error("[TrackPurchaseScreen] Purchase error:", error);
      Alert.alert("Purchase Failed", error.message || "Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0F] items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </SafeAreaView>
    );
  }

  if (!track) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0F] items-center justify-center">
        <Text className="text-white">Track not found</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          className="mt-4 bg-purple-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <PageContainer>
          {/* Header */}
          <View className="px-6 py-4">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 bg-white/5 rounded-full items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </Pressable>
          </View>

          {/* Cover Art */}
          <View className="px-6 items-center">
            <View className="relative">
              <Image
                source={{ uri: track.coverArt }}
                style={{ width: 280, height: 280, borderRadius: 24 }}
                contentFit="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.4)"]}
                className="absolute inset-0 rounded-3xl"
              />

              {/* Play Preview Button */}
              <Pressable
                onPress={handlePlayPreview}
                className="absolute inset-0 items-center justify-center"
              >
                <View className="w-16 h-16 rounded-full items-center justify-center overflow-hidden shadow-2xl">
                  <LinearGradient
                    colors={isCurrentlyPlaying ? ["#D946EF", "#8B5CF6"] : ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
                    className="w-full h-full items-center justify-center"
                  >
                    <Ionicons
                      name={isCurrentlyPlaying ? "pause" : "play"}
                      size={32}
                      color="white"
                      style={{ marginLeft: isCurrentlyPlaying ? 0 : 4 }}
                    />
                  </LinearGradient>
                </View>
              </Pressable>

              {/* Badges */}
              {track.isHot && (
                <View className="absolute top-4 left-4 bg-red-500 px-3 py-1.5 rounded-lg flex-row items-center">
                  <Ionicons name="flame" size={14} color="white" />
                  <Text className="text-white text-xs font-black ml-1">HOT</Text>
                </View>
              )}

              {isPurchased && (
                <View className="absolute top-4 right-4 bg-green-500 px-3 py-1.5 rounded-lg flex-row items-center">
                  <Ionicons name="checkmark-circle" size={14} color="white" />
                  <Text className="text-white text-xs font-black ml-1">OWNED</Text>
                </View>
              )}
            </View>
          </View>

          {/* Track Info */}
          <View className="px-6 pt-8">
            <Text className="text-white text-2xl font-black text-center mb-2">
              {track.title}
            </Text>

            {/* Artist */}
            <Pressable className="flex-row items-center justify-center mb-6">
              {artist && (
                <>
                  <Image
                    source={{ uri: artist.avatar }}
                    style={{ width: 28, height: 28, borderRadius: 14 }}
                    contentFit="cover"
                  />
                  <Text className="text-purple-400 font-bold ml-2">
                    {artist.stageName || artist.name}
                  </Text>
                  {artist.isVerified && (
                    <Ionicons name="checkmark-circle" size={14} color="#8B5CF6" className="ml-1" />
                  )}
                </>
              )}
            </Pressable>

            {/* Stats */}
            <View className="flex-row justify-center gap-6 mb-8">
              <View className="items-center">
                <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Duration
                </Text>
                <Text className="text-white font-bold">{formatDuration(track.duration)}</Text>
              </View>
              <View className="items-center">
                <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Plays
                </Text>
                <Text className="text-white font-bold">{track.playCount.toLocaleString()}</Text>
              </View>
              <View className="items-center">
                <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Sold
                </Text>
                <Text className="text-white font-bold">{track.purchaseCount.toLocaleString()}</Text>
              </View>
              <View className="items-center">
                <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Hot Votes
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="flame" size={14} color="#EF4444" />
                  <Text className="text-white font-bold ml-1">{track.hotVotes}</Text>
                </View>
              </View>
            </View>

            {/* Preview Notice */}
            {track.isSnippetOnly && !isPurchased && (
              <View className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
                <View className="flex-row items-center">
                  <Ionicons name="information-circle" size={20} color="#EAB308" />
                  <Text className="text-yellow-400 font-bold ml-2">Preview Only</Text>
                </View>
                <Text className="text-yellow-300/70 text-sm mt-1">
                  Non-owners can only listen to a {track.snippetDuration || 30}-second preview.
                  Purchase to unlock the full track!
                </Text>
              </View>
            )}

            {/* Price & Purchase */}
            <View className="bg-[#1C1C26] rounded-2xl p-6 border border-white/5 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-400 font-bold">Price</Text>
                <Text className="text-purple-400 text-3xl font-black">
                  ${track.price?.toFixed(2) || "FREE"}
                </Text>
              </View>

              {isPurchased ? (
                <View className="bg-green-500/20 border border-green-500/40 rounded-xl p-4">
                  <View className="flex-row items-center justify-center">
                    <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                    <Text className="text-green-400 font-bold text-lg ml-2">
                      You Own This Track
                    </Text>
                  </View>
                  <Text className="text-green-300/70 text-center text-sm mt-2">
                    Full track available in your library
                  </Text>
                </View>
              ) : (
                <Pressable
                  onPress={handlePurchase}
                  disabled={purchasing}
                  className="overflow-hidden rounded-xl"
                >
                  <LinearGradient
                    colors={purchasing ? ["#6B7280", "#4B5563"] : ["#8B5CF6", "#D946EF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="py-4 items-center justify-center flex-row"
                  >
                    {purchasing ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name="card" size={20} color="white" />
                        <Text className="text-white font-black text-lg ml-2">
                          Buy Now
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              )}
            </View>

            {/* What You Get */}
            <View className="mb-8">
              <Text className="text-white font-bold text-lg mb-4">What You Get</Text>
              <View className="space-y-3">
                {[
                  { icon: "musical-note", text: "Full high-quality audio" },
                  { icon: "infinite", text: "Unlimited streaming" },
                  { icon: "download", text: "Download for offline listening" },
                  { icon: "heart", text: "Support the artist directly" },
                ].map((item, i) => (
                  <View key={i} className="flex-row items-center bg-white/5 rounded-xl p-3">
                    <View className="w-8 h-8 bg-purple-600/20 rounded-lg items-center justify-center">
                      <Ionicons name={item.icon as any} size={16} color="#A78BFA" />
                    </View>
                    <Text className="text-gray-300 ml-3">{item.text}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Artist Section */}
            {artist && (
              <View className="bg-[#1C1C26] rounded-2xl p-4 border border-white/5 mb-8">
                <View className="flex-row items-center">
                  <Image
                    source={{ uri: artist.avatar }}
                    style={{ width: 56, height: 56, borderRadius: 28 }}
                    contentFit="cover"
                  />
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center">
                      <Text className="text-white font-bold text-lg">
                        {artist.stageName || artist.name}
                      </Text>
                      {artist.isVerified && (
                        <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" className="ml-1" />
                      )}
                    </View>
                    <Text className="text-gray-500 text-sm">
                      {artist.followerCount.toLocaleString()} followers
                    </Text>
                  </View>
                  <Pressable className="bg-purple-600 px-4 py-2 rounded-lg">
                    <Text className="text-white font-bold text-sm">Follow</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
};
