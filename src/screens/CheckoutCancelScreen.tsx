import React from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { LinearGradient } from "expo-linear-gradient";
import { PageContainer } from "../components/PageContainer";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CheckoutCancelScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleRetryCheckout = () => {
    navigation.navigate("MerchCart");
  };

  const handleContinueShopping = () => {
    navigation.navigate("MerchStore");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      <PageContainer>
        <View className="flex-1 items-center justify-center px-6">
          {/* Cancel Icon */}
          <View className="w-24 h-24 rounded-full bg-amber-500/20 border-2 border-amber-500/30 items-center justify-center mb-8">
            <Ionicons name="close" size={50} color="#F59E0B" />
          </View>

          {/* Cancel Message */}
          <Text className="text-white text-3xl font-black italic tracking-tight text-center mb-3">
            PAYMENT CANCELLED
          </Text>
          <Text className="text-gray-400 text-center text-base font-medium mb-8 max-w-[300px]">
            No worries! Your cart is still saved. You can complete your purchase whenever you're ready.
          </Text>

          {/* Info Box */}
          <View className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-8 w-full max-w-[350px]">
            <View className="flex-row items-center">
              <Ionicons name="information-circle" size={24} color="#60A5FA" />
              <Text className="text-gray-300 flex-1 ml-3 text-sm">
                Your items are waiting in your cart. No payment was processed.
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="w-full max-w-[350px]">
            <Pressable onPress={handleRetryCheckout} className="overflow-hidden rounded-2xl mb-4">
              <LinearGradient
                colors={["#8B5CF6", "#D946EF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 items-center"
              >
                <Text className="text-white font-black uppercase tracking-widest text-sm">
                  RETURN TO CART
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={handleContinueShopping}
              className="bg-white/5 border border-white/10 py-4 rounded-2xl items-center"
            >
              <Text className="text-white font-black uppercase tracking-widest text-sm">
                CONTINUE SHOPPING
              </Text>
            </Pressable>
          </View>
        </View>
      </PageContainer>
    </SafeAreaView>
  );
};
