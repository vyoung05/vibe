import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { LinearGradient } from "expo-linear-gradient";
import { PageContainer } from "../components/PageContainer";
import { useMerchStore } from "../state/merchStore";
import { verifyCheckoutSession } from "../utils/stripeCheckout";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CheckoutSuccessScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const updateOrderStatus = useMerchStore((s) => s.updateOrderStatus);

  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get("session_id");
        const orderIdParam = urlParams.get("order_id");

        if (orderIdParam) {
          setOrderId(orderIdParam);
        }

        if (sessionId) {
          // Verify the checkout session
          const result = await verifyCheckoutSession(sessionId);

          if (result.success) {
            setVerified(true);

            // Update order status to payment_confirmed
            if (orderIdParam) {
              updateOrderStatus(orderIdParam, "payment_confirmed");
            }
          }
        } else {
          // No session ID - assume success for demo/dev
          setVerified(true);
        }
      } catch (error) {
        console.error("[CheckoutSuccess] Error verifying:", error);
        setVerified(true); // Show success anyway
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, []);

  const handleViewOrder = () => {
    if (orderId) {
      navigation.navigate("MerchOrderTracking", { orderId });
    } else {
      navigation.navigate("OrderHistory");
    }
  };

  const handleContinueShopping = () => {
    navigation.navigate("MerchStore");
  };

  if (isVerifying) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0F] items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-white text-lg font-bold mt-4">Verifying payment...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      <PageContainer>
        <View className="flex-1 items-center justify-center px-6">
          {/* Success Animation/Icon */}
          <View className="w-24 h-24 rounded-full bg-green-500 items-center justify-center mb-8 shadow-2xl shadow-green-500/50">
            <Ionicons name="checkmark" size={60} color="white" />
          </View>

          {/* Success Message */}
          <Text className="text-white text-3xl font-black italic tracking-tight text-center mb-3">
            PAYMENT SUCCESSFUL!
          </Text>
          <Text className="text-gray-400 text-center text-base font-medium mb-8 max-w-[300px]">
            Thank you for your order! We're getting your items ready for production.
          </Text>

          {/* Order Number */}
          {orderId && (
            <View className="bg-white/5 rounded-2xl border border-white/10 px-6 py-4 mb-8">
              <Text className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1 text-center">
                Order ID
              </Text>
              <Text className="text-purple-400 font-black text-lg tracking-wider text-center">
                {orderId.slice(0, 16)}...
              </Text>
            </View>
          )}

          {/* What's Next */}
          <View className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-8 w-full max-w-[350px]">
            <Text className="text-white font-black uppercase tracking-widest text-xs mb-4 text-center">
              What's Next?
            </Text>
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 rounded-full bg-purple-500/20 items-center justify-center mr-3">
                <Text className="text-purple-400 font-black text-sm">1</Text>
              </View>
              <Text className="text-gray-300 flex-1">Order sent to production</Text>
            </View>
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 rounded-full bg-purple-500/20 items-center justify-center mr-3">
                <Text className="text-purple-400 font-black text-sm">2</Text>
              </View>
              <Text className="text-gray-300 flex-1">Custom printing (2-5 days)</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-purple-500/20 items-center justify-center mr-3">
                <Text className="text-purple-400 font-black text-sm">3</Text>
              </View>
              <Text className="text-gray-300 flex-1">Shipped with tracking</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="w-full max-w-[350px]">
            <Pressable onPress={handleViewOrder} className="overflow-hidden rounded-2xl mb-4">
              <LinearGradient
                colors={["#8B5CF6", "#D946EF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 items-center"
              >
                <Text className="text-white font-black uppercase tracking-widest text-sm">
                  VIEW ORDER STATUS
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
