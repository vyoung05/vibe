import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../state/authStore";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const INFLUENCER_THRESHOLD = 10;

export const InviteFriendsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);

  const [showCopiedModal, setShowCopiedModal] = useState(false);

  if (!user) return null;

  const invitedCount = user.invitedFriends?.length || 0;
  const progressToInfluencer = Math.min(invitedCount / INFLUENCER_THRESHOLD, 1);
  const remainingInvites = Math.max(INFLUENCER_THRESHOLD - invitedCount, 0);

  const referralLink = `https://ddns.app/join?ref=${user.referralCode}`;

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(user.referralCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowCopiedModal(true);
    setTimeout(() => setShowCopiedModal(false), 2000);
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(referralLink);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowCopiedModal(true);
    setTimeout(() => setShowCopiedModal(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on DDNS - the ultimate streamer community! Use my referral code: ${user.referralCode}\n\n${referralLink}`,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center">
        <Pressable
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-[#1C1C24] items-center justify-center mr-4"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-white text-xl font-bold">Invite Friends</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Influencer Progress Card */}
        <View className="mx-6 mb-6">
          <LinearGradient
            colors={user.isInfluencer ? ["#F59E0B", "#D97706"] : ["#1C1C24", "#151520"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 20 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View
                  className={`w-14 h-14 rounded-full items-center justify-center ${
                    user.isInfluencer ? "bg-white/20" : "bg-amber-500/20"
                  }`}
                >
                  <Ionicons
                    name="star"
                    size={28}
                    color={user.isInfluencer ? "#FFFFFF" : "#F59E0B"}
                  />
                </View>
                <View className="ml-3">
                  <Text
                    className={`text-lg font-bold ${
                      user.isInfluencer ? "text-white" : "text-white"
                    }`}
                  >
                    {user.isInfluencer ? "Influencer" : "Become an Influencer"}
                  </Text>
                  <Text
                    className={`text-sm ${
                      user.isInfluencer ? "text-white/80" : "text-gray-400"
                    }`}
                  >
                    {user.isInfluencer
                      ? "You earned the badge!"
                      : `Invite ${remainingInvites} more friends`}
                  </Text>
                </View>
              </View>
              {user.isInfluencer && (
                <View className="bg-white/20 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-bold">EARNED</Text>
                </View>
              )}
            </View>

            {/* Progress Bar */}
            {!user.isInfluencer && (
              <View className="mb-3">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-400 text-xs">Progress</Text>
                  <Text className="text-white text-xs font-semibold">
                    {invitedCount}/{INFLUENCER_THRESHOLD}
                  </Text>
                </View>
                <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${progressToInfluencer * 100}%` }}
                  />
                </View>
              </View>
            )}

            <Text
              className={`text-sm ${
                user.isInfluencer ? "text-white/80" : "text-gray-400"
              }`}
            >
              {user.isInfluencer
                ? "Thank you for spreading the word about DDNS!"
                : "Invite 10 friends to unlock the exclusive Influencer badge and stand out in the community!"}
            </Text>
          </LinearGradient>
        </View>

        {/* Referral Code Section */}
        <View className="px-6 mb-6">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Your Referral Code
          </Text>
          <View className="bg-[#1C1C24] rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-purple-400 text-2xl font-bold tracking-wider">
                {user.referralCode}
              </Text>
              <Pressable
                onPress={handleCopyCode}
                className="bg-purple-600 px-4 py-2 rounded-lg flex-row items-center"
              >
                <Ionicons name="copy-outline" size={18} color="white" />
                <Text className="text-white font-semibold ml-2">Copy</Text>
              </Pressable>
            </View>
            <Text className="text-gray-400 text-sm">
              Share this code with friends. When they sign up using your code, they will be
              added to your invite count!
            </Text>
          </View>
        </View>

        {/* Share Link Section */}
        <View className="px-6 mb-6">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Share Link
          </Text>
          <View className="bg-[#1C1C24] rounded-2xl p-4">
            <View className="bg-[#0A0A0F] rounded-xl px-4 py-3 mb-4">
              <Text className="text-gray-300 text-sm" numberOfLines={1}>
                {referralLink}
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleCopyLink}
                className="flex-1 bg-[#0A0A0F] py-3 rounded-xl flex-row items-center justify-center"
              >
                <Ionicons name="link" size={20} color="#A855F7" />
                <Text className="text-purple-400 font-semibold ml-2">Copy Link</Text>
              </Pressable>
              <Pressable
                onPress={handleShare}
                className="flex-1 bg-purple-600 py-3 rounded-xl flex-row items-center justify-center"
              >
                <Ionicons name="share-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Share</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Share Options */}
        <View className="px-6 mb-6">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Share Via
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <Pressable
              onPress={handleShare}
              className="bg-[#1C1C24] p-4 rounded-2xl items-center"
              style={{ width: "30%" }}
            >
              <View className="w-12 h-12 rounded-full bg-green-500/20 items-center justify-center mb-2">
                <Ionicons name="chatbubble" size={24} color="#22C55E" />
              </View>
              <Text className="text-white text-sm font-medium">Messages</Text>
            </Pressable>
            <Pressable
              onPress={handleShare}
              className="bg-[#1C1C24] p-4 rounded-2xl items-center"
              style={{ width: "30%" }}
            >
              <View className="w-12 h-12 rounded-full bg-blue-500/20 items-center justify-center mb-2">
                <Ionicons name="mail" size={24} color="#3B82F6" />
              </View>
              <Text className="text-white text-sm font-medium">Email</Text>
            </Pressable>
            <Pressable
              onPress={handleShare}
              className="bg-[#1C1C24] p-4 rounded-2xl items-center"
              style={{ width: "30%" }}
            >
              <View className="w-12 h-12 rounded-full bg-pink-500/20 items-center justify-center mb-2">
                <Ionicons name="logo-instagram" size={24} color="#EC4899" />
              </View>
              <Text className="text-white text-sm font-medium">Instagram</Text>
            </Pressable>
          </View>
        </View>

        {/* Stats */}
        <View className="px-6 mb-6">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Your Stats
          </Text>
          <View className="bg-[#1C1C24] rounded-2xl p-4">
            <View className="flex-row">
              <View className="flex-1 items-center py-3 border-r border-gray-700">
                <Text className="text-white text-2xl font-bold">{invitedCount}</Text>
                <Text className="text-gray-400 text-sm">Friends Invited</Text>
              </View>
              <View className="flex-1 items-center py-3">
                <Text className="text-white text-2xl font-bold">{remainingInvites}</Text>
                <Text className="text-gray-400 text-sm">Until Influencer</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Benefits */}
        <View className="px-6 mb-8">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Influencer Benefits
          </Text>
          <View className="bg-[#1C1C24] rounded-2xl p-4">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-amber-500/20 items-center justify-center">
                <Ionicons name="star" size={20} color="#F59E0B" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-white font-semibold">Exclusive Badge</Text>
                <Text className="text-gray-400 text-sm">
                  Stand out with the Influencer badge on your profile
                </Text>
              </View>
            </View>
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center">
                <Ionicons name="trending-up" size={20} color="#A855F7" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-white font-semibold">Priority Discovery</Text>
                <Text className="text-gray-400 text-sm">
                  Get featured in suggested people lists
                </Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-cyan-500/20 items-center justify-center">
                <Ionicons name="people" size={20} color="#06B6D4" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-white font-semibold">Community Recognition</Text>
                <Text className="text-gray-400 text-sm">
                  Be recognized as a community builder
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>

      {/* Copied Modal */}
      <Modal visible={showCopiedModal} transparent animationType="fade">
        <View className="flex-1 items-center justify-center">
          <View className="bg-[#1C1C24] px-6 py-4 rounded-2xl flex-row items-center">
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text className="text-white font-semibold ml-2">Copied to clipboard!</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
