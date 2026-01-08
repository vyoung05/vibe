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
        <View className="flex-row items-center px-6 py-4 border-b border-gray-800">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-bold">Checkout</Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6">
            {/* Shipping Address */}
            <Text className="text-white font-bold text-lg mb-4">Shipping Address</Text>
            <View className="bg-[#151520] rounded-xl border border-gray-800 p-4 mb-6">
              <View className="flex-row mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-gray-400 text-sm mb-2">First Name *</Text>
                  <TextInput
                    placeholder="John"
                    placeholderTextColor="#6B7280"
                    value={shippingForm.firstName}
                    onChangeText={(text) => setShippingForm({ ...shippingForm, firstName: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-gray-400 text-sm mb-2">Last Name *</Text>
                  <TextInput
                    placeholder="Doe"
                    placeholderTextColor="#6B7280"
                    value={shippingForm.lastName}
                    onChangeText={(text) => setShippingForm({ ...shippingForm, lastName: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">Address *</Text>
                <TextInput
                  placeholder="123 Main Street"
                  placeholderTextColor="#6B7280"
                  value={shippingForm.address1}
                  onChangeText={(text) => setShippingForm({ ...shippingForm, address1: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">Apt, Suite (Optional)</Text>
                <TextInput
                  placeholder="Apt 4B"
                  placeholderTextColor="#6B7280"
                  value={shippingForm.address2}
                  onChangeText={(text) => setShippingForm({ ...shippingForm, address2: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                />
              </View>

              <View className="flex-row mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-gray-400 text-sm mb-2">City *</Text>
                  <TextInput
                    placeholder="New York"
                    placeholderTextColor="#6B7280"
                    value={shippingForm.city}
                    onChangeText={(text) => setShippingForm({ ...shippingForm, city: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-gray-400 text-sm mb-2">State *</Text>
                  <TextInput
                    placeholder="NY"
                    placeholderTextColor="#6B7280"
                    value={shippingForm.state}
                    onChangeText={(text) => setShippingForm({ ...shippingForm, state: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  />
                </View>
              </View>

              <View className="flex-row">
                <View className="flex-1 mr-2">
                  <Text className="text-gray-400 text-sm mb-2">ZIP Code *</Text>
                  <TextInput
                    placeholder="10001"
                    placeholderTextColor="#6B7280"
                    value={shippingForm.zipCode}
                    onChangeText={(text) => setShippingForm({ ...shippingForm, zipCode: text })}
                    keyboardType="number-pad"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-gray-400 text-sm mb-2">Phone</Text>
                  <TextInput
                    placeholder="(555) 123-4567"
                    placeholderTextColor="#6B7280"
                    value={shippingForm.phone}
                    onChangeText={(text) => setShippingForm({ ...shippingForm, phone: text })}
                    keyboardType="phone-pad"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  />
                </View>
              </View>
            </View>

            {/* Shipping Method */}
            <Text className="text-white font-bold text-lg mb-4">Shipping Method</Text>
            <View className="mb-6">
              <Pressable
                onPress={() => setShippingMethod("standard")}
                className={`bg-[#151520] rounded-xl border p-4 mb-3 flex-row items-center justify-between ${
                  shippingMethod === "standard" ? "border-purple-500" : "border-gray-800"
                }`}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                      shippingMethod === "standard" ? "border-purple-500" : "border-gray-600"
                    }`}
                  >
                    {shippingMethod === "standard" && (
                      <View className="w-3 h-3 rounded-full bg-purple-500" />
                    )}
                  </View>
                  <View>
                    <Text className="text-white font-semibold">Standard Shipping</Text>
                    <Text className="text-gray-400 text-sm">5-7 business days</Text>
                  </View>
                </View>
                <Text className="text-white font-bold">$4.99</Text>
              </Pressable>

              <Pressable
                onPress={() => setShippingMethod("express")}
                className={`bg-[#151520] rounded-xl border p-4 flex-row items-center justify-between ${
                  shippingMethod === "express" ? "border-purple-500" : "border-gray-800"
                }`}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                      shippingMethod === "express" ? "border-purple-500" : "border-gray-600"
                    }`}
                  >
                    {shippingMethod === "express" && (
                      <View className="w-3 h-3 rounded-full bg-purple-500" />
                    )}
                  </View>
                  <View>
                    <Text className="text-white font-semibold">Express Shipping</Text>
                    <Text className="text-gray-400 text-sm">2-3 business days</Text>
                  </View>
                </View>
                <Text className="text-white font-bold">$9.99</Text>
              </Pressable>
            </View>

            {/* Promo Code */}
            <Text className="text-white font-bold text-lg mb-4">Promo Code</Text>
            <View className="bg-[#151520] rounded-xl border border-gray-800 p-4 mb-6">
              <View className="flex-row">
                <TextInput
                  placeholder="Enter promo code"
                  placeholderTextColor="#6B7280"
                  value={promoCode}
                  onChangeText={setPromoCode}
                  autoCapitalize="characters"
                  className="flex-1 bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mr-3"
                />
                <Pressable
                  onPress={handleApplyPromo}
                  className="bg-purple-600 px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-bold">Apply</Text>
                </Pressable>
              </View>
              {appliedPromo && (
                <Text
                  className={`mt-3 text-sm ${
                    appliedPromo.discount > 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {appliedPromo.message}
                </Text>
              )}
            </View>

            {/* Order Summary */}
            <Text className="text-white font-bold text-lg mb-4">Order Summary</Text>
            <View className="bg-[#151520] rounded-xl border border-gray-800 p-4 mb-6">
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-400">Subtotal ({itemCount} items)</Text>
                <Text className="text-white">${subtotal.toFixed(2)}</Text>
              </View>
              {discount > 0 && (
                <View className="flex-row justify-between mb-3">
                  <Text className="text-green-400">Discount</Text>
                  <Text className="text-green-400">-${discount.toFixed(2)}</Text>
                </View>
              )}
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-400">Shipping</Text>
                <Text className="text-white">${shippingCost.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-400">Tax</Text>
                <Text className="text-white">${tax.toFixed(2)}</Text>
              </View>
              <View className="border-t border-gray-700 pt-3 mt-3">
                <View className="flex-row justify-between">
                  <Text className="text-white font-bold text-lg">Total</Text>
                  <Text className="text-green-400 font-bold text-lg">${total.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Place Order Button */}
        <View className="bg-[#151520] border-t border-gray-800 px-6 py-4">
          <Pressable
            onPress={handlePlaceOrder}
            disabled={!validateForm() || isProcessing}
            className={`py-4 rounded-xl ${
              validateForm() && !isProcessing ? "bg-purple-600" : "bg-gray-700"
            }`}
          >
            <Text className="text-white text-center font-bold">
              {isProcessing ? "Processing..." : `Place Order - $${total.toFixed(2)}`}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
