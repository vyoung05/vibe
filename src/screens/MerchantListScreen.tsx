import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMerchantStore } from "../state/merchantStore";
import type { Merchant, MerchantCategory, MerchantFilter } from "../types/merchant";
import type { RootStackParamList } from "../navigation/RootNavigator";

type MerchantListNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORY_OPTIONS: { value: MerchantCategory | "all"; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "grid" },
  { value: "restaurant", label: "Restaurant", icon: "restaurant" },
  { value: "cafe", label: "Cafe", icon: "cafe" },
  { value: "grocery", label: "Grocery", icon: "basket" },
  { value: "retail", label: "Retail", icon: "storefront" },
  { value: "pharmacy", label: "Pharmacy", icon: "medical" },
];

interface MerchantCardProps {
  merchant: Merchant;
  onPress: () => void;
}

const MerchantCard: React.FC<MerchantCardProps> = ({ merchant, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      className="bg-[#1A1A2E] rounded-2xl overflow-hidden mb-4 border border-[#2A2A3E]"
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      {/* Banner Image */}
      <View className="relative h-36">
        <Image
          source={{ uri: merchant.bannerUrl }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={200}
        />
        {/* Open/Closed Badge */}
        <View
          className={`absolute top-3 right-3 px-3 py-1 rounded-full ${
            merchant.isOpen ? "bg-green-500/90" : "bg-red-500/90"
          }`}
        >
          <Text className="text-white text-xs font-semibold">
            {merchant.isOpen ? "Open" : "Closed"}
          </Text>
        </View>
        {/* Logo */}
        <View className="absolute -bottom-6 left-4">
          <Image
            source={{ uri: merchant.logoUrl }}
            style={{ width: 56, height: 56, borderRadius: 12 }}
            contentFit="cover"
            transition={200}
          />
        </View>
      </View>

      {/* Content */}
      <View className="pt-8 pb-4 px-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-white text-lg font-bold" numberOfLines={1}>
              {merchant.name}
            </Text>
            <Text className="text-gray-400 text-sm mt-1" numberOfLines={2}>
              {merchant.description}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row items-center mt-3 space-x-4">
          {/* Rating */}
          <View className="flex-row items-center">
            <Ionicons name="star" size={14} color="#FBBF24" />
            <Text className="text-white text-sm font-medium ml-1">
              {merchant.rating.toFixed(1)}
            </Text>
            <Text className="text-gray-500 text-xs ml-1">
              ({merchant.reviewCount})
            </Text>
          </View>

          {/* Delivery Time */}
          {merchant.deliveryTime && (
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
              <Text className="text-gray-400 text-sm ml-1">
                {merchant.deliveryTime}
              </Text>
            </View>
          )}

          {/* Delivery Fee */}
          {merchant.supportsDelivery && merchant.deliveryFee !== undefined && (
            <View className="flex-row items-center">
              <Ionicons name="bicycle-outline" size={14} color="#9CA3AF" />
              <Text className="text-gray-400 text-sm ml-1">
                {merchant.deliveryFee === 0
                  ? "Free delivery"
                  : `$${merchant.deliveryFee.toFixed(2)}`}
              </Text>
            </View>
          )}
        </View>

        {/* Min Order */}
        {merchant.minOrderAmount && (
          <Text className="text-gray-500 text-xs mt-2">
            Min. order ${merchant.minOrderAmount.toFixed(2)}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

export const MerchantListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MerchantListNavigationProp>();

  const merchants = useMerchantStore((s) => s.merchants);
  const getMerchants = useMerchantStore((s) => s.getMerchants);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MerchantCategory | "all">("all");
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Build filter
  const filter: MerchantFilter = {
    searchQuery: searchQuery || undefined,
    category: selectedCategory === "all" ? undefined : selectedCategory,
    isOpen: showOpenOnly ? true : undefined,
  };

  const filteredMerchants = getMerchants(filter);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleMerchantPress = (merchant: Merchant) => {
    navigation.navigate("MerchantDetail", { merchantId: merchant.id });
  };

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      {/* Header */}
      <View
        className="bg-[#0A0A0F] border-b border-[#1F1F2E] px-4 pb-4"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-gray-400 text-sm">Delivery to</Text>
            <Pressable className="flex-row items-center mt-1">
              <Ionicons name="location" size={16} color="#8B5CF6" />
              <Text className="text-white font-semibold ml-1">Current Location</Text>
              <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
            </Pressable>
          </View>
          <Pressable
            onPress={() => navigation.navigate("Cart")}
            className="bg-[#1A1A2E] p-3 rounded-full"
          >
            <Ionicons name="cart-outline" size={22} color="#8B5CF6" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#1A1A2E] rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 text-white ml-3 text-base"
            placeholder="Search merchants..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B5CF6"
          />
        }
      >
        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          {CATEGORY_OPTIONS.map((cat) => (
            <Pressable
              key={cat.value}
              onPress={() => setSelectedCategory(cat.value)}
              className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
                selectedCategory === cat.value
                  ? "bg-[#8B5CF6]"
                  : "bg-[#1A1A2E] border border-[#2A2A3E]"
              }`}
            >
              <Ionicons
                name={cat.icon as any}
                size={16}
                color={selectedCategory === cat.value ? "#FFFFFF" : "#9CA3AF"}
              />
              <Text
                className={`ml-2 font-medium ${
                  selectedCategory === cat.value ? "text-white" : "text-gray-400"
                }`}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Open Now Toggle */}
        <Pressable
          onPress={() => setShowOpenOnly(!showOpenOnly)}
          className="flex-row items-center mb-4"
        >
          <View
            className={`w-5 h-5 rounded border-2 items-center justify-center mr-2 ${
              showOpenOnly
                ? "bg-[#8B5CF6] border-[#8B5CF6]"
                : "border-gray-500"
            }`}
          >
            {showOpenOnly && (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            )}
          </View>
          <Text className="text-gray-400">Show open only</Text>
        </Pressable>

        {/* Results Count */}
        <Text className="text-gray-500 text-sm mb-4">
          {filteredMerchants.length} merchant
          {filteredMerchants.length !== 1 ? "s" : ""} found
        </Text>

        {/* Merchant List */}
        {filteredMerchants.length > 0 ? (
          filteredMerchants.map((merchant) => (
            <MerchantCard
              key={merchant.id}
              merchant={merchant}
              onPress={() => handleMerchantPress(merchant)}
            />
          ))
        ) : (
          <View className="items-center justify-center py-16">
            <Ionicons name="storefront-outline" size={64} color="#4B5563" />
            <Text className="text-gray-400 text-lg mt-4 font-medium">
              No merchants found
            </Text>
            <Text className="text-gray-500 text-sm mt-2 text-center px-8">
              Try adjusting your search or filters
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
