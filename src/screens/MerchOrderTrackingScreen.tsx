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
import { LinearGradient } from "expo-linear-gradient";
import { PageContainer } from "../components/PageContainer";

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
      <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
        <PageContainer>
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-20 h-20 bg-white/5 rounded-full items-center justify-center mb-6">
              <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
            </View>
            <Text className="text-white text-2xl font-black mb-2 italic tracking-tight">ORDER NOT FOUND</Text>
            <Text className="text-gray-500 text-center font-bold text-sm">We couldn't locate this order in our records.</Text>
            <Pressable
              onPress={() => navigation.goBack()}
              className="mt-8 overflow-hidden rounded-2xl w-full max-w-[300px]"
            >
              <LinearGradient
                colors={["#8B5CF6", "#D946EF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 items-center"
              >
                <Text className="text-white font-black uppercase tracking-widest text-xs">GO BACK</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </PageContainer>
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
      <PageContainer>
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-white/5">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10 mr-3"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </Pressable>
            <View>
              <Text className="text-white text-xl font-black italic tracking-tight uppercase">Order Status</Text>
              <Text className="text-purple-500 text-[10px] font-black uppercase tracking-widest">{order.orderNumber}</Text>
            </View>
          </View>
          <View
            className={`px-3 py-1.5 rounded-full border ${order.status === "delivered"
              ? "bg-green-500/10 border-green-500/20"
              : order.status === "cancelled"
                ? "bg-red-500/10 border-red-500/20"
                : "bg-purple-500/10 border-purple-500/20"
              }`}
          >
            <Text
              className={`text-[10px] font-black tracking-widest ${order.status === "delivered"
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
      </PageContainer>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <PageContainer>
          {/* Success Banner (if just placed) */}
          {order.status === "pending" && (
            <View className="mx-6 mt-8 overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-green-500/20">
              <LinearGradient
                colors={["#064E3B", "#065F46"]}
                className="p-8 items-center"
              >
                <View className="w-16 h-16 rounded-full bg-green-500 items-center justify-center mb-4 border-4 border-white/20">
                  <Ionicons name="checkmark" size={40} color="white" />
                </View>
                <Text className="text-white text-2xl font-black mb-2 italic">ORDER CONFIRMED!</Text>
                <Text className="text-green-100 text-center font-bold text-sm tracking-wide opacity-80">
                  We've received your order and we're getting it ready for production.
                </Text>
              </LinearGradient>
            </View>
          )}

          {/* Order Progress */}
          <View className="mx-6 mt-8">
            <Text className="text-white font-black uppercase tracking-widest text-xs mb-4">Tracking Progress</Text>
            <View className="bg-white/5 rounded-3xl border border-white/10 p-6">
              {ORDER_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <View key={step.status} className="flex-row">
                    {/* Timeline */}
                    <View className="items-center mr-5">
                      <View
                        className={`w-10 h-10 rounded-2xl items-center justify-center border ${isCompleted ? "bg-purple-600 border-purple-400" : "bg-white/5 border-white/10"
                          }`}
                      >
                        <Ionicons
                          name={step.icon as any}
                          size={18}
                          color={isCompleted ? "white" : "#4B5563"}
                        />
                      </View>
                      {index < ORDER_STEPS.length - 1 && (
                        <View
                          className={`w-[2px] h-10 ${index < currentStepIndex ? "bg-purple-600" : "bg-white/10"
                            }`}
                        />
                      )}
                    </View>

                    {/* Content */}
                    <View className="flex-1 pb-4">
                      <Text
                        className={`text-sm font-black uppercase tracking-wider ${isCompleted ? "text-white" : "text-gray-600"
                          }`}
                      >
                        {step.label}
                      </Text>
                      {isCurrent && (
                        <View className="bg-purple-500/10 self-start px-2 py-0.5 rounded-md mt-1 border border-purple-500/20">
                          <Text className="text-purple-400 text-[9px] font-black uppercase tracking-widest">Active Now</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Tracking Info */}
          {order.trackingNumber && (
            <View className="mx-6 mt-8">
              <Text className="text-white font-black uppercase tracking-widest text-xs mb-4">Shipping Label</Text>
              <View className="bg-white/5 rounded-3xl border border-white/10 p-6">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Carrier ID</Text>
                    <Text className="text-white font-black text-lg tracking-wider">{order.trackingNumber}</Text>
                  </View>
                  <Pressable className="bg-white/5 px-5 py-2.5 rounded-2xl border border-white/10">
                    <Text className="text-white font-black text-xs uppercase tracking-widest">Track Item</Text>
                  </Pressable>
                </View>
                {order.estimatedDelivery && (
                  <View className="mt-6 pt-6 border-t border-white/5">
                    <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Estimated Arrival</Text>
                    <Text className="text-green-400 font-black text-lg">{order.estimatedDelivery}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Order Items */}
          <View className="mx-6 mt-8">
            <Text className="text-white font-black uppercase tracking-widest text-xs mb-4">Pack List</Text>
            <View className="bg-white/5 rounded-3xl border border-white/10 p-6">
              {order.items.map((item, idx) => (
                <View
                  key={item.id}
                  className={`flex-row items-center ${idx < order.items.length - 1 ? "mb-6" : ""}`}
                >
                  {item.productImage && (
                    <Image
                      source={{ uri: item.productImage }}
                      style={{ width: 50, height: 50, borderRadius: 12 }}
                      contentFit="cover"
                    />
                  )}
                  <View className="flex-1 ml-4">
                    <Text className="text-white font-bold text-sm leading-tight mb-0.5" numberOfLines={1}>{item.productTitle}</Text>
                    <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{item.variantTitle} × {item.quantity}</Text>
                  </View>
                  <Text className="text-white font-black text-sm">${item.finalPrice.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Shipping Address */}
          <View className="mx-6 mt-8">
            <Text className="text-white font-black uppercase tracking-widest text-xs mb-4">Ship To</Text>
            <View className="bg-white/5 rounded-3xl border border-white/10 p-6">
              {order.shippingAddress && (
                <>
                  <Text className="text-white font-black text-sm uppercase tracking-wider mb-2">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </Text>
                  <Text className="text-gray-500 font-bold text-sm leading-6">
                    {order.shippingAddress.address1}{"\n"}
                    {order.shippingAddress.address2 ? order.shippingAddress.address2 + "\n" : ""}
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}{"\n"}
                    {order.shippingAddress.country}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Order Summary */}
          <View className="mx-6 mt-8 mb-12">
            <Text className="text-white font-black uppercase tracking-widest text-xs mb-4">Receipt</Text>
            <View className="bg-white/5 rounded-3xl border border-white/10 p-6">
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-500 font-bold">Subtotal</Text>
                <Text className="text-white font-black">${order.subtotal.toFixed(2)}</Text>
              </View>
              {order.promotionDiscount > 0 && (
                <View className="flex-row justify-between mb-3">
                  <Text className="text-green-500 font-bold">Discount</Text>
                  <Text className="text-green-500 font-black">-${order.promotionDiscount.toFixed(2)}</Text>
                </View>
              )}
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-500 font-bold">Shipping</Text>
                <Text className="text-white font-black">${order.shippingCost.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between mb-5">
                <Text className="text-gray-500 font-bold">Tax</Text>
                <Text className="text-white font-black">${order.tax.toFixed(2)}</Text>
              </View>
              <View className="border-t border-white/5 pt-5 mt-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-white font-black text-lg uppercase tracking-widest italic">Total</Text>
                  <Text className="text-green-400 font-black text-2xl tracking-tighter">${order.total.toFixed(2)}</Text>
                </View>
              </View>

              <View className="mt-6 pt-6 border-t border-white/5 items-center">
                <Text className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-1">Purchased On</Text>
                <Text className="text-gray-400 font-bold text-xs">{formatDate(order.createdAt)}</Text>
              </View>
            </View>
          </View>
        </PageContainer>
      </ScrollView>

      {/* Bottom Action */}
      <View className="bg-black/90 border-t border-white/10 items-center">
        <PageContainer>
          <View className="px-6 py-6 w-full max-w-[800px]">
            <Pressable
              onPress={() => navigation.navigate("MerchStore")}
              className="overflow-hidden rounded-2xl"
            >
              <LinearGradient
                colors={["#8B5CF6", "#D946EF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-5 items-center"
              >
                <Text className="text-white font-black uppercase tracking-widest text-sm">CONTINUE SHOPPING</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </PageContainer>
      </View>
    </SafeAreaView>
  );
};
