import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { useMerchantStore } from "../state/merchantStore";
import { useAuthStore } from "../state/authStore";
import type { DeliveryAddress, DeliveryType } from "../types/merchant";
import type { RootStackParamList } from "../navigation/RootNavigator";

const TIP_OPTIONS = [0, 2, 3, 5];

export const CheckoutScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const user = useAuthStore((s) => s.user);
  const cart = useMerchantStore((s) => s.cart);
  const getMerchant = useMerchantStore((s) => s.getMerchant);
  const getCartTotal = useMerchantStore((s) => s.getCartTotal);
  const getUserAddresses = useMerchantStore((s) => s.getUserAddresses);
  const addAddress = useMerchantStore((s) => s.addAddress);
  const createOrder = useMerchantStore((s) => s.createOrder);

  const merchant = cart ? getMerchant(cart.merchantId) : null;
  const { subtotal } = getCartTotal();
  const savedAddresses = user ? getUserAddresses(user.id) : [];

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    savedAddresses.find((a) => a.isDefault)?.id || savedAddresses[0]?.id || null
  );
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "",
    street: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    instructions: "",
  });
  const [phone, setPhone] = useState("");
  const [selectedTip, setSelectedTip] = useState(3);
  const [customTip, setCustomTip] = useState("");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate totals
  const tax = subtotal * 0.0875;
  const deliveryFee = deliveryType === "delivery" ? (merchant?.deliveryFee || 0) : 0;
  const tip = customTip ? parseFloat(customTip) || 0 : selectedTip;
  const total = subtotal + tax + deliveryFee + tip;

  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId);

  const canCheckout =
    cart &&
    cart.items.length > 0 &&
    (deliveryType === "pickup" || selectedAddress) &&
    phone.length >= 10;

  const handleAddAddress = () => {
    if (!user) return;
    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zipCode) {
      return;
    }

    const addressId = addAddress({
      userId: user.id,
      label: newAddress.label || "Home",
      street: newAddress.street,
      apartment: newAddress.apartment || undefined,
      city: newAddress.city,
      state: newAddress.state,
      zipCode: newAddress.zipCode,
      instructions: newAddress.instructions || undefined,
      isDefault: savedAddresses.length === 0,
    });

    setSelectedAddressId(addressId);
    setShowAddAddress(false);
    setNewAddress({
      label: "",
      street: "",
      apartment: "",
      city: "",
      state: "",
      zipCode: "",
      instructions: "",
    });
  };

  const handlePlaceOrder = async () => {
    if (!canCheckout || !user || !cart) return;

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const order = createOrder(
      user.id,
      user.username,
      phone,
      deliveryType,
      deliveryType === "delivery" ? selectedAddress : undefined,
      "Apple Pay", // Simulated payment method
      tip,
      notes || undefined
    );

    if (order) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace("OrderTracking", { orderId: order.id });
    } else {
      setIsProcessing(false);
    }
  };

  if (!cart || !merchant) {
    return (
      <View className="flex-1 bg-[#0A0A0F] items-center justify-center">
        <Text className="text-white">No items in cart</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0A0A0F]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        className="flex-row items-center px-4 py-4 border-b border-[#1F1F2E]"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="text-white text-xl font-bold">Checkout</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Delivery Type Toggle */}
        <View className="flex-row bg-[#1A1A2E] rounded-xl p-1 mb-6">
          <Pressable
            onPress={() => setDeliveryType("delivery")}
            className={`flex-1 py-3 rounded-lg ${
              deliveryType === "delivery" ? "bg-[#8B5CF6]" : ""
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                deliveryType === "delivery" ? "text-white" : "text-gray-400"
              }`}
            >
              Delivery
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setDeliveryType("pickup")}
            className={`flex-1 py-3 rounded-lg ${
              deliveryType === "pickup" ? "bg-[#8B5CF6]" : ""
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                deliveryType === "pickup" ? "text-white" : "text-gray-400"
              }`}
            >
              Pickup
            </Text>
          </Pressable>
        </View>

        {/* Delivery Address */}
        {deliveryType === "delivery" && (
          <View className="mb-6">
            <Text className="text-white font-semibold text-lg mb-3">
              Delivery Address
            </Text>

            {savedAddresses.map((address) => (
              <Pressable
                key={address.id}
                onPress={() => setSelectedAddressId(address.id)}
                className={`flex-row items-center p-4 rounded-xl mb-2 border ${
                  selectedAddressId === address.id
                    ? "bg-[#8B5CF6]/20 border-[#8B5CF6]"
                    : "bg-[#1A1A2E] border-[#2A2A3E]"
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                    selectedAddressId === address.id
                      ? "border-[#8B5CF6] bg-[#8B5CF6]"
                      : "border-gray-500"
                  }`}
                >
                  {selectedAddressId === address.id && (
                    <View className="w-2 h-2 rounded-full bg-white" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium">{address.label}</Text>
                  <Text className="text-gray-400 text-sm">
                    {address.street}
                    {address.apartment && `, ${address.apartment}`}
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    {address.city}, {address.state} {address.zipCode}
                  </Text>
                </View>
              </Pressable>
            ))}

            {/* Add New Address */}
            {!showAddAddress ? (
              <Pressable
                onPress={() => setShowAddAddress(true)}
                className="flex-row items-center justify-center py-4 border border-dashed border-[#3A3A4E] rounded-xl"
              >
                <Ionicons name="add-circle-outline" size={20} color="#8B5CF6" />
                <Text className="text-[#8B5CF6] font-medium ml-2">
                  Add New Address
                </Text>
              </Pressable>
            ) : (
              <View className="bg-[#1A1A2E] rounded-xl p-4 border border-[#2A2A3E]">
                <TextInput
                  className="bg-[#2A2A3E] rounded-lg px-4 py-3 text-white mb-3"
                  placeholder="Label (e.g., Home, Work)"
                  placeholderTextColor="#6B7280"
                  value={newAddress.label}
                  onChangeText={(text) =>
                    setNewAddress({ ...newAddress, label: text })
                  }
                />
                <TextInput
                  className="bg-[#2A2A3E] rounded-lg px-4 py-3 text-white mb-3"
                  placeholder="Street Address *"
                  placeholderTextColor="#6B7280"
                  value={newAddress.street}
                  onChangeText={(text) =>
                    setNewAddress({ ...newAddress, street: text })
                  }
                />
                <TextInput
                  className="bg-[#2A2A3E] rounded-lg px-4 py-3 text-white mb-3"
                  placeholder="Apt, Suite, Floor (optional)"
                  placeholderTextColor="#6B7280"
                  value={newAddress.apartment}
                  onChangeText={(text) =>
                    setNewAddress({ ...newAddress, apartment: text })
                  }
                />
                <View className="flex-row mb-3">
                  <TextInput
                    className="flex-1 bg-[#2A2A3E] rounded-lg px-4 py-3 text-white mr-2"
                    placeholder="City *"
                    placeholderTextColor="#6B7280"
                    value={newAddress.city}
                    onChangeText={(text) =>
                      setNewAddress({ ...newAddress, city: text })
                    }
                  />
                  <TextInput
                    className="w-20 bg-[#2A2A3E] rounded-lg px-4 py-3 text-white"
                    placeholder="State *"
                    placeholderTextColor="#6B7280"
                    value={newAddress.state}
                    onChangeText={(text) =>
                      setNewAddress({ ...newAddress, state: text })
                    }
                  />
                </View>
                <TextInput
                  className="bg-[#2A2A3E] rounded-lg px-4 py-3 text-white mb-3"
                  placeholder="ZIP Code *"
                  placeholderTextColor="#6B7280"
                  value={newAddress.zipCode}
                  onChangeText={(text) =>
                    setNewAddress({ ...newAddress, zipCode: text })
                  }
                  keyboardType="number-pad"
                />
                <TextInput
                  className="bg-[#2A2A3E] rounded-lg px-4 py-3 text-white mb-4"
                  placeholder="Delivery Instructions (optional)"
                  placeholderTextColor="#6B7280"
                  value={newAddress.instructions}
                  onChangeText={(text) =>
                    setNewAddress({ ...newAddress, instructions: text })
                  }
                />
                <View className="flex-row">
                  <Pressable
                    onPress={() => setShowAddAddress(false)}
                    className="flex-1 bg-[#2A2A3E] rounded-lg py-3 mr-2"
                  >
                    <Text className="text-white text-center font-medium">
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleAddAddress}
                    className="flex-1 bg-[#8B5CF6] rounded-lg py-3"
                  >
                    <Text className="text-white text-center font-medium">
                      Save Address
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Pickup Info */}
        {deliveryType === "pickup" && (
          <View className="bg-[#1A1A2E] rounded-xl p-4 mb-6 border border-[#2A2A3E]">
            <View className="flex-row items-center">
              <Ionicons name="storefront" size={24} color="#8B5CF6" />
              <View className="ml-3">
                <Text className="text-white font-semibold">{merchant.name}</Text>
                <Text className="text-gray-400 text-sm">{merchant.address}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Contact Info */}
        <View className="mb-6">
          <Text className="text-white font-semibold text-lg mb-3">
            Contact Information
          </Text>
          <TextInput
            className="bg-[#1A1A2E] border border-[#2A2A3E] rounded-xl px-4 py-3 text-white"
            placeholder="Phone Number *"
            placeholderTextColor="#6B7280"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Tip Selection */}
        <View className="mb-6">
          <Text className="text-white font-semibold text-lg mb-3">Add a Tip</Text>
          <View className="flex-row mb-3">
            {TIP_OPTIONS.map((tipAmount) => (
              <Pressable
                key={tipAmount}
                onPress={() => {
                  setSelectedTip(tipAmount);
                  setCustomTip("");
                }}
                className={`flex-1 py-3 rounded-lg mr-2 ${
                  selectedTip === tipAmount && !customTip
                    ? "bg-[#8B5CF6]"
                    : "bg-[#1A1A2E] border border-[#2A2A3E]"
                }`}
              >
                <Text
                  className={`text-center font-medium ${
                    selectedTip === tipAmount && !customTip
                      ? "text-white"
                      : "text-gray-400"
                  }`}
                >
                  {tipAmount === 0 ? "No tip" : `$${tipAmount}`}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            className="bg-[#1A1A2E] border border-[#2A2A3E] rounded-xl px-4 py-3 text-white"
            placeholder="Custom tip amount"
            placeholderTextColor="#6B7280"
            value={customTip}
            onChangeText={(text) => {
              setCustomTip(text);
              if (text) setSelectedTip(0);
            }}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Order Notes */}
        <View className="mb-6">
          <Text className="text-white font-semibold text-lg mb-3">
            Order Notes
          </Text>
          <TextInput
            className="bg-[#1A1A2E] border border-[#2A2A3E] rounded-xl px-4 py-3 text-white"
            placeholder="Special instructions for the restaurant..."
            placeholderTextColor="#6B7280"
            value={notes}
            onChangeText={setNotes}
            multiline
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />
        </View>

        {/* Order Summary */}
        <View className="bg-[#1A1A2E] rounded-xl p-4 border border-[#2A2A3E]">
          <Text className="text-white font-semibold text-lg mb-4">
            Order Summary
          </Text>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-400">Subtotal</Text>
            <Text className="text-white">${subtotal.toFixed(2)}</Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-400">Tax (8.75%)</Text>
            <Text className="text-white">${tax.toFixed(2)}</Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-400">Delivery Fee</Text>
            <Text className="text-white">
              {deliveryFee === 0 ? "Free" : `$${deliveryFee.toFixed(2)}`}
            </Text>
          </View>

          <View className="flex-row justify-between mb-4">
            <Text className="text-gray-400">Tip</Text>
            <Text className="text-white">${tip.toFixed(2)}</Text>
          </View>

          <View className="border-t border-[#2A2A3E] pt-4 flex-row justify-between">
            <Text className="text-white font-bold text-lg">Total</Text>
            <Text className="text-[#8B5CF6] font-bold text-lg">
              ${total.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-[#1A1A2E] border-t border-[#2A2A3E] px-4 py-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Pressable
          onPress={handlePlaceOrder}
          disabled={!canCheckout || isProcessing}
          className={`rounded-xl py-4 px-6 flex-row items-center justify-center ${
            canCheckout && !isProcessing ? "bg-[#8B5CF6]" : "bg-gray-600"
          }`}
        >
          {isProcessing ? (
            <Text className="text-white font-semibold text-base">
              Processing...
            </Text>
          ) : (
            <>
              <Ionicons name="card-outline" size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold text-base ml-2 mr-2">
                Place Order
              </Text>
              <Text className="text-white font-bold text-base">
                ${total.toFixed(2)}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};
