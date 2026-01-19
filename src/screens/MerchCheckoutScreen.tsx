import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../state/authStore";
import { useMerchStore } from "../state/merchStore";
import { LinearGradient } from "expo-linear-gradient";
import { PageContainer } from "../components/PageContainer";
import type { MerchShippingAddress } from "../types/printify";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const MerchCheckoutScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);

  const cart = useMerchStore((s) => s.cart);
  const getCartTotal = useMerchStore((s) => s.getCartTotal);
  const createOrder = useMerchStore((s) => s.createOrder);
  const applyPromotion = useMerchStore((s) => s.applyPromotion);

  const { subtotal, itemCount } = getCartTotal();

  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ discount: number; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Shipping form
  const [shippingForm, setShippingForm] = useState({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    phone: "",
  });

  // Calculate totals
  const shippingCost = shippingMethod === "express" ? 9.99 : 4.99;
  const discount = appliedPromo?.discount || 0;
  const tax = (subtotal - discount) * 0.0875;
  const total = subtotal - discount + shippingCost + tax;

  const handleApplyPromo = () => {
    if (!promoCode) return;

    const result = applyPromotion(promoCode, subtotal, user?.id || "", user?.tier || "user");
    if (result.valid) {
      setAppliedPromo({ discount: result.discount, message: result.message });
    } else {
      setAppliedPromo({ discount: 0, message: result.message });
    }
  };

  const handlePlaceOrder = () => {
    if (!validateForm()) return;

    setIsProcessing(true);

    const shippingAddress: MerchShippingAddress = {
      firstName: shippingForm.firstName,
      lastName: shippingForm.lastName,
      address1: shippingForm.address1,
      address2: shippingForm.address2 || undefined,
      city: shippingForm.city,
      state: shippingForm.state,
      zipCode: shippingForm.zipCode,
      country: shippingForm.country,
      phone: shippingForm.phone || undefined,
    };

    const order = createOrder(
      user?.id || "guest",
      `${shippingForm.firstName} ${shippingForm.lastName}`,
      user?.email || "",
      shippingAddress,
      shippingMethod,
      appliedPromo?.discount ? promoCode : undefined
    );

    setIsProcessing(false);

    if (order) {
      navigation.navigate("MerchOrderTracking", { orderId: order.id });
    }
  };

  const validateForm = () => {
    return (
      shippingForm.firstName &&
      shippingForm.lastName &&
      shippingForm.address1 &&
      shippingForm.city &&
      shippingForm.state &&
      shippingForm.zipCode
    );
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0F] items-center justify-center">
        <Ionicons name="bag-outline" size={64} color="#4B5563" />
        <Text className="text-white text-xl font-bold mt-4">Cart is Empty</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          className="bg-purple-600 px-6 py-3 rounded-xl mt-6"
        >
          <Text className="text-white font-bold">Browse Merch</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <PageContainer>
          <View className="flex-row items-center px-6 py-4 border-b border-white/5">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10 mr-3"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </Pressable>
            <Text className="text-white text-xl font-black italic tracking-tight uppercase">Checkout</Text>
          </View>
        </PageContainer>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <PageContainer>
            <View className="p-6">
              {/* Shipping Address */}
              <Text className="text-white font-black uppercase tracking-widest text-xs mb-4">Shipping Information</Text>
              <View className="bg-white/5 rounded-3xl border border-white/10 p-6 mb-8">
                <View className="flex-row mb-5">
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">First Name</Text>
                    <TextInput
                      placeholder="John"
                      placeholderTextColor="#4B5563"
                      value={shippingForm.firstName}
                      onChangeText={(text) => setShippingForm({ ...shippingForm, firstName: text })}
                      className="bg-black/20 text-white px-4 py-3.5 rounded-2xl border border-white/5 font-bold"
                    />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Last Name</Text>
                    <TextInput
                      placeholder="Doe"
                      placeholderTextColor="#4B5563"
                      value={shippingForm.lastName}
                      onChangeText={(text) => setShippingForm({ ...shippingForm, lastName: text })}
                      className="bg-black/20 text-white px-4 py-3.5 rounded-2xl border border-white/5 font-bold"
                    />
                  </View>
                </View>

                <View className="mb-5">
                  <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Street Address</Text>
                  <TextInput
                    placeholder="123 Main Street"
                    placeholderTextColor="#4B5563"
                    value={shippingForm.address1}
                    onChangeText={(text) => setShippingForm({ ...shippingForm, address1: text })}
                    className="bg-black/20 text-white px-4 py-3.5 rounded-2xl border border-white/5 font-bold"
                  />
                </View>

                <View className="mb-5">
                  <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Apt, Suite (Optional)</Text>
                  <TextInput
                    placeholder="Apt 4B"
                    placeholderTextColor="#4B5563"
                    value={shippingForm.address2}
                    onChangeText={(text) => setShippingForm({ ...shippingForm, address2: text })}
                    className="bg-black/20 text-white px-4 py-3.5 rounded-2xl border border-white/5 font-bold"
                  />
                </View>

                <View className="flex-row mb-5">
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">City</Text>
                    <TextInput
                      placeholder="New York"
                      placeholderTextColor="#4B5563"
                      value={shippingForm.city}
                      onChangeText={(text) => setShippingForm({ ...shippingForm, city: text })}
                      className="bg-black/20 text-white px-4 py-3.5 rounded-2xl border border-white/5 font-bold"
                    />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">State</Text>
                    <TextInput
                      placeholder="NY"
                      placeholderTextColor="#4B5563"
                      value={shippingForm.state}
                      onChangeText={(text) => setShippingForm({ ...shippingForm, state: text })}
                      className="bg-black/20 text-white px-4 py-3.5 rounded-2xl border border-white/5 font-bold"
                    />
                  </View>
                </View>

                <View className="flex-row">
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">ZIP Code</Text>
                    <TextInput
                      placeholder="10001"
                      placeholderTextColor="#4B5563"
                      value={shippingForm.zipCode}
                      onChangeText={(text) => setShippingForm({ ...shippingForm, zipCode: text })}
                      keyboardType="number-pad"
                      className="bg-black/20 text-white px-4 py-3.5 rounded-2xl border border-white/5 font-bold"
                    />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Phone</Text>
                    <TextInput
                      placeholder="(555) 000-0000"
                      placeholderTextColor="#4B5563"
                      value={shippingForm.phone}
                      onChangeText={(text) => setShippingForm({ ...shippingForm, phone: text })}
                      keyboardType="phone-pad"
                      className="bg-black/20 text-white px-4 py-3.5 rounded-2xl border border-white/5 font-bold"
                    />
                  </View>
                </View>
              </View>

              {/* Shipping Method */}
              <Text className="text-white font-black uppercase tracking-widest text-xs mb-4">Shipping Method</Text>
              <View className="mb-8">
                <Pressable
                  onPress={() => setShippingMethod("standard")}
                  className={`bg-white/5 rounded-3xl border p-5 mb-4 flex-row items-center justify-between ${shippingMethod === "standard" ? "border-purple-500" : "border-white/10"
                    }`}
                >
                  <View className="flex-row items-center">
                    <View
                      className={`w-6 h-6 rounded-full border-2 mr-4 items-center justify-center ${shippingMethod === "standard" ? "border-purple-500 bg-purple-500/10" : "border-white/20"
                        }`}
                    >
                      {shippingMethod === "standard" && (
                        <View className="w-3 h-3 rounded-full bg-purple-500" />
                      )}
                    </View>
                    <View>
                      <Text className="text-white font-bold">Standard Shipping</Text>
                      <Text className="text-gray-500 text-xs font-medium">5-7 business days</Text>
                    </View>
                  </View>
                  <Text className="text-white font-black">$4.99</Text>
                </Pressable>

                <Pressable
                  onPress={() => setShippingMethod("express")}
                  className={`bg-white/5 rounded-3xl border p-5 flex-row items-center justify-between ${shippingMethod === "express" ? "border-purple-500" : "border-white/10"
                    }`}
                >
                  <View className="flex-row items-center">
                    <View
                      className={`w-6 h-6 rounded-full border-2 mr-4 items-center justify-center ${shippingMethod === "express" ? "border-purple-500 bg-purple-500/10" : "border-white/20"
                        }`}
                    >
                      {shippingMethod === "express" && (
                        <View className="w-3 h-3 rounded-full bg-purple-500" />
                      )}
                    </View>
                    <View>
                      <Text className="text-white font-bold">Express Shipping</Text>
                      <Text className="text-gray-500 text-xs font-medium">2-3 business days</Text>
                    </View>
                  </View>
                  <Text className="text-white font-black">$9.99</Text>
                </Pressable>
              </View>

              {/* Promo Code */}
              <Text className="text-white font-black uppercase tracking-widest text-xs mb-4">Promo Code</Text>
              <View className="bg-white/5 rounded-3xl border border-white/10 p-5 mb-8">
                <View className="flex-row">
                  <TextInput
                    placeholder="Enter code"
                    placeholderTextColor="#4B5563"
                    value={promoCode}
                    onChangeText={setPromoCode}
                    autoCapitalize="characters"
                    className="flex-1 bg-black/20 text-white px-4 py-3.5 rounded-2xl border border-white/5 font-black uppercase"
                  />
                  <Pressable
                    onPress={handleApplyPromo}
                    className="bg-white/10 px-6 ml-3 rounded-2xl border border-white/10 items-center justify-center"
                  >
                    <Text className="text-white font-black text-xs uppercase tracking-widest">Apply</Text>
                  </Pressable>
                </View>
                {appliedPromo && (
                  <View className="mt-3 flex-row items-center">
                    <Ionicons
                      name={appliedPromo.discount > 0 ? "checkmark-circle" : "alert-circle"}
                      size={14}
                      color={appliedPromo.discount > 0 ? "#10B981" : "#EF4444"}
                    />
                    <Text
                      className={`ml-1.5 text-xs font-bold ${appliedPromo.discount > 0 ? "text-green-400" : "text-red-400"
                        }`}
                    >
                      {appliedPromo.message}
                    </Text>
                  </View>
                )}
              </View>

              {/* Order Summary */}
              <Text className="text-white font-black uppercase tracking-widest text-xs mb-4">Grand Total</Text>
              <View className="bg-white/5 rounded-3xl border border-white/10 p-6 mb-12">
                <View className="flex-row justify-between mb-4">
                  <Text className="text-gray-500 font-bold">Subtotal</Text>
                  <Text className="text-white font-black tracking-tight">${subtotal.toFixed(2)}</Text>
                </View>
                {discount > 0 && (
                  <View className="flex-row justify-between mb-4">
                    <Text className="text-green-500 font-bold">Discount</Text>
                    <Text className="text-green-500 font-black tracking-tight">-${discount.toFixed(2)}</Text>
                  </View>
                )}
                <View className="flex-row justify-between mb-4">
                  <Text className="text-gray-500 font-bold">Shipping</Text>
                  <Text className="text-white font-black tracking-tight">${shippingCost.toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between mb-6">
                  <Text className="text-gray-500 font-bold">Estimated Tax</Text>
                  <Text className="text-white font-black tracking-tight">${tax.toFixed(2)}</Text>
                </View>
                <View className="border-t border-white/10 pt-6">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-white font-black text-xl uppercase tracking-widest italic">Total</Text>
                    <Text className="text-green-400 font-black text-3xl tracking-tighter">${total.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </PageContainer>
        </ScrollView>

        {/* Place Order Button */}
        <View className="bg-black/90 border-t border-white/10 items-center">
          <PageContainer>
            <View className="px-6 py-6 w-full max-w-[800px]">
              <Pressable
                onPress={handlePlaceOrder}
                disabled={!validateForm() || isProcessing}
                className="overflow-hidden rounded-2xl"
              >
                <LinearGradient
                  colors={validateForm() && !isProcessing ? ["#8B5CF6", "#D946EF"] : ["#1F1F2E", "#1F1F2E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-5 items-center"
                >
                  <Text className="text-white font-black uppercase tracking-widest text-sm">
                    {isProcessing ? "PROCESSING SECURELY..." : `PLACE ORDER - $${total.toFixed(2)}`}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </PageContainer>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
