import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useMerchantStore } from "../state/merchantStore";
import type { OrderStatus } from "../types/merchant";
import type { RootStackParamList } from "../navigation/RootNavigator";

const ORDER_STATUSES: { status: OrderStatus; label: string; icon: string }[] = [
  { status: "pending", label: "Order Placed", icon: "receipt-outline" },
  { status: "confirmed", label: "Confirmed", icon: "checkmark-circle-outline" },
  { status: "preparing", label: "Preparing", icon: "restaurant-outline" },
  { status: "ready", label: "Ready", icon: "bag-check-outline" },
  { status: "out_for_delivery", label: "On the Way", icon: "bicycle-outline" },
  { status: "delivered", label: "Delivered", icon: "home-outline" },
];

const PICKUP_STATUSES: { status: OrderStatus; label: string; icon: string }[] = [
  { status: "pending", label: "Order Placed", icon: "receipt-outline" },
  { status: "confirmed", label: "Confirmed", icon: "checkmark-circle-outline" },
  { status: "preparing", label: "Preparing", icon: "restaurant-outline" },
  { status: "ready", label: "Ready for Pickup", icon: "bag-check-outline" },
  { status: "completed", label: "Picked Up", icon: "checkmark-done-outline" },
];

interface StatusStepProps {
  status: OrderStatus;
  label: string;
  icon: string;
  isActive: boolean;
  isCompleted: boolean;
  isLast: boolean;
}

const StatusStep: React.FC<StatusStepProps> = ({
  label,
  icon,
  isActive,
  isCompleted,
  isLast,
}) => {
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      pulseValue.value = withRepeat(
        withTiming(1.2, { duration: 1000 }),
        -1,
        true
      );
    }
  }, [isActive, pulseValue]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isActive ? pulseValue.value : 1 }],
  }));

  return (
    <View className="flex-row items-start">
      <View className="items-center">
        <Animated.View
          style={pulseStyle}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            isCompleted
              ? "bg-green-500"
              : isActive
              ? "bg-[#8B5CF6]"
              : "bg-[#2A2A3E]"
          }`}
        >
          <Ionicons
            name={isCompleted ? "checkmark" : (icon as any)}
            size={20}
            color="#FFFFFF"
          />
        </Animated.View>
        {!isLast && (
          <View
            className={`w-0.5 h-12 ${
              isCompleted ? "bg-green-500" : "bg-[#2A2A3E]"
            }`}
          />
        )}
      </View>
      <View className="ml-4 flex-1 pb-8">
        <Text
          className={`font-semibold ${
            isActive || isCompleted ? "text-white" : "text-gray-500"
          }`}
        >
          {label}
        </Text>
        {isActive && (
          <Text className="text-[#8B5CF6] text-sm mt-1">In progress...</Text>
        )}
      </View>
    </View>
  );
};

export const OrderTrackingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "OrderTracking">>();
  const { orderId } = route.params;

  const getOrder = useMerchantStore((s) => s.getOrder);
  const getMerchant = useMerchantStore((s) => s.getMerchant);
  const updateOrderStatus = useMerchantStore((s) => s.updateOrderStatus);
  const updatePaymentStatus = useMerchantStore((s) => s.updatePaymentStatus);

  const order = getOrder(orderId);
  const merchant = order ? getMerchant(order.merchantId) : null;

  // Simulate order status progression
  useEffect(() => {
    if (!order) return;

    // Mark as paid immediately
    if (order.paymentStatus === "pending") {
      updatePaymentStatus(orderId, "paid");
    }

    // Simulate status updates
    const statusProgression: OrderStatus[] =
      order.deliveryType === "delivery"
        ? ["confirmed", "preparing", "ready", "out_for_delivery", "delivered"]
        : ["confirmed", "preparing", "ready", "completed"];

    let currentIndex = statusProgression.indexOf(order.status);

    const timer = setInterval(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < statusProgression.length) {
        updateOrderStatus(orderId, statusProgression[nextIndex]);
        currentIndex = nextIndex;
      } else {
        clearInterval(timer);
      }
    }, 5000); // Update every 5 seconds for demo

    return () => clearInterval(timer);
  }, [orderId]);

  const getStatusIndex = (status: OrderStatus) => {
    const statuses = order?.deliveryType === "delivery" ? ORDER_STATUSES : PICKUP_STATUSES;
    return statuses.findIndex((s) => s.status === status);
  };

  if (!order || !merchant) {
    return (
      <View className="flex-1 bg-[#0A0A0F] items-center justify-center">
        <Text className="text-white">Order not found</Text>
      </View>
    );
  }

  const statuses = order.deliveryType === "delivery" ? ORDER_STATUSES : PICKUP_STATUSES;
  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      {/* Header */}
      <View
        className="px-4 py-4 border-b border-[#1F1F2E]"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => navigation.navigate("MainTabs")}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
          <Text className="text-white text-lg font-bold">Order Status</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Success Banner */}
        <View className="bg-green-500/20 rounded-2xl p-6 mb-6 items-center">
          <View className="bg-green-500 rounded-full p-4 mb-4">
            <Ionicons name="checkmark" size={32} color="#FFFFFF" />
          </View>
          <Text className="text-white text-xl font-bold">Order Placed!</Text>
          <Text className="text-gray-400 mt-2 text-center">
            Your order #{order.orderNumber} has been received
          </Text>
          <Text className="text-[#8B5CF6] font-semibold mt-2">
            Estimated: {order.estimatedTime}
          </Text>
        </View>

        {/* Merchant Info */}
        <View className="flex-row items-center bg-[#1A1A2E] rounded-xl p-4 mb-6 border border-[#2A2A3E]">
          {merchant.logoUrl && (
            <Image
              source={{ uri: merchant.logoUrl }}
              style={{ width: 48, height: 48, borderRadius: 12 }}
              contentFit="cover"
              transition={200}
            />
          )}
          <View className="flex-1 ml-3">
            <Text className="text-white font-semibold">{merchant.name}</Text>
            <Text className="text-gray-400 text-sm">
              {order.deliveryType === "pickup" ? "Pickup" : "Delivery"}
            </Text>
          </View>
          <Pressable className="bg-[#2A2A3E] rounded-full p-2">
            <Ionicons name="call-outline" size={20} color="#8B5CF6" />
          </Pressable>
        </View>

        {/* Order Status Timeline */}
        <View className="bg-[#1A1A2E] rounded-xl p-4 mb-6 border border-[#2A2A3E]">
          <Text className="text-white font-semibold text-lg mb-4">
            Order Progress
          </Text>
          {statuses.map((step, index) => {
            const isCompleted = index < currentStatusIndex;
            const isActive = index === currentStatusIndex;
            const isLast = index === statuses.length - 1;

            return (
              <StatusStep
                key={step.status}
                {...step}
                isActive={isActive}
                isCompleted={isCompleted}
                isLast={isLast}
              />
            );
          })}
        </View>

        {/* Delivery Address / Pickup Location */}
        <View className="bg-[#1A1A2E] rounded-xl p-4 mb-6 border border-[#2A2A3E]">
          <Text className="text-white font-semibold text-lg mb-3">
            {order.deliveryType === "delivery" ? "Delivery Address" : "Pickup Location"}
          </Text>
          <View className="flex-row items-start">
            <Ionicons
              name={order.deliveryType === "delivery" ? "location" : "storefront"}
              size={20}
              color="#8B5CF6"
            />
            <View className="ml-3 flex-1">
              {order.deliveryType === "delivery" && order.deliveryAddress ? (
                <>
                  <Text className="text-white">
                    {order.deliveryAddress.street}
                    {order.deliveryAddress.apartment && `, ${order.deliveryAddress.apartment}`}
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    {order.deliveryAddress.city}, {order.deliveryAddress.state}{" "}
                    {order.deliveryAddress.zipCode}
                  </Text>
                  {order.deliveryAddress.instructions && (
                    <Text className="text-gray-500 text-sm mt-1">
                      Note: {order.deliveryAddress.instructions}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text className="text-white">{merchant.name}</Text>
                  <Text className="text-gray-400 text-sm">{merchant.address}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Order Details */}
        <View className="bg-[#1A1A2E] rounded-xl p-4 border border-[#2A2A3E]">
          <Text className="text-white font-semibold text-lg mb-4">
            Order Details
          </Text>

          {order.items.map((item) => (
            <View
              key={item.id}
              className="flex-row items-start py-3 border-b border-[#2A2A3E] last:border-b-0"
            >
              <View className="bg-[#2A2A3E] rounded-lg w-8 h-8 items-center justify-center mr-3">
                <Text className="text-white font-bold">{item.quantity}x</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white">{item.itemName}</Text>
                {item.selectedOptions.length > 0 && (
                  <Text className="text-gray-500 text-sm">
                    {item.selectedOptions.map((o) => o.choiceName).join(", ")}
                  </Text>
                )}
                {item.notes && (
                  <Text className="text-gray-500 text-sm italic">
                    Note: {item.notes}
                  </Text>
                )}
              </View>
              <Text className="text-white">${item.lineTotal.toFixed(2)}</Text>
            </View>
          ))}

          {/* Totals */}
          <View className="mt-4 pt-4 border-t border-[#2A2A3E]">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400">Subtotal</Text>
              <Text className="text-white">${order.subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400">Tax</Text>
              <Text className="text-white">${order.tax.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400">
                {order.deliveryType === "delivery" ? "Delivery Fee" : "Pickup"}
              </Text>
              <Text className="text-white">
                {order.deliveryFee === 0 ? "Free" : `$${order.deliveryFee.toFixed(2)}`}
              </Text>
            </View>
            {order.tip > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-400">Tip</Text>
                <Text className="text-white">${order.tip.toFixed(2)}</Text>
              </View>
            )}
            <View className="flex-row justify-between mt-2 pt-2 border-t border-[#2A2A3E]">
              <Text className="text-white font-bold">Total</Text>
              <Text className="text-[#8B5CF6] font-bold">${order.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-[#1A1A2E] border-t border-[#2A2A3E] px-4 py-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <View className="flex-row">
          <Pressable
            onPress={() => navigation.navigate("OrderHistory")}
            className="flex-1 bg-[#2A2A3E] rounded-xl py-4 mr-2"
          >
            <Text className="text-white font-semibold text-center">
              View All Orders
            </Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("MainTabs")}
            className="flex-1 bg-[#8B5CF6] rounded-xl py-4"
          >
            <Text className="text-white font-semibold text-center">
              Back to Home
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
