import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useMerchantStore } from "../state/merchantStore";
import type { MerchantItem } from "../types/merchant";
import type { RootStackParamList } from "../navigation/RootNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HEADER_HEIGHT = 200;
const PRODUCT_CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 columns with padding

interface ProductCardProps {
  item: MerchantItem;
  onPress: () => void;
}

// Product Grid Card (for products like shirts, hats)
const ProductCard: React.FC<ProductCardProps> = ({ item, onPress }) => {
  const hasMultipleImages = (item.images?.length || 0) > 0;

  return (
    <Pressable
      onPress={onPress}
      className="bg-[#1A1A2E] rounded-xl overflow-hidden border border-[#2A2A3E] mb-3"
      style={{ width: PRODUCT_CARD_WIDTH }}
    >
      {/* Product Image */}
      <View className="relative" style={{ height: PRODUCT_CARD_WIDTH }}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="flex-1 bg-[#2A2A3E] items-center justify-center">
            <Ionicons name="image-outline" size={32} color="#6B7280" />
          </View>
        )}

        {/* Multiple images indicator */}
        {hasMultipleImages && (
          <View className="absolute top-2 right-2 bg-black/60 rounded-full px-2 py-1 flex-row items-center">
            <Ionicons name="images" size={12} color="#FFFFFF" />
            <Text className="text-white text-xs ml-1">{(item.images?.length || 0) + 1}</Text>
          </View>
        )}

        {/* Badges */}
        <View className="absolute bottom-2 left-2 flex-row">
          {item.isFeatured && (
            <View className="bg-[#8B5CF6] px-2 py-0.5 rounded mr-1">
              <Text className="text-white text-xs font-medium">Hot</Text>
            </View>
          )}
          {!item.isAvailable && (
            <View className="bg-red-500 px-2 py-0.5 rounded">
              <Text className="text-white text-xs font-medium">Sold Out</Text>
            </View>
          )}
        </View>
      </View>

      {/* Product Info */}
      <View className="p-3">
        <Text className="text-white font-semibold text-sm" numberOfLines={2}>
          {item.name}
        </Text>
        <Text className="text-[#8B5CF6] font-bold text-base mt-1">
          ${item.price.toFixed(2)}
        </Text>
        {item.optionGroups.length > 0 && (
          <Text className="text-gray-500 text-xs mt-1">
            {item.optionGroups.length} option{item.optionGroups.length > 1 ? "s" : ""}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

interface MenuItemCardProps {
  item: MerchantItem;
  onPress: () => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row bg-[#1A1A2E] rounded-xl overflow-hidden mb-3 border border-[#2A2A3E]"
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <View className="flex-1 p-3">
        <Text className="text-white font-semibold text-base" numberOfLines={1}>
          {item.name}
        </Text>
        {item.description && (
          <Text className="text-gray-400 text-sm mt-1" numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View className="flex-row items-center mt-2">
          <Text className="text-[#8B5CF6] font-bold text-base">
            ${item.price.toFixed(2)}
          </Text>
          {item.isFeatured && (
            <View className="bg-[#8B5CF6]/20 px-2 py-0.5 rounded ml-2">
              <Text className="text-[#8B5CF6] text-xs font-medium">Popular</Text>
            </View>
          )}
          {!item.isAvailable && (
            <View className="bg-red-500/20 px-2 py-0.5 rounded ml-2">
              <Text className="text-red-400 text-xs font-medium">Sold Out</Text>
            </View>
          )}
        </View>
      </View>
      {item.imageUrl && (
        <View className="w-24 h-24 m-2 relative">
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: "100%", height: "100%", borderRadius: 8 }}
            contentFit="cover"
            transition={200}
          />
          {/* Multiple images indicator */}
          {(item.images?.length || 0) > 0 && (
            <View className="absolute top-1 right-1 bg-black/60 rounded-full px-1.5 py-0.5">
              <Ionicons name="images" size={10} color="#FFFFFF" />
            </View>
          )}
          {item.isAvailable && (
            <View className="absolute bottom-1 right-1 bg-[#8B5CF6] rounded-full p-1">
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
};

export const MerchantDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "MerchantDetail">>();
  const { merchantId } = route.params;

  const getMerchant = useMerchantStore((s) => s.getMerchant);
  const getMerchantItems = useMerchantStore((s) => s.getMerchantItems);
  const getMerchantCategories = useMerchantStore((s) => s.getMerchantCategories);
  const cart = useMerchantStore((s) => s.cart);
  const getCartTotal = useMerchantStore((s) => s.getCartTotal);

  const merchant = getMerchant(merchantId);
  const items = getMerchantItems(merchantId);
  const categories = getMerchantCategories(merchantId);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categories[0] || null
  );

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT - 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  const { subtotal, itemCount } = getCartTotal();
  const showCartBar = cart && cart.merchantId === merchantId && itemCount > 0;

  const handleItemPress = useCallback(
    (item: MerchantItem) => {
      if (item.isAvailable) {
        navigation.navigate("ItemDetail", {
          itemId: item.id,
          merchantId: merchantId,
        });
      }
    },
    [navigation, merchantId]
  );

  if (!merchant) {
    return (
      <View className="flex-1 bg-[#0A0A0F] items-center justify-center">
        <Text className="text-white">Merchant not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      {/* Animated Header Background */}
      <Animated.View
        className="absolute top-0 left-0 right-0 z-10"
        style={{
          opacity: headerOpacity,
          paddingTop: insets.top,
          backgroundColor: "#0A0A0F",
          borderBottomWidth: 1,
          borderBottomColor: "#1F1F2E",
        }}
      >
        <View className="h-14 flex-row items-center justify-between px-4">
          <Text className="text-white font-bold text-lg" numberOfLines={1}>
            {merchant.name}
          </Text>
        </View>
      </Animated.View>

      {/* Back Button */}
      <View
        className="absolute z-20 left-4"
        style={{ top: insets.top + 8 }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          className="bg-black/50 rounded-full p-2"
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Cart Button */}
      <View
        className="absolute z-20 right-4"
        style={{ top: insets.top + 8 }}
      >
        <Pressable
          onPress={() => navigation.navigate("Cart")}
          className="bg-black/50 rounded-full p-2"
        >
          <Ionicons name="cart-outline" size={24} color="#FFFFFF" />
          {itemCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-[#8B5CF6] rounded-full w-5 h-5 items-center justify-center">
              <Text className="text-white text-xs font-bold">{itemCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <Animated.ScrollView
        className="flex-1"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: showCartBar ? 100 : 20 }}
      >
        {/* Banner */}
        <View style={{ height: HEADER_HEIGHT }}>
          <Image
            source={{ uri: merchant.bannerUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient
            colors={["transparent", "rgba(10,10,15,0.8)", "#0A0A0F"]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 100,
            }}
          />
        </View>

        {/* Merchant Info */}
        <View className="px-4 -mt-12">
          <View className="flex-row items-end">
            <Image
              source={{ uri: merchant.logoUrl }}
              style={{ width: 72, height: 72, borderRadius: 16 }}
              contentFit="cover"
              transition={200}
            />
            <View className="flex-1 ml-4 mb-1">
              <Text className="text-white text-2xl font-bold">
                {merchant.name}
              </Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text className="text-white text-sm ml-1">
                  {merchant.rating.toFixed(1)}
                </Text>
                <Text className="text-gray-500 text-sm ml-1">
                  ({merchant.reviewCount} reviews)
                </Text>
              </View>
            </View>
          </View>

          <Text className="text-gray-400 text-sm mt-3">
            {merchant.description}
          </Text>

          {/* Info Row */}
          <View className="flex-row items-center mt-4 flex-wrap">
            {merchant.deliveryTime && (
              <View className="flex-row items-center mr-4 mb-2">
                <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                <Text className="text-gray-400 text-sm ml-1">
                  {merchant.deliveryTime}
                </Text>
              </View>
            )}
            {merchant.supportsDelivery && merchant.deliveryFee !== undefined && (
              <View className="flex-row items-center mr-4 mb-2">
                <Ionicons name="bicycle-outline" size={16} color="#9CA3AF" />
                <Text className="text-gray-400 text-sm ml-1">
                  {merchant.deliveryFee === 0
                    ? "Free delivery"
                    : `$${merchant.deliveryFee.toFixed(2)} delivery`}
                </Text>
              </View>
            )}
            {merchant.minOrderAmount && (
              <View className="flex-row items-center mb-2">
                <Ionicons name="cash-outline" size={16} color="#9CA3AF" />
                <Text className="text-gray-400 text-sm ml-1">
                  Min. ${merchant.minOrderAmount.toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          {/* Status */}
          <View
            className={`self-start px-3 py-1 rounded-full mt-2 ${
              merchant.isOpen ? "bg-green-500/20" : "bg-red-500/20"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                merchant.isOpen ? "text-green-400" : "text-red-400"
              }`}
            >
              {merchant.isOpen ? "Open Now" : "Closed"}
            </Text>
          </View>
        </View>

        {/* Category Tabs */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-6"
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {categories.map((category) => (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedCategory === category
                    ? "bg-[#8B5CF6]"
                    : "bg-[#1A1A2E] border border-[#2A2A3E]"
                }`}
              >
                <Text
                  className={`font-medium ${
                    selectedCategory === category ? "text-white" : "text-gray-400"
                  }`}
                >
                  {category}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Menu Items */}
        <View className="px-4 mt-4">
          <Text className="text-white text-xl font-bold mb-4">
            {selectedCategory || "Menu"}
          </Text>
          {filteredItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onPress={() => handleItemPress(item)}
            />
          ))}
          {filteredItems.length === 0 && (
            <View className="items-center py-8">
              <Ionicons name="restaurant-outline" size={48} color="#4B5563" />
              <Text className="text-gray-500 mt-2">No items in this category</Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Cart Bar */}
      {showCartBar && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-[#1A1A2E] border-t border-[#2A2A3E] px-4 py-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Pressable
            onPress={() => navigation.navigate("Cart")}
            className="bg-[#8B5CF6] rounded-xl py-4 px-6 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="bg-white/20 rounded-full w-6 h-6 items-center justify-center">
                <Text className="text-white font-bold text-sm">{itemCount}</Text>
              </View>
              <Text className="text-white font-semibold text-base ml-3">
                View Cart
              </Text>
            </View>
            <Text className="text-white font-bold text-base">
              ${subtotal.toFixed(2)}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};
