import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { PageContainer } from "../components/PageContainer";
import { useMerchantStore } from "../state/merchantStore";
import type { CartItem } from "../types/merchant";
import type { RootStackParamList } from "../navigation/RootNavigator";

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  onUpdateNotes: (notes: string) => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  onUpdateNotes,
}) => {
  const [showNotes, setShowNotes] = useState(!!item.notes);

  return (
    <View className="bg-[#1A1A2E] rounded-xl overflow-hidden mb-3 border border-[#2A2A3E]">
      <View className="flex-row p-3">
        {item.itemImageUrl && (
          <Image
            source={{ uri: item.itemImageUrl }}
            style={{ width: 80, height: 80, borderRadius: 8 }}
            contentFit="cover"
            transition={200}
          />
        )}
        <View className="flex-1 ml-3">
          <Text className="text-white font-semibold text-base" numberOfLines={2}>
            {item.itemName}
          </Text>

          {/* Selected Options */}
          {item.selectedOptions.length > 0 && (
            <View className="mt-1">
              {item.selectedOptions.map((opt, index) => (
                <Text key={index} className="text-gray-400 text-sm">
                  {opt.choiceName}
                  {opt.priceDelta !== 0 && (
                    <Text className="text-gray-500">
                      {" "}
                      ({opt.priceDelta > 0 ? "+" : ""}${opt.priceDelta.toFixed(2)})
                    </Text>
                  )}
                </Text>
              ))}
            </View>
          )}

          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-[#8B5CF6] font-bold">
              ${item.lineTotal.toFixed(2)}
            </Text>

            {/* Quantity Controls */}
            <View className="flex-row items-center bg-[#2A2A3E] rounded-lg">
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  if (item.quantity === 1) {
                    onRemove();
                  } else {
                    onUpdateQuantity(item.quantity - 1);
                  }
                }}
                className="p-2"
              >
                <Ionicons
                  name={item.quantity === 1 ? "trash-outline" : "remove"}
                  size={18}
                  color={item.quantity === 1 ? "#EF4444" : "#FFFFFF"}
                />
              </Pressable>
              <Text className="text-white font-bold text-base w-8 text-center">
                {item.quantity}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  onUpdateQuantity(item.quantity + 1);
                }}
                className="p-2"
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Notes Section */}
      <Pressable
        onPress={() => setShowNotes(!showNotes)}
        className="flex-row items-center px-3 py-2 border-t border-[#2A2A3E]"
      >
        <Ionicons
          name={showNotes ? "chevron-up" : "chevron-down"}
          size={16}
          color="#9CA3AF"
        />
        <Text className="text-gray-400 text-sm ml-2">
          {item.notes ? "Edit notes" : "Add notes"}
        </Text>
      </Pressable>

      {showNotes && (
        <View className="px-3 pb-3">
          <TextInput
            className="bg-[#2A2A3E] rounded-lg px-3 py-2 text-white text-sm"
            placeholder="Special instructions..."
            placeholderTextColor="#6B7280"
            value={item.notes || ""}
            onChangeText={onUpdateNotes}
            multiline
          />
        </View>
      )}
    </View>
  );
};

export const CartScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const cart = useMerchantStore((s) => s.cart);
  const getMerchant = useMerchantStore((s) => s.getMerchant);
  const updateCartItem = useMerchantStore((s) => s.updateCartItem);
  const removeFromCart = useMerchantStore((s) => s.removeFromCart);
  const clearCart = useMerchantStore((s) => s.clearCart);
  const getCartTotal = useMerchantStore((s) => s.getCartTotal);

  const merchant = cart ? getMerchant(cart.merchantId) : null;
  const { subtotal, itemCount } = getCartTotal();

  // Calculate totals
  const tax = subtotal * 0.0875; // 8.75% tax
  const deliveryFee = merchant?.deliveryFee || 0;
  const total = subtotal + tax + deliveryFee;

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) return;

    // Check minimum order amount
    if (merchant?.minOrderAmount && subtotal < merchant.minOrderAmount) {
      // Show error (you could use a modal here)
      return;
    }

    navigation.navigate("Checkout");
  };

  if (!cart || cart.items.length === 0) {
    return (
      <View className="flex-1 bg-[#0A0A0F]">
        <PageContainer>
          {/* Header */}
          <View
            className="flex-row items-center px-4 py-4 border-b border-[#1F1F2E]"
            style={{ paddingTop: insets.top + 12 }}
          >
            <Pressable onPress={() => navigation.goBack()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <Text className="text-white text-xl font-bold">Cart</Text>
          </View>

          {/* Empty State */}
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="cart-outline" size={80} color="#4B5563" />
            <Text className="text-white text-xl font-bold mt-6">
              Your cart is empty
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Start adding items from your favorite merchants
            </Text>
            <Pressable
              onPress={() => navigation.navigate("MerchantList")}
              className="bg-[#8B5CF6] rounded-xl py-4 px-8 mt-8"
            >
              <Text className="text-white font-semibold">Browse Merchants</Text>
            </Pressable>
          </View>
        </PageContainer>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <PageContainer>
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-4 py-4 border-b border-[#1F1F2E]"
          style={{ paddingTop: insets.top + 12 }}
        >
          <View className="flex-row items-center">
            <Pressable onPress={() => navigation.goBack()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <View>
              <Text className="text-white text-xl font-bold">Cart</Text>
              <Text className="text-gray-400 text-sm">{cart.merchantName}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              clearCart();
            }}
            className="p-2"
          >
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Merchant Info */}
          <Pressable
            onPress={() =>
              navigation.navigate("MerchantDetail", { merchantId: cart.merchantId })
            }
            className="flex-row items-center bg-[#1A1A2E] rounded-xl p-3 mb-4 border border-[#2A2A3E]"
          >
            {merchant?.logoUrl && (
              <Image
                source={{ uri: merchant.logoUrl }}
                style={{ width: 48, height: 48, borderRadius: 12 }}
                contentFit="cover"
                transition={200}
              />
            )}
            <View className="flex-1 ml-3">
              <Text className="text-white font-semibold">{cart.merchantName}</Text>
              <Text className="text-gray-400 text-sm">
                {merchant?.deliveryTime} • {itemCount} item{itemCount !== 1 ? "s" : ""}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>

          {/* Cart Items */}
          <Text className="text-white font-semibold text-lg mb-3">Your Items</Text>
          {cart.items.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onUpdateQuantity={(qty) => updateCartItem(item.id, qty)}
              onRemove={() => removeFromCart(item.id)}
              onUpdateNotes={(notes) => updateCartItem(item.id, undefined, notes)}
            />
          ))}

          {/* Add More Items */}
          <Pressable
            onPress={() =>
              navigation.navigate("MerchantDetail", { merchantId: cart.merchantId })
            }
            className="flex-row items-center justify-center py-4 border border-dashed border-[#3A3A4E] rounded-xl mt-2"
          >
            <Ionicons name="add-circle-outline" size={20} color="#8B5CF6" />
            <Text className="text-[#8B5CF6] font-medium ml-2">Add more items</Text>
          </Pressable>

          {/* Order Summary */}
          <View className="mt-6 bg-[#1A1A2E] rounded-xl p-4 border border-[#2A2A3E]">
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

            <View className="flex-row justify-between mb-4">
              <Text className="text-gray-400">Delivery Fee</Text>
              <Text className="text-white">
                {deliveryFee === 0 ? "Free" : `$${deliveryFee.toFixed(2)}`}
              </Text>
            </View>

            <View className="border-t border-[#2A2A3E] pt-4 flex-row justify-between">
              <Text className="text-white font-bold text-lg">Total</Text>
              <Text className="text-[#8B5CF6] font-bold text-lg">
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Min Order Warning */}
          {merchant?.minOrderAmount && subtotal < merchant.minOrderAmount && (
            <View className="mt-4 bg-yellow-500/20 rounded-xl p-4 flex-row items-center">
              <Ionicons name="warning" size={20} color="#FBBF24" />
              <Text className="text-yellow-400 ml-3 flex-1">
                Add ${(merchant.minOrderAmount - subtotal).toFixed(2)} more to meet
                the minimum order of ${merchant.minOrderAmount.toFixed(2)}
              </Text>
            </View>
          )}
        </ScrollView>
      </PageContainer>

      {/* Checkout Button */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-[#1A1A2E] border-t border-[#2A2A3E] items-center"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <View className="px-4 py-3 w-full max-w-[800px]">
          <Pressable
            onPress={handleCheckout}
            disabled={
              merchant?.minOrderAmount ? subtotal < merchant.minOrderAmount : false
            }
            className={`rounded-xl py-4 px-6 flex-row items-center justify-center ${merchant?.minOrderAmount && subtotal < merchant.minOrderAmount
              ? "bg-gray-600"
              : "bg-[#8B5CF6]"
              }`}
          >
            <Text className="text-white font-semibold text-base mr-2">
              Proceed to Checkout
            </Text>
            <Text className="text-white font-bold text-base">
              ${total.toFixed(2)}
            </Text>
          </Pressable>
        </View>
      </View>
    </View >
  );
};
