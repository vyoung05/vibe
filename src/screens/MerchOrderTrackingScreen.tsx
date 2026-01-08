import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useMerchStore } from "../state/merchStore";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type MerchOrderTrackingRouteProp = RouteProp<RootStackParamList, "MerchOrderTracking">;

const ORDER_STEPS = [
  { status: "pending", label: "Order Placed", icon: "receipt-outline" },
  { status: "payment_confirmed", label: "Payment Confirmed", icon: "card-outline" },
  { status: "sent_to_printify", label: "Sent to Production", icon: "print-outline" },
  { status: "in_production", label: "In Production", icon: "construct-outline" },
  { status: "shipped", label: "Shipped", icon: "airplane-outline" },
  { status: "delivered", label: "Delivered", icon: "checkmark-circle-outline" },
];

export const MerchOrderTrackingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<MerchOrderTrackingRouteProp>();
  const orderId = route.params?.orderId;

  const getOrder = useMerchStore((s) => s.getOrder);
  const order = getOrder(orderId || "");

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0F] items-center justify-center">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-white text-xl font-bold mt-4">Order Not Found</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          className="bg-purple-600 px-6 py-3 rounded-xl mt-6"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const currentStepIndex = ORDER_STEPS.findIndex((step) => step.status === order.status);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-800">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <View>
            <Text className="text-white text-xl font-bold">Order Status</Text>
            <Text className="text-gray-400 text-sm">{order.orderNumber}</Text>
          </View>
        </View>
        <View
          className={`px-3 py-1 rounded-full ${
            order.status === "delivered"
              ? "bg-green-600/20"
              : order.status === "cancelled"
              ? "bg-red-600/20"
              : "bg-purple-600/20"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              order.status === "delivered"
                ? "text-green-400"
                : order.status === "cancelled"
                ? "text-red-400"
                : "text-purple-400"
            }`}
          >
            {order.status.replace(/_/g, " ").toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Success Banner (if just placed) */}
        {order.status === "pending" && (
          <View className="mx-6 mt-6 bg-green-900/20 p-6 rounded-xl border border-green-500/30">
            <View className="items-center">
              <View className="w-16 h-16 rounded-full bg-green-600 items-center justify-center mb-4">
                <Ionicons name="checkmark" size={40} color="white" />
              </View>
              <Text className="text-white text-xl font-bold">Order Confirmed!</Text>
              <Text className="text-green-300/70 text-center mt-2">
                Thank you for your purchase. We will notify you when your order ships.
              </Text>
            </View>
          </View>
        )}

        {/* Order Progress */}
        <View className="mx-6 mt-6">
          <Text className="text-white font-bold text-lg mb-4">Order Progress</Text>
          <View className="bg-[#151520] rounded-xl border border-gray-800 p-4">
            {ORDER_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <View key={step.status} className="flex-row">
                  {/* Timeline */}
                  <View className="items-center mr-4">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${
                        isCompleted ? "bg-purple-600" : "bg-gray-700"
                      }`}
                    >
                      <Ionicons
                        name={step.icon as any}
                        size={20}
                        color={isCompleted ? "white" : "#6B7280"}
                      />
                    </View>
                    {index < ORDER_STEPS.length - 1 && (
                      <View
                        className={`w-1 h-12 ${
                          index < currentStepIndex ? "bg-purple-600" : "bg-gray-700"
                        }`}
                      />
                    )}
                  </View>

                  {/* Content */}
                  <View className="flex-1 pb-4">
                    <Text
                      className={`font-semibold ${
                        isCompleted ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </Text>
                    {isCurrent && (
                      <Text className="text-purple-400 text-sm mt-1">Current Status</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Tracking Info */}
        {order.trackingNumber && (
          <View className="mx-6 mt-6">
            <Text className="text-white font-bold text-lg mb-4">Tracking Information</Text>
            <View className="bg-[#151520] rounded-xl border border-gray-800 p-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-400 text-sm">Tracking Number</Text>
                  <Text className="text-white font-mono">{order.trackingNumber}</Text>
                </View>
                <Pressable className="bg-purple-600 px-4 py-2 rounded-lg">
                  <Text className="text-white font-bold text-sm">Track</Text>
                </Pressable>
              </View>
              {order.estimatedDelivery && (
                <View className="mt-4 pt-4 border-t border-gray-800">
                  <Text className="text-gray-400 text-sm">Estimated Delivery</Text>
                  <Text className="text-white">{order.estimatedDelivery}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Order Items */}
        <View className="mx-6 mt-6">
          <Text className="text-white font-bold text-lg mb-4">Items Ordered</Text>
          <View className="bg-[#151520] rounded-xl border border-gray-800 p-4">
            {order.items.map((item) => (
              <View
                key={item.id}
                className="flex-row mb-4 last:mb-0"
              >
                {item.productImage && (
                  <Image
                    source={{ uri: item.productImage }}
                    style={{ width: 60, height: 60, borderRadius: 8 }}
                    contentFit="cover"
                  />
                )}
                <View className="flex-1 ml-3">
                  <Text className="text-white font-semibold">{item.productTitle}</Text>
                  <Text className="text-gray-400 text-sm">{item.variantTitle}</Text>
                  <Text className="text-gray-400 text-sm">Qty: {item.quantity}</Text>
                </View>
                <Text className="text-white font-bold">${item.finalPrice.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Shipping Address */}
        <View className="mx-6 mt-6">
          <Text className="text-white font-bold text-lg mb-4">Shipping Address</Text>
          <View className="bg-[#151520] rounded-xl border border-gray-800 p-4">
            {order.shippingAddress && (
              <>
                <Text className="text-white font-semibold">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </Text>
                <Text className="text-gray-400">{order.shippingAddress.address1}</Text>
                {order.shippingAddress.address2 && (
                  <Text className="text-gray-400">{order.shippingAddress.address2}</Text>
                )}
                <Text className="text-gray-400">
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zipCode}
                </Text>
                <Text className="text-gray-400">{order.shippingAddress.country}</Text>
              </>
            )}
          </View>
        </View>

        {/* Order Summary */}
        <View className="mx-6 mt-6 mb-6">
          <Text className="text-white font-bold text-lg mb-4">Order Summary</Text>
          <View className="bg-[#151520] rounded-xl border border-gray-800 p-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400">Subtotal</Text>
              <Text className="text-white">${order.subtotal.toFixed(2)}</Text>
            </View>
            {order.promotionDiscount > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-green-400">Discount</Text>
                <Text className="text-green-400">-${order.promotionDiscount.toFixed(2)}</Text>
              </View>
            )}
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400">Shipping</Text>
              <Text className="text-white">${order.shippingCost.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400">Tax</Text>
              <Text className="text-white">${order.tax.toFixed(2)}</Text>
            </View>
            <View className="border-t border-gray-700 pt-3 mt-3">
              <View className="flex-row justify-between">
                <Text className="text-white font-bold">Total</Text>
                <Text className="text-green-400 font-bold">${order.total.toFixed(2)}</Text>
              </View>
            </View>

            <View className="mt-4 pt-4 border-t border-gray-800">
              <Text className="text-gray-400 text-sm">Order Date</Text>
              <Text className="text-white">{formatDate(order.createdAt)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="bg-[#151520] border-t border-gray-800 px-6 py-4">
        <Pressable
          onPress={() => navigation.goBack()}
          className="bg-purple-600 py-4 rounded-xl"
        >
          <Text className="text-white text-center font-bold">Continue Shopping</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};
