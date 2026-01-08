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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useMerchStore } from "../state/merchStore";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const MerchCartScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const cart = useMerchStore((s) => s.cart);
  const updateCartItem = useMerchStore((s) => s.updateCartItem);
  const removeFromCart = useMerchStore((s) => s.removeFromCart);
  const clearCart = useMerchStore((s) => s.clearCart);
  const getCartTotal = useMerchStore((s) => s.getCartTotal);

  const { subtotal, itemCount } = getCartTotal();

  if (cart.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
        <View className="flex-row items-center px-6 py-4 border-b border-gray-800">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-bold">My Cart</Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="bag-outline" size={80} color="#4B5563" />
          <Text className="text-white text-xl font-bold mt-4">Your cart is empty</Text>
          <Text className="text-gray-400 text-center mt-2">
            Browse merch from your favorite streamers and add items to your cart
          </Text>
          <Pressable
            onPress={() => navigation.goBack()}
            className="bg-purple-600 px-8 py-4 rounded-xl mt-6"
          >
            <Text className="text-white font-bold">Browse Merch</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-800">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-bold">My Cart</Text>
        </View>
        <Pressable onPress={clearCart}>
          <Text className="text-red-400 font-semibold">Clear All</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {cart.map((item) => (
            <View
              key={item.id}
              className="bg-[#151520] rounded-xl border border-gray-800 p-4 mb-4"
            >
              <View className="flex-row">
                {item.productImage && (
                  <Image
                    source={{ uri: item.productImage }}
                    style={{ width: 80, height: 80, borderRadius: 8 }}
                    contentFit="cover"
                  />
                )}
                <View className="flex-1 ml-4">
                  <Text className="text-gray-400 text-xs">{item.streamerName}</Text>
                  <Text className="text-white font-semibold" numberOfLines={2}>
                    {item.productTitle}
                  </Text>
                  <Text className="text-gray-500 text-sm">{item.variantTitle}</Text>
                  <Text className="text-green-400 font-bold mt-1">
                    ${item.unitPrice.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Quantity Controls */}
              <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-gray-800">
                <View className="flex-row items-center">
                  <Pressable
                    onPress={() => updateCartItem(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-gray-700 items-center justify-center"
                  >
                    <Ionicons name="remove" size={16} color="white" />
                  </Pressable>
                  <Text className="text-white font-bold mx-4">{item.quantity}</Text>
                  <Pressable
                    onPress={() => updateCartItem(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-gray-700 items-center justify-center"
                  >
                    <Ionicons name="add" size={16} color="white" />
                  </Pressable>
                </View>

                <View className="flex-row items-center">
                  <Text className="text-white font-bold mr-4">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </Text>
                  <Pressable
                    onPress={() => removeFromCart(item.id)}
                    className="w-8 h-8 rounded-lg bg-red-600/20 items-center justify-center"
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Summary */}
      <View className="bg-[#151520] border-t border-gray-800 px-6 py-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-400">Subtotal ({itemCount} items)</Text>
          <Text className="text-white font-bold">${subtotal.toFixed(2)}</Text>
        </View>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-gray-500 text-sm">Shipping calculated at checkout</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate("MerchCheckout")}
          className="bg-purple-600 py-4 rounded-xl"
        >
          <Text className="text-white text-center font-bold">
            Proceed to Checkout
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};
