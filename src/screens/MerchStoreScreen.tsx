import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { PageContainer } from "../components/PageContainer";
import { useAuthStore } from "../state/authStore";
import { useMerchStore } from "../state/merchStore";
import type { MerchProduct, MerchCategory, Promotion } from "../types/printify";
import { MusicStoreSection } from "../components/MusicStoreSection";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CATEGORIES: { label: string; value: MerchCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Apparel", value: "apparel" },
  { label: "Hats", value: "hats" },
  { label: "Mugs", value: "mugs" },
  { label: "Phone Cases", value: "phone_cases" },
  { label: "Accessories", value: "accessories" },
  { label: "Stickers", value: "stickers" },
  { label: "Posters", value: "posters" },
];

export const MerchStoreScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);

  // Merch store state
  const products = useMerchStore((s) => s.products);
  const getProducts = useMerchStore((s) => s.getProducts);
  const getActivePromotions = useMerchStore((s) => s.getActivePromotions);
  const getCartTotal = useMerchStore((s) => s.getCartTotal);

  const [selectedCategory, setSelectedCategory] = useState<MerchCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "newest" | "price_low" | "price_high" | "best_selling">("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [countdown, setCountdown] = useState<Record<string, string>>({});

  // Update countdown timers
  useEffect(() => {
    const activePromos = getActivePromotions();
    const timer = setInterval(() => {
      const newCountdowns: Record<string, string> = {};
      activePromos.forEach((promo) => {
        newCountdowns[promo.id] = getTimeRemaining(promo.endDate);
      });
      setCountdown(newCountdowns);
    }, 1000);

    return () => clearInterval(timer);
  }, [products]);

  const filteredProducts = getProducts({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    searchQuery: searchQuery || undefined,
    isActive: true,
    sortBy,
  });

  const featuredProducts = products.filter((p) => p.isFeatured && p.isActive);
  const activePromotions = getActivePromotions();
  const { subtotal, itemCount } = getCartTotal();

  const getTimeRemaining = (endDate: string): string => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return "Ended";

    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((diff % (60 * 1000)) / 1000);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const renderProductCard = ({ item }: { item: MerchProduct }) => (
    <Pressable
      onPress={() => navigation.navigate("MerchProductDetail", { productId: item.id })}
      className="bg-[#1C1C26] rounded-2xl border border-white/5 overflow-hidden mb-5 shadow-lg shadow-black/40"
      style={{ width: Platform.OS === 'web' ? 280 : (SCREEN_WIDTH - 48) / 2 - 8 }}
    >
      {item.images[0] && (
        <View className="relative">
          <Image
            source={{ uri: item.images[0] }}
            style={{ width: "100%", height: Platform.OS === 'web' ? 240 : 180 }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.4)"]}
            className="absolute inset-0"
          />
          {item.isFeatured && (
            <View className="absolute top-3 left-3 bg-purple-600 px-2 py-1 rounded-md shadow-sm">
              <Text className="text-white text-[10px] font-black tracking-widest">HOT</Text>
            </View>
          )}
        </View>
      )}
      <View className="p-4 bg-[#1C1C26]">
        {/* Seller Info */}
        <View className="flex-row items-center mb-2 opacity-60">
          <Image
            source={{ uri: item.streamerAvatar || "https://i.pravatar.cc/150?img=50" }}
            style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
            contentFit="cover"
          />
          <Text className="text-gray-300 text-[10px] uppercase font-bold tracking-wider ml-1.5" numberOfLines={1}>{item.streamerName}</Text>
        </View>
        <Text className="text-white font-bold text-base mb-1" numberOfLines={1}>
          {item.title}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-purple-400 font-black text-lg">
            ${item.finalPrice.toFixed(2)}
          </Text>
          <View className="bg-white/5 px-2 py-1 rounded-lg">
            <Text className="text-gray-500 text-[10px] font-bold">{item.unitsSold} sold</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      {/* Header */}
      <LinearGradient
        colors={["#0A0A0F", "#151520"]}
        className="px-6 py-4 border-b border-white/5"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white text-2xl font-black italic tracking-tighter">THE STORE</Text>
            <Text className="text-purple-500 text-[10px] font-bold tracking-widest uppercase">Official DDNS Gear</Text>
          </View>
          <Pressable
            onPress={() => navigation?.navigate("MerchCart")}
            className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10"
          >
            <Ionicons name="bag-outline" size={20} color="white" />
            {itemCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-purple-600 w-5 h-5 rounded-full items-center justify-center border-2 border-[#151520]">
                <Text className="text-white text-[10px] font-black">{itemCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-black/40 rounded-2xl px-4 py-3 border border-white/5">
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            placeholder="Search the collection..."
            placeholderTextColor="#4B5563"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-white ml-3 font-medium"
          />
          {searchQuery && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#6B7280" />
            </Pressable>
          )}
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <PageContainer>
          {/* Active Promotions Banner */}
          {activePromotions.length > 0 && (
            <View className="px-6 pt-4">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {activePromotions.map((promo) => (
                  <Pressable
                    key={promo.id}
                    className="mr-3"
                    style={{ width: Platform.OS === 'web' ? 400 : SCREEN_WIDTH - 80 }}
                  >
                    <LinearGradient
                      colors={["#4C1D95", "#831843"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="p-5 rounded-2xl border border-white/10"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center mb-1">
                            <Ionicons name="flash" size={14} color="#F59E0B" />
                            <Text className="text-yellow-400 text-[10px] font-black ml-1 tracking-widest uppercase">
                              LIMITED TIME
                            </Text>
                          </View>
                          <Text className="text-white font-black text-xl mb-1">{promo.name}</Text>
                          <Text className="text-purple-200 font-bold text-lg">
                            {promo.type === "percentage_off"
                              ? `${promo.value}% OFF`
                              : promo.type === "fixed_amount_off"
                                ? `$${promo.value} OFF`
                                : "FREE SHIPPING"}
                          </Text>
                          {promo.code && (
                            <View className="flex-row items-center mt-3">
                              <View className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
                                <Text className="text-white font-mono font-black text-sm">{promo.code}</Text>
                              </View>
                            </View>
                          )}
                        </View>
                        <View className="items-end bg-black/20 p-3 rounded-xl">
                          <Text className="text-purple-300 text-[10px] font-bold mb-1 uppercase">Ends in</Text>
                          <Text className="text-white font-black text-lg">
                            {countdown[promo.id] || getTimeRemaining(promo.endDate)}
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Music Store Section */}
          <MusicStoreSection />

          {/* Categories */}
          <View className="py-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.value;
                return (
                  <Pressable
                    key={cat.value}
                    onPress={() => setSelectedCategory(cat.value)}
                    className="mr-2"
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={["#8B5CF6", "#7C3AED"]}
                        className="px-5 py-2.5 rounded-full border border-white/20"
                      >
                        <Text className="text-white font-black text-xs uppercase tracking-widest">
                          {cat.label}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5">
                        <Text className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                          {cat.label}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Featured Products Section */}
          {selectedCategory === "all" && featuredProducts.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between px-6 mb-3">
                <Text className="text-white font-bold text-lg">Featured</Text>
                <Pressable>
                  <Text className="text-purple-400 text-sm">See All</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24 }}
              >
                {featuredProducts.map((product) => (
                  <Pressable
                    key={product.id}
                    onPress={() => navigation.navigate("MerchProductDetail", { productId: product.id })}
                    className="bg-[#151520] rounded-xl border border-gray-800 overflow-hidden mr-4"
                    style={{ width: 180 }}
                  >
                    {product.images[0] && (
                      <Image
                        source={{ uri: product.images[0] }}
                        style={{ width: 180, height: 180 }}
                        contentFit="cover"
                      />
                    )}
                    <View className="p-3">
                      {/* Seller Profile */}
                      <View className="flex-row items-center mb-1">
                        <Image
                          source={{ uri: product.streamerAvatar || "https://i.pravatar.cc/150?img=50" }}
                          style={{ width: 18, height: 18, borderRadius: 9 }}
                          contentFit="cover"
                        />
                        <Text className="text-gray-400 text-xs ml-1.5">{product.streamerName}</Text>
                      </View>
                      <Text className="text-white font-semibold" numberOfLines={1}>
                        {product.title}
                      </Text>
                      <Text className="text-green-400 font-bold mt-1">
                        ${product.finalPrice.toFixed(2)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Sort Options */}
          <View className="flex-row items-center justify-between px-6 mb-4">
            <Text className="text-gray-400 text-sm">{filteredProducts.length} products</Text>
            <Pressable
              onPress={() => setShowFilters(!showFilters)}
              className="flex-row items-center"
            >
              <Ionicons name="filter" size={16} color="#A855F7" />
              <Text className="text-purple-400 text-sm ml-1">Sort & Filter</Text>
            </Pressable>
          </View>

          {/* Sort Options Dropdown */}
          {showFilters && (
            <View className="mx-6 mb-4 bg-[#151520] rounded-xl p-4 border border-gray-800">
              <Text className="text-white font-bold mb-3">Sort By</Text>
              <View className="flex-row flex-wrap gap-2">
                {[
                  { label: "Featured", value: "featured" as const },
                  { label: "Newest", value: "newest" as const },
                  { label: "Price: Low", value: "price_low" as const },
                  { label: "Price: High", value: "price_high" as const },
                  { label: "Best Selling", value: "best_selling" as const },
                ].map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      setSortBy(opt.value);
                      setShowFilters(false);
                    }}
                    className={`px-3 py-2 rounded-lg ${sortBy === opt.value ? "bg-purple-600" : "bg-gray-700"
                      }`}
                  >
                    <Text className="text-white text-sm">{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Products Grid */}
          <View className="px-6 pb-6">
            <View className="flex-row flex-wrap justify-between">
              {filteredProducts.map((product) => (
                <View key={product.id}>
                  {renderProductCard({ item: product })}
                </View>
              ))}
            </View>

            {filteredProducts.length === 0 && (
              <View className="items-center py-12">
                <Ionicons name="shirt-outline" size={64} color="#4B5563" />
                <Text className="text-gray-400 mt-4">No products found</Text>
                <Text className="text-gray-600 text-sm text-center mt-2">
                  Try adjusting your filters or search query
                </Text>
              </View>
            )}
          </View>
        </PageContainer>
      </ScrollView>

      {/* Floating Cart Button */}
      {itemCount > 0 && (
        <Pressable
          onPress={() => navigation?.navigate("MerchCart")}
          className="absolute bottom-6 left-6 right-6 bg-purple-600 py-4 rounded-xl flex-row items-center justify-center"
          style={{
            shadowColor: "#8B5CF6",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
        >
          <Ionicons name="bag" size={20} color="white" />
          <Text className="text-white font-bold ml-2">
            View Cart ({itemCount}) - ${subtotal.toFixed(2)}
          </Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
};
