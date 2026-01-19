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
import { LinearGradient } from "expo-linear-gradient";
import { PageContainer } from "../components/PageContainer";
import { Platform } from "react-native";

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
        <PageContainer>
          <View className="flex-row items-center px-6 py-4 border-b border-white/5">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10 mr-3"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </Pressable>
            <Text className="text-white text-xl font-black italic tracking-tight uppercase">My Bag</Text>
          </View>

          <View className="flex-1 items-center justify-center px-6 max-w-[400px] self-center py-20">
            <View className="w-24 h-24 bg-white/5 rounded-full items-center justify-center mb-6">
              <Ionicons name="bag-outline" size={40} color="#4B5563" />
            </View>
            <Text className="text-white text-2xl font-black mb-2 italic">YOUR BAG IS EMPTY</Text>
            <Text className="text-gray-500 text-center font-bold text-sm tracking-wide">
              Time to fill it with some official gear from your favorite streamers.
            </Text>
            <Pressable
              onPress={() => navigation.goBack()}
              className="mt-8 overflow-hidden rounded-2xl w-full"
            >
              <LinearGradient
                colors={["#8B5CF6", "#D946EF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 items-center"
              >
                <Text className="text-white font-black uppercase tracking-widest text-sm">EXPLORE THE STORE</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </PageContainer>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      <PageContainer>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-white/5">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10 mr-3"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </Pressable>
            <Text className="text-white text-xl font-black italic tracking-tight uppercase">My Bag</Text>
          </View>
          <Pressable onPress={clearCart}>
            <Text className="text-red-500 text-[10px] font-black uppercase tracking-widest">Clear Bag</Text>
          </Pressable>
        </View>
      </PageContainer>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <PageContainer>
          <View className="p-6">
            {cart.map((item) => (
              <View
                key={item.id}
                className="bg-white/5 rounded-3xl border border-white/10 p-5 mb-5 shadow-2xl shadow-black/60"
              >
                <View className="flex-row">
                  {item.productImage && (
                    <Image
                      source={{ uri: item.productImage }}
                      style={{ width: 100, height: 100, borderRadius: 16 }}
                      contentFit="cover"
                    />
                  )}
                  <View className="flex-1 ml-5">
                    <Text className="text-purple-500 text-[10px] font-black uppercase tracking-widest mb-1">{item.streamerName}</Text>
                    <Text className="text-white font-bold text-lg leading-tight mb-1" numberOfLines={2}>
                      {item.productTitle}
                    </Text>
                    <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest">{item.variantTitle}</Text>
                    <Text className="text-green-400 font-black text-xl mt-1">
                      ${item.unitPrice.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Quantity Controls */}
                <View className="flex-row items-center justify-between mt-5 pt-5 border-t border-white/5">
                  <View className="flex-row items-center bg-black/20 p-1 rounded-2xl border border-white/5">
                    <Pressable
                      onPress={() => updateCartItem(item.id, item.quantity - 1)}
                      className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/10"
                    >
                      <Ionicons name="remove" size={16} color="white" />
                    </Pressable>
                    <Text className="text-white font-black text-lg mx-5">{item.quantity}</Text>
                    <Pressable
                      onPress={() => updateCartItem(item.id, item.quantity + 1)}
                      className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/10"
                    >
                      <Ionicons name="add" size={16} color="white" />
                    </Pressable>
                  </View>

                  <View className="flex-row items-center">
                    <View className="items-end mr-4">
                      <Text className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-0.5">Line Total</Text>
                      <Text className="text-white font-black text-lg leading-none">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => removeFromCart(item.id)}
                      className="w-10 h-10 rounded-xl bg-red-500/10 items-center justify-center border border-red-500/20"
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </PageContainer>
      </ScrollView>

      {/* Bottom Summary */}
      <View className="bg-black/90 border-t border-white/10 items-center">
        <PageContainer>
          <View className="px-6 py-6 w-full max-w-[800px]">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Estimated Total</Text>
                <Text className="text-white text-3xl font-black tracking-tight">${subtotal.toFixed(2)}</Text>
              </View>
              <Text className="text-gray-500 text-[10px] font-bold uppercase text-right w-24">Shipping & tax calculated next</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate("MerchCheckout")}
              className="overflow-hidden rounded-2xl"
            >
              <LinearGradient
                colors={["#8B5CF6", "#D946EF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-5 items-center"
              >
                <Text className="text-white font-black uppercase tracking-widest text-sm">PROCEED TO SECURE CHECKOUT</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </PageContainer>
      </View>
    </SafeAreaView>
  );
};
