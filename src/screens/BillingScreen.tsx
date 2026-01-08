import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../state/authStore";

export const BillingScreen: React.FC = () => {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [processing, setProcessing] = useState(false);

  if (!user) {
    return null;
  }

  const isSuperfan = user.tier === "superfan";

  const handleSubscribe = async (plan: "monthly" | "annual") => {
    setProcessing(true);

    // Simulate payment processing
    // In production, this would integrate with Apple Pay / Stripe
    setTimeout(() => {
      setProcessing(false);
      updateUser({ tier: "superfan" });
      Alert.alert(
        "Success!",
        `You are now a Super Fan! Enjoy your ${plan === "monthly" ? "monthly" : "annual"} membership.`,
        [{ text: "Awesome!", onPress: () => navigation.goBack() }]
      );
    }, 2000);
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel your Super Fan membership? You will lose access to exclusive content and features.",
      [
        { text: "Keep Membership", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: () => {
            updateUser({ tier: "free" });
            Alert.alert("Subscription Cancelled", "Your membership has been cancelled.");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-800 flex-row items-center">
        <Pressable onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-white text-2xl font-bold">Billing</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Current Plan */}
        <View className="p-6">
          <View className="bg-[#151520] rounded-2xl p-5 border border-gray-800 mb-6">
            <Text className="text-white text-lg font-bold mb-2">Current Plan</Text>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-purple-400">
                  {isSuperfan ? "Super Fan" : "Free Tier"}
                </Text>
                <Text className="text-gray-400 text-sm mt-1">
                  {isSuperfan ? "$5.00 / month" : "No charge"}
                </Text>
              </View>
              {isSuperfan && (
                <View className="bg-purple-500/20 rounded-full px-4 py-2">
                  <Text className="text-purple-400 font-bold">Active</Text>
                </View>
              )}
            </View>
          </View>

          {!isSuperfan ? (
            <>
              {/* Pricing Plans */}
              <Text className="text-white text-2xl font-bold mb-4">Upgrade to Super Fan</Text>
              <Text className="text-gray-400 mb-6">
                Get exclusive access to premium content, early booking, and special perks!
              </Text>

              {/* Monthly Plan */}
              <Pressable
                onPress={() => handleSubscribe("monthly")}
                disabled={processing}
                className="mb-4"
              >
                <LinearGradient
                  colors={["#8B5CF6", "#EC4899"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 16, padding: 1 }}
                >
                  <View className="bg-[#0A0A0F] rounded-2xl p-5">
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-white text-xl font-bold">Monthly</Text>
                      <View className="bg-purple-500/20 rounded-full px-3 py-1">
                        <Text className="text-purple-400 text-xs font-bold">POPULAR</Text>
                      </View>
                    </View>
                    <Text className="text-3xl font-bold text-white mb-2">
                      $5<Text className="text-lg text-gray-400">/month</Text>
                    </Text>
                    <View className="mt-4 space-y-2">
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text className="text-gray-300 ml-2">Exclusive Super Fan badge</Text>
                      </View>
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text className="text-gray-300 ml-2">Priority booking access</Text>
                      </View>
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text className="text-gray-300 ml-2">
                          Access to Super Fan only content
                        </Text>
                      </View>
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text className="text-gray-300 ml-2">Special Discord role</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>

              {/* Annual Plan */}
              <Pressable
                onPress={() => handleSubscribe("annual")}
                disabled={processing}
                className="mb-6"
              >
                <View className="bg-[#151520] rounded-2xl p-5 border border-gray-800">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-white text-xl font-bold">Annual</Text>
                    <View className="bg-green-500/20 rounded-full px-3 py-1">
                      <Text className="text-green-400 text-xs font-bold">SAVE $5</Text>
                    </View>
                  </View>
                  <Text className="text-3xl font-bold text-white mb-2">
                    $55<Text className="text-lg text-gray-400">/year</Text>
                  </Text>
                  <Text className="text-gray-500 text-sm mb-4">
                    Just $4.58/month - Save $5 annually!
                  </Text>
                  <View className="mt-2 space-y-2">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <Text className="text-gray-300 ml-2">All monthly benefits</Text>
                    </View>
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <Text className="text-gray-300 ml-2">Special annual badge</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <Text className="text-gray-300 ml-2">Early access to new features</Text>
                    </View>
                  </View>
                </View>
              </Pressable>

              {/* Payment Info */}
              <View className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30 mb-4">
                <View className="flex-row items-start">
                  <Ionicons name="information-circle" size={24} color="#3B82F6" />
                  <View className="flex-1 ml-3">
                    <Text className="text-blue-300 font-semibold mb-1">Secure Payment</Text>
                    <Text className="text-blue-200 text-sm">
                      Payment is processed securely through Apple Pay. Cancel anytime.
                    </Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Manage Subscription */}
              <Text className="text-white text-xl font-bold mb-4">Manage Subscription</Text>

              <View className="bg-[#151520] rounded-xl p-5 border border-gray-800 mb-4">
                <Text className="text-white font-semibold mb-2">Subscription Details</Text>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-400">Status</Text>
                  <Text className="text-green-400 font-semibold">Active</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-400">Plan</Text>
                  <Text className="text-white">Super Fan Monthly</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-400">Amount</Text>
                  <Text className="text-white">$5.00 / month</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-400">Next billing date</Text>
                  <Text className="text-white">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleCancelSubscription}
                className="bg-red-600/20 border border-red-600/50 rounded-xl py-4 items-center"
              >
                <Text className="text-red-400 font-bold">Cancel Subscription</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      {processing && (
        <View className="absolute inset-0 bg-black/80 items-center justify-center">
          <View className="bg-[#151520] rounded-2xl p-6 items-center">
            <Text className="text-white text-lg font-bold mb-2">Processing Payment...</Text>
            <Text className="text-gray-400">Please wait</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};
