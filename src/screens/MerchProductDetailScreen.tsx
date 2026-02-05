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
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { PageContainer } from "../components/PageContainer";
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
      <PageContainer>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("MerchCart")}
            className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10"
          >
            <Ionicons name="bag-outline" size={20} color="white" />
            {itemCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-purple-600 w-5 h-5 rounded-full items-center justify-center border-2 border-[#0A0A0F]">
                <Text className="text-white text-[10px] font-black">{itemCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </PageContainer>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <PageContainer>
          {/* Image Gallery */}
          <View className="bg-[#151520] border-b border-white/5">
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
                <View key={index} style={{ width: SCREEN_WIDTH, height: 400 }}>
                  <Image
                    source={{ uri: image }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="contain"
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(10,10,15,0.2)"]}
                    className="absolute inset-0"
                  />
                </View>
              ))}
            </ScrollView>

            {/* Image Indicators */}
            {product.images.length > 1 && (
              <View className="flex-row justify-center absolute bottom-4 left-0 right-0">
                {product.images.map((_, index) => (
                  <View
                    key={index}
                    className={`h-1 rounded-full mx-1 ${index === currentImageIndex ? "w-6 bg-purple-500" : "w-2 bg-white/20"
                      }`}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Product Info */}
          <View className="px-6 pt-8 pb-32">
            {/* Streamer & Title */}
            <Pressable
              onPress={() => {
                // Only navigate if it's a real streamer ID (not admin or direct-sell)
                if (product.streamerId && !product.streamerId.startsWith("admin") && !product.printifyProductId?.startsWith("direct-")) {
                  navigation.navigate("StreamerProfile", { streamerId: product.streamerId });
                }
              }}
              className="flex-row items-center mb-3 bg-purple-500/10 self-start px-3 py-1.5 rounded-full border border-purple-500/20"
            >
              <Text className="text-purple-400 text-xs font-black tracking-widest uppercase">
                {product.streamerName}
              </Text>
              {product.streamerId && !product.streamerId.startsWith("admin") && !product.printifyProductId?.startsWith("direct-") && (
                <Ionicons name="chevron-forward" size={12} color="#A855F7" style={{ marginLeft: 4 }} />
              )}
            </Pressable>

            <Text className="text-white text-3xl font-black mb-3 italic tracking-tight">{product.title}</Text>

            {/* Price */}
            <View className="flex-row items-baseline mb-6">
              <Text className="text-green-400 text-3xl font-black">
                ${finalPrice.toFixed(2)}
              </Text>
              {selectedVariant?.additionalPrice ? (
                <Text className="text-gray-500 text-sm ml-3 font-bold uppercase tracking-widest">
                  (+${selectedVariant.additionalPrice} Option)
                </Text>
              ) : null}
            </View>

            {/* Glass Container for details */}
            <View className="bg-white/5 p-6 rounded-3xl border border-white/10 mb-8">
              <Text className="text-gray-300 leading-relaxed text-base">{product.description}</Text>

              {/* Tags */}
              {product.tags.length > 0 && (
                <View className="flex-row flex-wrap mt-6">
                  {product.tags.map((tag) => (
                    <View
                      key={tag}
                      className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg mr-2 mb-2"
                    >
                      <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Size Selection */}
            {sizes.length > 0 && (
              <View className="mb-8">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white font-black uppercase tracking-widest text-xs">Select Size</Text>
                  <Text className="text-gray-500 text-[10px] font-bold">SIZE CHART</Text>
                </View>
                <View className="flex-row flex-wrap">
                  {sizes.map((size) => {
                    const isSelected = selectedSize === size;
                    const variant = findVariant(size, selectedColor);
                    const isAvailable = variant?.isAvailable;

                    return (
                      <Pressable
                        key={size}
                        onPress={() => isAvailable && handleSizeSelect(size!)}
                        className="mr-3 mb-3"
                        disabled={!isAvailable}
                      >
                        {isSelected ? (
                          <LinearGradient
                            colors={["#8B5CF6", "#6D28D9"]}
                            className="px-6 py-3 rounded-2xl"
                          >
                            <Text className="text-white font-black text-sm">{size}</Text>
                          </LinearGradient>
                        ) : (
                          <View className={`px-6 py-3 rounded-2xl border ${isAvailable ? "bg-white/5 border-white/10" : "bg-transparent border-white/5 opacity-50"}`}>
                            <Text className={`font-black text-sm ${isAvailable ? "text-gray-300" : "text-gray-600"}`}>
                              {size}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Color Selection */}
            {colors.length > 0 && (
              <View className="mb-8">
                <Text className="text-white font-black uppercase tracking-widest text-xs mb-4">Select Color</Text>
                <View className="flex-row flex-wrap">
                  {colors.map((color) => {
                    const isSelected = selectedColor === color;
                    const variant = findVariant(selectedSize, color);
                    const isAvailable = variant?.isAvailable;

                    return (
                      <Pressable
                        key={color}
                        onPress={() => isAvailable && handleColorSelect(color!)}
                        className="mr-3 mb-3"
                        disabled={!isAvailable}
                      >
                        {isSelected ? (
                          <LinearGradient
                            colors={["#8B5CF6", "#6D28D9"]}
                            className="px-5 py-3 rounded-2xl"
                          >
                            <Text className="text-white font-bold text-sm">{color}</Text>
                          </LinearGradient>
                        ) : (
                          <View className={`px-5 py-3 rounded-2xl border ${isAvailable ? "bg-white/5 border-white/10" : "bg-transparent border-white/5 opacity-50"}`}>
                            <Text className={`font-bold text-sm ${isAvailable ? "text-gray-300" : "text-gray-600"}`}>
                              {color}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Quantity */}
            <View className="mb-8 p-6 bg-white/5 rounded-3xl border border-white/10">
              <Text className="text-white font-black uppercase tracking-widest text-xs mb-4">Quantity</Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Pressable
                    onPress={decrementQuantity}
                    className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 items-center justify-center"
                  >
                    <Ionicons name="remove" size={20} color="white" />
                  </Pressable>
                  <Text className="text-white text-2xl font-black mx-8">{quantity}</Text>
                  <Pressable
                    onPress={incrementQuantity}
                    className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 items-center justify-center"
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </Pressable>
                </View>

                {selectedVariant && (
                  <View className="flex-row items-center">
                    <View
                      className={`w-2 h-2 rounded-full mr-2 ${selectedVariant.stockStatus === "in_stock"
                        ? "bg-green-500"
                        : selectedVariant.stockStatus === "low_stock"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                        }`}
                    />
                    <Text
                      className={`text-[10px] font-black uppercase tracking-tighter ${selectedVariant.stockStatus === "in_stock"
                        ? "text-green-500"
                        : selectedVariant.stockStatus === "low_stock"
                          ? "text-yellow-500"
                          : "text-red-500"
                        }`}
                    >
                      {selectedVariant.stockStatus.replace('_', ' ')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </PageContainer>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-black/80 border-t border-white/10 items-center">
        <PageContainer>
          <View className="px-6 py-6 w-full max-w-[800px] flex-row items-center justify-between">
            <View>
              <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Price</Text>
              <Text className="text-white text-2xl font-black tracking-tight">${totalPrice.toFixed(2)}</Text>
            </View>
            <Pressable
              onPress={handleAddToCart}
              disabled={!selectedVariant?.isAvailable}
              className="overflow-hidden rounded-2xl"
            >
              <LinearGradient
                colors={addedToCart ? ["#059669", "#10B981"] : ["#8B5CF6", "#D946EF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="px-10 py-4 flex-row items-center justify-center"
              >
                <Ionicons
                  name={addedToCart ? "checkmark-circle" : "bag-add"}
                  size={20}
                  color="white"
                />
                <Text className="text-white font-black uppercase tracking-widest ml-3 text-sm">
                  {addedToCart ? "YAY!" : "GET IT"}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </PageContainer>
      </View>
    </SafeAreaView>
  );
};
