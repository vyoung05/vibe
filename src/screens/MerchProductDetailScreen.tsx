import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useMerchStore } from "../state/merchStore";
import type { MerchVariant } from "../types/printify";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type MerchProductDetailRouteProp = RouteProp<RootStackParamList, "MerchProductDetail">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const MerchProductDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<MerchProductDetailRouteProp>();
  const productId = route.params?.productId;

  const getProduct = useMerchStore((s) => s.getProduct);
  const addToCart = useMerchStore((s) => s.addToCart);
  const getCartTotal = useMerchStore((s) => s.getCartTotal);

  const product = getProduct(productId || "");
  const { itemCount } = getCartTotal();

  const [selectedVariant, setSelectedVariant] = useState<MerchVariant | null>(
    product?.variants[0] || null
  );
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  // Group variants by attribute
  const sizes = product ? [...new Set(product.variants.filter((v) => v.size).map((v) => v.size))] : [];
  const colors = product ? [...new Set(product.variants.filter((v) => v.color).map((v) => v.color))] : [];

  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product?.variants[0]?.size
  );
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product?.variants[0]?.color
  );

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0F] items-center justify-center">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-white text-xl font-bold mt-4">Product Not Found</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          className="bg-purple-600 px-6 py-3 rounded-xl mt-6"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const finalPrice = product.finalPrice + (selectedVariant?.additionalPrice || 0);
  const totalPrice = finalPrice * quantity;

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    addToCart(product, selectedVariant, quantity);
    setAddedToCart(true);

    setTimeout(() => setAddedToCart(false), 2000);
  };

  const incrementQuantity = () => setQuantity((q) => Math.min(q + 1, 10));
  const decrementQuantity = () => setQuantity((q) => Math.max(q - 1, 1));

  // Find matching variant when size/color changes
  const findVariant = (size?: string, color?: string) => {
    return product.variants.find((v) => {
      if (size && v.size !== size) return false;
      if (color && v.color !== color) return false;
      return true;
    });
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    const variant = findVariant(size, selectedColor);
    if (variant) setSelectedVariant(variant);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    const variant = findVariant(selectedSize, color);
    if (variant) setSelectedVariant(variant);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate("MerchCart")}
          className="relative"
        >
          <Ionicons name="bag-outline" size={24} color="white" />
          {itemCount > 0 && (
            <View className="absolute -top-2 -right-2 bg-purple-600 w-5 h-5 rounded-full items-center justify-center">
              <Text className="text-white text-xs font-bold">{itemCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {product.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                contentFit="cover"
              />
            ))}
          </ScrollView>

          {/* Image Indicators */}
          {product.images.length > 1 && (
            <View className="flex-row justify-center mt-3">
              {product.images.map((_, index) => (
                <View
                  key={index}
                  className={`w-2 h-2 rounded-full mx-1 ${
                    index === currentImageIndex ? "bg-purple-500" : "bg-gray-600"
                  }`}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Info */}
        <View className="px-6 pt-6 pb-32">
          {/* Streamer & Title */}
          <Pressable
            onPress={() => navigation.navigate("StreamerProfile", { streamerId: product.streamerId })}
            className="flex-row items-center mb-2"
          >
            <Text className="text-purple-400 text-sm font-semibold">
              {product.streamerName}
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#A855F7" />
          </Pressable>

          <Text className="text-white text-2xl font-bold mb-2">{product.title}</Text>

          {/* Price */}
          <View className="flex-row items-baseline mb-4">
            <Text className="text-green-400 text-3xl font-bold">
              ${finalPrice.toFixed(2)}
            </Text>
            {selectedVariant?.additionalPrice ? (
              <Text className="text-gray-500 text-sm ml-2">
                (base ${product.finalPrice.toFixed(2)})
              </Text>
            ) : null}
          </View>

          {/* Tags */}
          {product.tags.length > 0 && (
            <View className="flex-row flex-wrap mb-4">
              {product.tags.map((tag) => (
                <View
                  key={tag}
                  className="bg-gray-800 px-3 py-1 rounded-full mr-2 mb-2"
                >
                  <Text className="text-gray-400 text-xs">{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          <Text className="text-gray-400 mb-6">{product.description}</Text>

          {/* Size Selection */}
          {sizes.length > 0 && (
            <View className="mb-6">
              <Text className="text-white font-bold mb-3">Size</Text>
              <View className="flex-row flex-wrap">
                {sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  const variant = findVariant(size, selectedColor);
                  const isAvailable = variant?.isAvailable;

                  return (
                    <Pressable
                      key={size}
                      onPress={() => isAvailable && handleSizeSelect(size!)}
                      className={`px-4 py-3 rounded-xl mr-2 mb-2 border ${
                        isSelected
                          ? "bg-purple-600 border-purple-600"
                          : isAvailable
                          ? "bg-[#151520] border-gray-700"
                          : "bg-gray-900 border-gray-800 opacity-50"
                      }`}
                      disabled={!isAvailable}
                    >
                      <Text
                        className={`font-semibold ${
                          isSelected ? "text-white" : isAvailable ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {size}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Color Selection */}
          {colors.length > 0 && (
            <View className="mb-6">
              <Text className="text-white font-bold mb-3">Color</Text>
              <View className="flex-row flex-wrap">
                {colors.map((color) => {
                  const isSelected = selectedColor === color;
                  const variant = findVariant(selectedSize, color);
                  const isAvailable = variant?.isAvailable;

                  return (
                    <Pressable
                      key={color}
                      onPress={() => isAvailable && handleColorSelect(color!)}
                      className={`px-4 py-3 rounded-xl mr-2 mb-2 border ${
                        isSelected
                          ? "bg-purple-600 border-purple-600"
                          : isAvailable
                          ? "bg-[#151520] border-gray-700"
                          : "bg-gray-900 border-gray-800 opacity-50"
                      }`}
                      disabled={!isAvailable}
                    >
                      <Text
                        className={`font-semibold ${
                          isSelected ? "text-white" : isAvailable ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {color}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Quantity */}
          <View className="mb-6">
            <Text className="text-white font-bold mb-3">Quantity</Text>
            <View className="flex-row items-center">
              <Pressable
                onPress={decrementQuantity}
                className="w-12 h-12 rounded-xl bg-[#151520] border border-gray-700 items-center justify-center"
              >
                <Ionicons name="remove" size={20} color="white" />
              </Pressable>
              <Text className="text-white text-xl font-bold mx-6">{quantity}</Text>
              <Pressable
                onPress={incrementQuantity}
                className="w-12 h-12 rounded-xl bg-[#151520] border border-gray-700 items-center justify-center"
              >
                <Ionicons name="add" size={20} color="white" />
              </Pressable>
            </View>
          </View>

          {/* Stock Status */}
          {selectedVariant && (
            <View className="flex-row items-center mb-6">
              <View
                className={`w-3 h-3 rounded-full mr-2 ${
                  selectedVariant.stockStatus === "in_stock"
                    ? "bg-green-500"
                    : selectedVariant.stockStatus === "low_stock"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              />
              <Text
                className={
                  selectedVariant.stockStatus === "in_stock"
                    ? "text-green-400"
                    : selectedVariant.stockStatus === "low_stock"
                    ? "text-yellow-400"
                    : "text-red-400"
                }
              >
                {selectedVariant.stockStatus === "in_stock"
                  ? "In Stock"
                  : selectedVariant.stockStatus === "low_stock"
                  ? "Low Stock - Order Soon"
                  : "Out of Stock"}
              </Text>
            </View>
          )}

          {/* Stats */}
          <View className="flex-row items-center">
            <Ionicons name="cart-outline" size={16} color="#6B7280" />
            <Text className="text-gray-500 text-sm ml-1">
              {product.unitsSold} sold
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-[#0A0A0F] border-t border-gray-800 px-6 py-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-gray-400">Total</Text>
          <Text className="text-white text-2xl font-bold">${totalPrice.toFixed(2)}</Text>
        </View>
        <Pressable
          onPress={handleAddToCart}
          disabled={!selectedVariant?.isAvailable}
          className={`py-4 rounded-xl flex-row items-center justify-center ${
            addedToCart
              ? "bg-green-600"
              : selectedVariant?.isAvailable
              ? "bg-purple-600"
              : "bg-gray-700"
          }`}
        >
          <Ionicons
            name={addedToCart ? "checkmark-circle" : "bag-add"}
            size={20}
            color="white"
          />
          <Text className="text-white font-bold ml-2">
            {addedToCart
              ? "Added to Cart!"
              : selectedVariant?.isAvailable
              ? "Add to Cart"
              : "Out of Stock"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};
