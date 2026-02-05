import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../state/authStore";
import { useMerchStore } from "../state/merchStore";
import type { Promotion, PromotionDuration, MerchProduct, MerchCategory } from "../types/printify";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DURATION_OPTIONS: { label: string; value: PromotionDuration }[] = [
  { label: "30 min", value: "30_minutes" },
  { label: "1 hour", value: "1_hour" },
  { label: "2 hours", value: "2_hours" },
  { label: "6 hours", value: "6_hours" },
  { label: "12 hours", value: "12_hours" },
  { label: "24 hours", value: "24_hours" },
  { label: "3 days", value: "3_days" },
  { label: "7 days", value: "7_days" },
  { label: "14 days", value: "14_days" },
  { label: "30 days", value: "30_days" },
];

const CATEGORY_OPTIONS: { label: string; value: MerchCategory }[] = [
  { label: "Apparel", value: "apparel" },
  { label: "Hats", value: "hats" },
  { label: "Mugs", value: "mugs" },
  { label: "Phone Cases", value: "phone_cases" },
  { label: "Accessories", value: "accessories" },
  { label: "Stickers", value: "stickers" },
  { label: "Posters", value: "posters" },
  { label: "Bags", value: "bags" },
  { label: "Home Decor", value: "home_decor" },
  { label: "Other", value: "other" },
];

export const AdminMerchStoreScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);

  // Merch store state
  const products = useMerchStore((s) => s.products);
  const promotions = useMerchStore((s) => s.promotions);
  const feeStructures = useMerchStore((s) => s.feeStructures);
  const getActiveFeeStructure = useMerchStore((s) => s.getActiveFeeStructure);
  const getMerchAnalytics = useMerchStore((s) => s.getMerchAnalytics);
  const seedSampleMerchData = useMerchStore((s) => s.seedSampleMerchData);
  const initializeDefaultFeeStructure = useMerchStore((s) => s.initializeDefaultFeeStructure);

  // Promotion actions
  const addPromotion = useMerchStore((s) => s.addPromotion);
  const updatePromotion = useMerchStore((s) => s.updatePromotion);
  const deletePromotion = useMerchStore((s) => s.deletePromotion);
  const createQuickPromotion = useMerchStore((s) => s.createQuickPromotion);
  const getActivePromotions = useMerchStore((s) => s.getActivePromotions);

  // Fee structure actions
  const updateFeeStructure = useMerchStore((s) => s.updateFeeStructure);

  // Product actions
  const updateProduct = useMerchStore((s) => s.updateProduct);
  const bulkUpdateProducts = useMerchStore((s) => s.bulkUpdateProducts);
  const addProduct = useMerchStore((s) => s.addProduct);
  const deleteProduct = useMerchStore((s) => s.deleteProduct);

  const [activeTab, setActiveTab] = useState<"overview" | "products" | "promotions" | "fees" | "providers">("overview");
  const [showCreatePromotion, setShowCreatePromotion] = useState(false);
  const [showQuickPromotion, setShowQuickPromotion] = useState(false);
  const [showEditFees, setShowEditFees] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Initialize data only once
  useEffect(() => {
    initializeDefaultFeeStructure();
  }, []);

  // Seed sample data only if no products exist
  useEffect(() => {
    if (products.length === 0) {
      seedSampleMerchData();
    }
  }, [products.length]);

  // Promotion form state
  const [promotionForm, setPromotionForm] = useState({
    name: "",
    description: "",
    type: "percentage_off" as Promotion["type"],
    value: "",
    code: "",
    minPurchase: "",
    maxDiscount: "",
    duration: "24_hours" as PromotionDuration,
    targetAudience: "all" as Promotion["targetAudience"],
    isVisible: true,
  });

  // Quick promotion form
  const [quickPromoForm, setQuickPromoForm] = useState({
    name: "",
    type: "percentage_off" as Promotion["type"],
    value: "",
    duration: "1_hour" as PromotionDuration,
    targetAudience: "streamers_only" as Promotion["targetAudience"],
  });

  // Fee edit form
  const [feeForm, setFeeForm] = useState({
    basePlatformFee: "",
    streamerTrialDays: "",
    superfanTrialDays: "",
  });

  // Product creation form
  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    category: "apparel" as MerchCategory,
    basePrice: "",
    markupPrice: "",
    images: [] as string[],
    isFeatured: false,
    isDirectSell: true, // Admin direct selling
    tags: "",
  });

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <View className="flex-1 bg-[#0A0A0F] items-center justify-center px-6">
        <Ionicons name="lock-closed" size={64} color="#EF4444" />
        <Text className="text-white text-xl font-bold mt-4">Access Denied</Text>
        <Text className="text-gray-400 text-center mt-2">
          You do not have permission to access this area.
        </Text>
      </View>
    );
  }

  const analytics = getMerchAnalytics(30);
  const activeFeeStructure = getActiveFeeStructure();
  const activePromotions = getActivePromotions();

  const handleCreatePromotion = () => {
    if (!promotionForm.name || !promotionForm.value) return;

    const now = new Date();
    const durationMs = getDurationMs(promotionForm.duration);
    const endDate = new Date(now.getTime() + durationMs);

    addPromotion({
      name: promotionForm.name,
      description: promotionForm.description,
      type: promotionForm.type,
      value: parseFloat(promotionForm.value),
      code: promotionForm.code.toUpperCase() || generatePromoCode(),
      minPurchase: promotionForm.minPurchase ? parseFloat(promotionForm.minPurchase) : undefined,
      maxDiscount: promotionForm.maxDiscount ? parseFloat(promotionForm.maxDiscount) : undefined,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      duration: promotionForm.duration,
      targetAudience: promotionForm.targetAudience,
      status: "active",
      isVisible: promotionForm.isVisible,
      createdBy: user?.id || "admin",
    });

    setShowCreatePromotion(false);
    resetPromotionForm();
  };

  const handleQuickPromotion = () => {
    if (!quickPromoForm.name || !quickPromoForm.value) return;

    createQuickPromotion(
      quickPromoForm.name,
      quickPromoForm.type,
      parseFloat(quickPromoForm.value),
      quickPromoForm.duration,
      quickPromoForm.targetAudience
    );

    setShowQuickPromotion(false);
    resetQuickPromoForm();
  };

  const handleUpdateFees = () => {
    if (!activeFeeStructure) return;

    updateFeeStructure(activeFeeStructure.id, {
      basePlatformFee: feeForm.basePlatformFee ? parseFloat(feeForm.basePlatformFee) : activeFeeStructure.basePlatformFee,
      streamerTrialDays: feeForm.streamerTrialDays ? parseInt(feeForm.streamerTrialDays) : activeFeeStructure.streamerTrialDays,
      superfanTrialDays: feeForm.superfanTrialDays ? parseInt(feeForm.superfanTrialDays) : activeFeeStructure.superfanTrialDays,
    });

    setShowEditFees(false);
    setFeeForm({ basePlatformFee: "", streamerTrialDays: "", superfanTrialDays: "" });
  };

  const handleToggleProductFeatured = (productId: string, currentStatus: boolean) => {
    updateProduct(productId, { isFeatured: !currentStatus });
  };

  const handleBulkFeature = () => {
    if (selectedProducts.length === 0) return;
    bulkUpdateProducts(selectedProducts, { isFeatured: true });
    setSelectedProducts([]);
  };

  const handleEndPromotion = (promotionId: string) => {
    updatePromotion(promotionId, { status: "ended" });
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handlePickProductImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProductForm({
        ...productForm,
        images: [...productForm.images, result.assets[0].uri],
      });
    }
  };

  const handleRemoveProductImage = (index: number) => {
    const newImages = [...productForm.images];
    newImages.splice(index, 1);
    setProductForm({ ...productForm, images: newImages });
  };

  const handleCreateProduct = () => {
    if (!productForm.title || !productForm.basePrice) return;

    const basePrice = parseFloat(productForm.basePrice);
    const markupPrice = productForm.markupPrice ? parseFloat(productForm.markupPrice) : basePrice * 0.3;
    const platformFee = basePrice * 0.12; // 12% platform fee
    const finalPrice = basePrice + markupPrice + platformFee;

    addProduct({
      streamerId: user?.id || "admin",
      streamerName: user?.username || "DDNS Official",
      streamerAvatar: user?.avatar || "https://i.pravatar.cc/150?img=68",
      printifyProductId: productForm.isDirectSell ? "direct-" + Date.now() : "printify-" + Date.now(),
      title: productForm.title,
      description: productForm.description,
      category: productForm.category,
      basePrice,
      markupPrice,
      platformFee,
      finalPrice,
      images: productForm.images.length > 0 ? productForm.images : ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"],
      variants: [
        { id: "v-" + Date.now(), printifyVariantId: 1, title: "One Size", additionalPrice: 0, stockStatus: "in_stock", isAvailable: true },
      ],
      isActive: true,
      isFeatured: productForm.isFeatured,
      tags: productForm.tags.split(",").map((t) => t.trim()).filter((t) => t),
    });

    setShowCreateProduct(false);
    resetProductForm();
  };

  const handleDeleteProduct = (productId: string) => {
    deleteProduct(productId);
    setSelectedProducts((prev) => prev.filter((id) => id !== productId));
  };

  const resetProductForm = () => {
    setProductForm({
      title: "",
      description: "",
      category: "apparel",
      basePrice: "",
      markupPrice: "",
      images: [],
      isFeatured: false,
      isDirectSell: true,
      tags: "",
    });
  };

  const resetPromotionForm = () => {
    setPromotionForm({
      name: "",
      description: "",
      type: "percentage_off",
      value: "",
      code: "",
      minPurchase: "",
      maxDiscount: "",
      duration: "24_hours",
      targetAudience: "all",
      isVisible: true,
    });
  };

  const resetQuickPromoForm = () => {
    setQuickPromoForm({
      name: "",
      type: "percentage_off",
      value: "",
      duration: "1_hour",
      targetAudience: "streamers_only",
    });
  };

  const getDurationMs = (duration: PromotionDuration): number => {
    const map: Record<PromotionDuration, number> = {
      "30_minutes": 30 * 60 * 1000,
      "1_hour": 60 * 60 * 1000,
      "2_hours": 2 * 60 * 60 * 1000,
      "6_hours": 6 * 60 * 60 * 1000,
      "12_hours": 12 * 60 * 60 * 1000,
      "24_hours": 24 * 60 * 60 * 1000,
      "3_days": 3 * 24 * 60 * 60 * 1000,
      "7_days": 7 * 24 * 60 * 60 * 1000,
      "14_days": 14 * 24 * 60 * 60 * 1000,
      "30_days": 30 * 24 * 60 * 60 * 1000,
      custom: 0,
    };
    return map[duration];
  };

  const generatePromoCode = () => {
    return "PROMO" + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-800">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable onPress={() => navigation.goBack()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <View>
              <Text className="text-white text-xl font-bold">Merch Store Admin</Text>
              <Text className="text-gray-400 text-sm">Manage products, pricing & promotions</Text>
            </View>
          </View>
          <View className="bg-green-600 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-bold">PRINTIFY</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-gray-800">
        {(["overview", "products", "promotions", "fees", "providers"] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-3 ${activeTab === tab ? "border-b-2 border-purple-500" : ""}`}
          >
            <Text
              className={`text-center text-sm font-semibold capitalize ${
                activeTab === tab ? "text-purple-500" : "text-gray-400"
              }`}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView className="flex-1">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <View className="p-6">
            {/* Stats Grid */}
            <View className="flex-row flex-wrap -mx-2 mb-6">
              <View className="w-1/2 px-2 mb-4">
                <View className="bg-[#151520] p-4 rounded-xl border border-gray-800">
                  <Text className="text-gray-400 text-xs">Total Revenue (30d)</Text>
                  <Text className="text-white text-2xl font-bold mt-1">
                    ${analytics.totalRevenue.toFixed(2)}
                  </Text>
                </View>
              </View>
              <View className="w-1/2 px-2 mb-4">
                <View className="bg-[#151520] p-4 rounded-xl border border-gray-800">
                  <Text className="text-gray-400 text-xs">Total Orders</Text>
                  <Text className="text-white text-2xl font-bold mt-1">
                    {analytics.totalOrders}
                  </Text>
                </View>
              </View>
              <View className="w-1/2 px-2 mb-4">
                <View className="bg-[#151520] p-4 rounded-xl border border-gray-800">
                  <Text className="text-gray-400 text-xs">Units Sold</Text>
                  <Text className="text-white text-2xl font-bold mt-1">
                    {analytics.totalUnitsSold}
                  </Text>
                </View>
              </View>
              <View className="w-1/2 px-2 mb-4">
                <View className="bg-[#151520] p-4 rounded-xl border border-gray-800">
                  <Text className="text-gray-400 text-xs">Avg Order Value</Text>
                  <Text className="text-white text-2xl font-bold mt-1">
                    ${analytics.averageOrderValue.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Active Promotions Banner */}
            {activePromotions.length > 0 && (
              <View className="mb-6">
                <Text className="text-white font-bold mb-3">Active Promotions</Text>
                {activePromotions.slice(0, 3).map((promo) => (
                  <View
                    key={promo.id}
                    className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-4 rounded-xl mb-3 border border-purple-500/30"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-white font-bold">{promo.name}</Text>
                        <Text className="text-purple-300 text-sm">
                          {promo.type === "percentage_off" ? `${promo.value}% OFF` : `$${promo.value} OFF`}
                          {promo.code && ` • Code: ${promo.code}`}
                        </Text>
                        <Text className="text-gray-400 text-xs mt-1">
                          {getTimeRemaining(promo.endDate)}
                        </Text>
                      </View>
                      <View className="bg-green-600/20 px-2 py-1 rounded">
                        <Text className="text-green-400 text-xs font-bold">
                          {promo.usageCount} used
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Quick Actions */}
            <Text className="text-white font-bold mb-3">Quick Actions</Text>
            <View className="flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-4">
                <Pressable
                  onPress={() => setShowQuickPromotion(true)}
                  className="bg-purple-600 p-4 rounded-xl flex-row items-center justify-center"
                >
                  <Ionicons name="flash" size={20} color="white" />
                  <Text className="text-white font-bold ml-2">Flash Sale</Text>
                </Pressable>
              </View>
              <View className="w-1/2 px-2 mb-4">
                <Pressable
                  onPress={() => setShowCreatePromotion(true)}
                  className="bg-pink-600 p-4 rounded-xl flex-row items-center justify-center"
                >
                  <Ionicons name="pricetag" size={20} color="white" />
                  <Text className="text-white font-bold ml-2">New Promo</Text>
                </Pressable>
              </View>
            </View>

            {/* Top Selling Products */}
            <Text className="text-white font-bold mb-3 mt-4">Top Selling Products</Text>
            {analytics.topProducts.slice(0, 5).map((product, index) => (
              <View
                key={product.productId}
                className="bg-[#151520] p-4 rounded-xl mb-3 border border-gray-800 flex-row items-center"
              >
                <View className="w-8 h-8 rounded-full bg-purple-600/30 items-center justify-center mr-3">
                  <Text className="text-purple-400 font-bold">{index + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold">{product.productTitle}</Text>
                  <Text className="text-gray-400 text-sm">{product.streamerName}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-green-400 font-bold">${product.revenue.toFixed(2)}</Text>
                  <Text className="text-gray-500 text-xs">{product.unitsSold} sold</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <View className="p-6">
            {/* Create Product Button */}
            <Pressable
              onPress={() => setShowCreateProduct(true)}
              className="bg-green-600 py-4 rounded-xl flex-row items-center justify-center mb-4"
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text className="text-white font-bold ml-2">Create New Product (Direct Sell)</Text>
            </Pressable>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <View className="bg-purple-600/20 p-4 rounded-xl mb-4 border border-purple-500/30">
                <Text className="text-purple-300 mb-2">
                  {selectedProducts.length} product(s) selected
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={handleBulkFeature}
                    className="bg-purple-600 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-white font-bold text-sm">Feature All</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSelectedProducts([])}
                    className="bg-gray-700 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-white font-bold text-sm">Clear</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Products List */}
            {products.map((product) => (
              <Pressable
                key={product.id}
                onPress={() => toggleProductSelection(product.id)}
                className={`bg-[#151520] p-4 rounded-xl mb-3 border ${
                  selectedProducts.includes(product.id) ? "border-purple-500" : "border-gray-800"
                }`}
              >
                <View className="flex-row">
                  {product.images[0] && (
                    <Image
                      source={{ uri: product.images[0] }}
                      style={{ width: 60, height: 60, borderRadius: 8 }}
                      contentFit="cover"
                    />
                  )}
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-white font-bold flex-1" numberOfLines={1}>
                        {product.title}
                      </Text>
                      <View className="flex-row items-center">
                        {product.printifyProductId?.startsWith("direct-") && (
                          <View className="bg-green-600/20 px-2 py-0.5 rounded mr-2">
                            <Text className="text-green-400 text-xs font-bold">DIRECT</Text>
                          </View>
                        )}
                        {product.isFeatured && (
                          <View className="bg-yellow-600/20 px-2 py-0.5 rounded">
                            <Text className="text-yellow-400 text-xs font-bold">FEATURED</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      {product.streamerAvatar && (
                        <Image
                          source={{ uri: product.streamerAvatar }}
                          style={{ width: 16, height: 16, borderRadius: 8, marginRight: 4 }}
                          contentFit="cover"
                        />
                      )}
                      <Text className="text-gray-400 text-sm">{product.streamerName}</Text>
                    </View>
                    <View className="flex-row items-center mt-2">
                      <Text className="text-green-400 font-bold">${product.finalPrice.toFixed(2)}</Text>
                      <Text className="text-gray-500 text-xs ml-2">
                        Base: ${product.basePrice.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Product Actions */}
                <View className="flex-row mt-3 pt-3 border-t border-gray-800">
                  <Pressable
                    onPress={() => handleToggleProductFeatured(product.id, product.isFeatured)}
                    className={`flex-1 py-2 rounded-lg mr-2 ${
                      product.isFeatured ? "bg-yellow-600/20" : "bg-gray-700/50"
                    }`}
                  >
                    <Text className={`text-center text-sm font-bold ${
                      product.isFeatured ? "text-yellow-400" : "text-gray-300"
                    }`}>
                      {product.isFeatured ? "Unfeature" : "Feature"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => updateProduct(product.id, { isActive: !product.isActive })}
                    className={`flex-1 py-2 rounded-lg mr-2 ${
                      product.isActive ? "bg-green-600/20" : "bg-red-600/20"
                    }`}
                  >
                    <Text className={`text-center text-sm font-bold ${
                      product.isActive ? "text-green-400" : "text-red-400"
                    }`}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteProduct(product.id)}
                    className="py-2 px-3 rounded-lg bg-red-600/20"
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </Pressable>
                </View>
              </Pressable>
            ))}

            {products.length === 0 && (
              <View className="items-center py-12">
                <Ionicons name="shirt-outline" size={64} color="#4B5563" />
                <Text className="text-gray-400 mt-4">No products yet</Text>
                <Text className="text-gray-600 text-sm text-center">
                  Create your own products to sell directly or connect to Printify
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Promotions Tab */}
        {activeTab === "promotions" && (
          <View className="p-6">
            {/* Create Promotion Buttons */}
            <View className="flex-row mb-6 gap-3">
              <Pressable
                onPress={() => setShowQuickPromotion(true)}
                className="flex-1 bg-purple-600 py-4 rounded-xl flex-row items-center justify-center"
              >
                <Ionicons name="flash" size={20} color="white" />
                <Text className="text-white font-bold ml-2">Quick Promo</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowCreatePromotion(true)}
                className="flex-1 bg-pink-600 py-4 rounded-xl flex-row items-center justify-center"
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text className="text-white font-bold ml-2">Full Campaign</Text>
              </Pressable>
            </View>

            {/* Promotions List */}
            <Text className="text-white font-bold mb-3">All Promotions</Text>
            {promotions.map((promo) => {
              const isExpired = new Date(promo.endDate) < new Date();
              const isActive = promo.status === "active" && !isExpired;

              return (
                <View
                  key={promo.id}
                  className={`bg-[#151520] p-4 rounded-xl mb-3 border ${
                    isActive ? "border-green-500/30" : "border-gray-800"
                  }`}
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-white font-bold">{promo.name}</Text>
                      <Text className="text-gray-400 text-sm">{promo.description}</Text>
                    </View>
                    <View
                      className={`px-2 py-1 rounded ${
                        isActive
                          ? "bg-green-600/20"
                          : isExpired
                          ? "bg-gray-700"
                          : "bg-yellow-600/20"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isActive
                            ? "text-green-400"
                            : isExpired
                            ? "text-gray-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {isExpired ? "EXPIRED" : promo.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center mb-3">
                    <View className="bg-purple-600/30 px-3 py-1 rounded-full mr-2">
                      <Text className="text-purple-300 text-sm font-bold">
                        {promo.type === "percentage_off"
                          ? `${promo.value}% OFF`
                          : promo.type === "fixed_amount_off"
                          ? `$${promo.value} OFF`
                          : promo.type === "free_shipping"
                          ? "FREE SHIPPING"
                          : "BUNDLE DEAL"}
                      </Text>
                    </View>
                    {promo.code && (
                      <View className="bg-gray-700 px-3 py-1 rounded-full">
                        <Text className="text-gray-300 text-sm font-mono">{promo.code}</Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-gray-500 text-xs">
                        Target: {promo.targetAudience.replace("_", " ")}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        Used: {promo.usageCount} times
                      </Text>
                    </View>
                    <View>
                      {isActive && (
                        <Text className="text-green-400 text-xs font-bold">
                          {getTimeRemaining(promo.endDate)}
                        </Text>
                      )}
                    </View>
                  </View>

                  {isActive && (
                    <View className="flex-row mt-3 pt-3 border-t border-gray-800">
                      <Pressable
                        onPress={() => handleEndPromotion(promo.id)}
                        className="flex-1 bg-red-600/20 py-2 rounded-lg mr-2"
                      >
                        <Text className="text-red-400 text-center font-bold text-sm">End Now</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => updatePromotion(promo.id, { isVisible: !promo.isVisible })}
                        className="flex-1 bg-gray-700/50 py-2 rounded-lg"
                      >
                        <Text className="text-gray-300 text-center font-bold text-sm">
                          {promo.isVisible ? "Hide" : "Show"}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}

            {promotions.length === 0 && (
              <View className="items-center py-12">
                <Ionicons name="pricetag-outline" size={64} color="#4B5563" />
                <Text className="text-gray-400 mt-4">No promotions yet</Text>
                <Text className="text-gray-600 text-sm">Create your first promotion to get started</Text>
              </View>
            )}
          </View>
        )}

        {/* Fees Tab */}
        {activeTab === "fees" && (
          <View className="p-6">
            {/* Current Fee Structure */}
            {activeFeeStructure && (
              <View className="bg-[#151520] p-6 rounded-xl border border-gray-800 mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-lg font-bold">Current Fee Structure</Text>
                  <Pressable
                    onPress={() => {
                      setFeeForm({
                        basePlatformFee: activeFeeStructure.basePlatformFee.toString(),
                        streamerTrialDays: activeFeeStructure.streamerTrialDays.toString(),
                        superfanTrialDays: activeFeeStructure.superfanTrialDays.toString(),
                      });
                      setShowEditFees(true);
                    }}
                    className="bg-purple-600/20 px-3 py-1 rounded-lg"
                  >
                    <Text className="text-purple-400 text-sm font-bold">Edit</Text>
                  </Pressable>
                </View>

                <View className="mb-4">
                  <Text className="text-gray-400 text-sm">Platform Fee</Text>
                  <Text className="text-white text-3xl font-bold">
                    {activeFeeStructure.basePlatformFee}%
                  </Text>
                </View>

                {/* Competitor Comparison */}
                <View className="bg-green-900/20 p-4 rounded-xl border border-green-500/20 mb-4">
                  <Text className="text-green-400 font-bold mb-2">20% Lower Than Competitors</Text>
                  <View className="flex-row justify-between">
                    <View>
                      <Text className="text-gray-400 text-xs">TikTok</Text>
                      <Text className="text-white font-bold">{activeFeeStructure.competitorComparison.tiktokRate}%</Text>
                    </View>
                    <View>
                      <Text className="text-gray-400 text-xs">Instagram</Text>
                      <Text className="text-white font-bold">{activeFeeStructure.competitorComparison.instagramRate}%</Text>
                    </View>
                    <View>
                      <Text className="text-gray-400 text-xs">Our Rate</Text>
                      <Text className="text-green-400 font-bold">{activeFeeStructure.competitorComparison.ourRate}%</Text>
                    </View>
                  </View>
                </View>

                {/* Trial Periods */}
                <View className="flex-row">
                  <View className="flex-1 bg-purple-900/20 p-4 rounded-xl mr-2 border border-purple-500/20">
                    <Ionicons name="videocam" size={24} color="#A855F7" />
                    <Text className="text-white font-bold mt-2">Streamer Trial</Text>
                    <Text className="text-purple-300 text-2xl font-bold">
                      {activeFeeStructure.streamerTrialDays} days
                    </Text>
                    <Text className="text-gray-400 text-xs">0% fees during trial</Text>
                  </View>
                  <View className="flex-1 bg-pink-900/20 p-4 rounded-xl border border-pink-500/20">
                    <Ionicons name="star" size={24} color="#EC4899" />
                    <Text className="text-white font-bold mt-2">Super Fan Trial</Text>
                    <Text className="text-pink-300 text-2xl font-bold">
                      {activeFeeStructure.superfanTrialDays} days
                    </Text>
                    <Text className="text-gray-400 text-xs">0% fees during trial</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Fee-Free Periods Info */}
            <View className="bg-[#151520] p-6 rounded-xl border border-gray-800">
              <Text className="text-white font-bold mb-3">Fee-Free Period Benefits</Text>
              <View className="space-y-3">
                <View className="flex-row items-start">
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text className="text-gray-300 ml-2 flex-1">
                    New streamers pay 0% platform fees for their first 2 months
                  </Text>
                </View>
                <View className="flex-row items-start mt-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text className="text-gray-300 ml-2 flex-1">
                    Super Fans also enjoy 0% fees for 2 months when purchasing merch
                  </Text>
                </View>
                <View className="flex-row items-start mt-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text className="text-gray-300 ml-2 flex-1">
                    Our rates are 20% lower than TikTok and Instagram smallest packages
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Providers Tab */}
        {activeTab === "providers" && (
          <View className="p-6">
            {/* Info Banner */}
            <View className="bg-purple-900/20 p-4 rounded-xl border border-purple-500/30 mb-6">
              <View className="flex-row items-center mb-2">
                <Ionicons name="information-circle" size={24} color="#A855F7" />
                <Text className="text-purple-300 font-bold ml-2">Print-on-Demand Integration</Text>
              </View>
              <Text className="text-gray-300 text-sm">
                Connect your print-on-demand providers to automatically sync products and fulfill orders. Streamers can connect their own provider accounts in the Streamer Merch screen.
              </Text>
            </View>

            {/* Provider Cards */}
            <View className="space-y-4">
              {/* Printful Card */}
              <View className="bg-[#151520] p-6 rounded-xl border border-gray-800">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-red-600/20 rounded-xl items-center justify-center mr-3">
                      <Ionicons name="shirt" size={24} color="#EF4444" />
                    </View>
                    <View>
                      <Text className="text-white text-lg font-bold">Printful</Text>
                      <Text className="text-gray-400 text-sm">Full-service POD provider</Text>
                    </View>
                  </View>
                  <View className="bg-gray-700 px-3 py-1 rounded-full">
                    <Text className="text-gray-300 text-xs font-bold">Available</Text>
                  </View>
                </View>

                <View className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20 mb-4">
                  <Text className="text-blue-400 font-bold mb-2">How to connect Printful:</Text>
                  <Text className="text-blue-300/70 text-sm">
                    1. Go to printful.com and create an account{"\n"}
                    2. Navigate to Settings → Stores → Add Store{"\n"}
                    3. Create a &quot;Manual order / API&quot; store{"\n"}
                    4. Go to Settings → API to generate OAuth token{"\n"}
                    5. Give token to streamers to connect in Streamer Merch
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text className="text-gray-300 text-sm ml-2">High quality printing</Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text className="text-gray-300 text-sm ml-2">Wide product selection</Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text className="text-gray-300 text-sm ml-2">Global fulfillment</Text>
                </View>
              </View>

              {/* Printify Card */}
              <View className="bg-[#151520] p-6 rounded-xl border border-gray-800">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-green-600/20 rounded-xl items-center justify-center mr-3">
                      <Ionicons name="pricetag" size={24} color="#10B981" />
                    </View>
                    <View>
                      <Text className="text-white text-lg font-bold">Printify</Text>
                      <Text className="text-gray-400 text-sm">Cost-effective POD network</Text>
                    </View>
                  </View>
                  <View className="bg-gray-700 px-3 py-1 rounded-full">
                    <Text className="text-gray-300 text-xs font-bold">Available</Text>
                  </View>
                </View>

                <View className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20 mb-4">
                  <Text className="text-blue-400 font-bold mb-2">How to connect Printify:</Text>
                  <Text className="text-blue-300/70 text-sm">
                    1. Go to printify.com and sign up{"\n"}
                    2. Create a shop in your account{"\n"}
                    3. Go to Connections → API{"\n"}
                    4. Generate an API token{"\n"}
                    5. Give token and shop ID to streamers
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text className="text-gray-300 text-sm ml-2">Lower cost per item</Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text className="text-gray-300 text-sm ml-2">Multiple print providers</Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text className="text-gray-300 text-sm ml-2">Easy product catalog</Text>
                </View>
              </View>

              {/* Gelato Card */}
              <View className="bg-[#151520] p-6 rounded-xl border border-gray-800">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-blue-600/20 rounded-xl items-center justify-center mr-3">
                      <Ionicons name="globe" size={24} color="#3B82F6" />
                    </View>
                    <View>
                      <Text className="text-white text-lg font-bold">Gelato</Text>
                      <Text className="text-gray-400 text-sm">Local production worldwide</Text>
                    </View>
                  </View>
                  <View className="bg-gray-700 px-3 py-1 rounded-full">
                    <Text className="text-gray-300 text-xs font-bold">Available</Text>
                  </View>
                </View>

                <View className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20 mb-4">
                  <Text className="text-blue-400 font-bold mb-2">How to connect Gelato:</Text>
                  <Text className="text-blue-300/70 text-sm">
                    1. Visit gelato.com and create account{"\n"}
                    2. Go to API Settings in dashboard{"\n"}
                    3. Generate API key{"\n"}
                    4. Give API key to streamers to connect{"\n"}
                    5. Configure shipping and production settings
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text className="text-gray-300 text-sm ml-2">Fastest shipping times</Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text className="text-gray-300 text-sm ml-2">Eco-friendly production</Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text className="text-gray-300 text-sm ml-2">32 countries with facilities</Text>
                </View>
              </View>
            </View>

            {/* Integration Status */}
            <View className="bg-[#151520] p-6 rounded-xl border border-gray-800 mt-6">
              <Text className="text-white font-bold mb-3">Integration Status</Text>
              <View className="space-y-3">
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text className="text-gray-300 ml-2">API clients configured and ready</Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text className="text-gray-300 ml-2">Product syncing implemented</Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text className="text-gray-300 ml-2">Order routing active</Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text className="text-gray-300 ml-2">Webhook handlers configured</Text>
                </View>
              </View>
            </View>

            {/* Where to Connect */}
            <View className="bg-cyan-900/20 p-4 rounded-xl border border-cyan-500/20 mt-6">
              <View className="flex-row items-center mb-2">
                <Ionicons name="help-circle" size={24} color="#06B6D4" />
                <Text className="text-cyan-300 font-bold ml-2">Where do streamers connect?</Text>
              </View>
              <Text className="text-gray-300 text-sm">
                Streamers can connect their POD provider accounts in the <Text className="text-purple-400 font-bold">Streamer Merch</Text> screen. They will need to provide their own API tokens and store/shop IDs from their provider accounts.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Promotion Modal */}
      <Modal visible={showQuickPromotion} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-[#151520] rounded-t-3xl p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white text-xl font-bold">Quick Flash Sale</Text>
                  <Pressable onPress={() => setShowQuickPromotion(false)}>
                    <Ionicons name="close" size={28} color="white" />
                  </Pressable>
                </View>

                <Text className="text-gray-400 text-sm mb-4">
                  Create a time-limited promotion for streamers to opt into
                </Text>

                <TextInput
                  placeholder="Promotion Name *"
                  placeholderTextColor="#6B7280"
                  value={quickPromoForm.name}
                  onChangeText={(text) => setQuickPromoForm({ ...quickPromoForm, name: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                <View className="flex-row mb-4">
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-400 text-sm mb-2">Type</Text>
                    <View className="flex-row">
                      <Pressable
                        onPress={() => setQuickPromoForm({ ...quickPromoForm, type: "percentage_off" })}
                        className={`flex-1 py-2 rounded-l-xl border ${
                          quickPromoForm.type === "percentage_off"
                            ? "bg-purple-600 border-purple-600"
                            : "bg-[#0A0A0F] border-gray-700"
                        }`}
                      >
                        <Text className="text-white text-center text-sm">% Off</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setQuickPromoForm({ ...quickPromoForm, type: "fixed_amount_off" })}
                        className={`flex-1 py-2 rounded-r-xl border ${
                          quickPromoForm.type === "fixed_amount_off"
                            ? "bg-purple-600 border-purple-600"
                            : "bg-[#0A0A0F] border-gray-700"
                        }`}
                      >
                        <Text className="text-white text-center text-sm">$ Off</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 text-sm mb-2">Value *</Text>
                    <TextInput
                      placeholder={quickPromoForm.type === "percentage_off" ? "20" : "5.00"}
                      placeholderTextColor="#6B7280"
                      value={quickPromoForm.value}
                      onChangeText={(text) => setQuickPromoForm({ ...quickPromoForm, value: text })}
                      keyboardType="decimal-pad"
                      className="bg-[#0A0A0F] text-white px-4 py-2 rounded-xl"
                    />
                  </View>
                </View>

                <Text className="text-gray-400 text-sm mb-2">Duration</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <View className="flex-row gap-2">
                    {DURATION_OPTIONS.slice(0, 6).map((opt) => (
                      <Pressable
                        key={opt.value}
                        onPress={() => setQuickPromoForm({ ...quickPromoForm, duration: opt.value })}
                        className={`px-4 py-2 rounded-xl border ${
                          quickPromoForm.duration === opt.value
                            ? "bg-purple-600 border-purple-600"
                            : "bg-[#0A0A0F] border-gray-700"
                        }`}
                      >
                        <Text className="text-white text-sm">{opt.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                <Text className="text-gray-400 text-sm mb-2">Target Audience</Text>
                <View className="flex-row mb-6">
                  <Pressable
                    onPress={() => setQuickPromoForm({ ...quickPromoForm, targetAudience: "streamers_only" })}
                    className={`flex-1 py-3 rounded-l-xl border ${
                      quickPromoForm.targetAudience === "streamers_only"
                        ? "bg-purple-600 border-purple-600"
                        : "bg-[#0A0A0F] border-gray-700"
                    }`}
                  >
                    <Text className="text-white text-center text-sm">Streamers</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setQuickPromoForm({ ...quickPromoForm, targetAudience: "all" })}
                    className={`flex-1 py-3 rounded-r-xl border ${
                      quickPromoForm.targetAudience === "all"
                        ? "bg-purple-600 border-purple-600"
                        : "bg-[#0A0A0F] border-gray-700"
                    }`}
                  >
                    <Text className="text-white text-center text-sm">Everyone</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={handleQuickPromotion}
                  className="bg-purple-600 py-4 rounded-xl"
                >
                  <Text className="text-white text-center font-bold">Launch Flash Sale</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Full Campaign Modal */}
      <Modal visible={showCreatePromotion} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[85%]">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-xl font-bold">Create Campaign</Text>
                  <Pressable onPress={() => setShowCreatePromotion(false)}>
                    <Ionicons name="close" size={28} color="white" />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <TextInput
                    placeholder="Campaign Name *"
                    placeholderTextColor="#6B7280"
                    value={promotionForm.name}
                    onChangeText={(text) => setPromotionForm({ ...promotionForm, name: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />

                  <TextInput
                    placeholder="Description"
                    placeholderTextColor="#6B7280"
                    value={promotionForm.description}
                    onChangeText={(text) => setPromotionForm({ ...promotionForm, description: text })}
                    multiline
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                    style={{ minHeight: 60 }}
                  />

                  <Text className="text-gray-400 text-sm mb-2">Discount Type</Text>
                  <View className="flex-row flex-wrap gap-2 mb-4">
                    {(["percentage_off", "fixed_amount_off", "free_shipping"] as const).map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => setPromotionForm({ ...promotionForm, type })}
                        className={`px-4 py-2 rounded-xl border ${
                          promotionForm.type === type
                            ? "bg-purple-600 border-purple-600"
                            : "bg-[#0A0A0F] border-gray-700"
                        }`}
                      >
                        <Text className="text-white text-sm capitalize">
                          {type.replace(/_/g, " ")}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <View className="flex-row mb-4">
                    <View className="flex-1 mr-2">
                      <TextInput
                        placeholder="Value *"
                        placeholderTextColor="#6B7280"
                        value={promotionForm.value}
                        onChangeText={(text) => setPromotionForm({ ...promotionForm, value: text })}
                        keyboardType="decimal-pad"
                        className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                      />
                    </View>
                    <View className="flex-1">
                      <TextInput
                        placeholder="Promo Code (optional)"
                        placeholderTextColor="#6B7280"
                        value={promotionForm.code}
                        onChangeText={(text) => setPromotionForm({ ...promotionForm, code: text.toUpperCase() })}
                        autoCapitalize="characters"
                        className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                      />
                    </View>
                  </View>

                  <View className="flex-row mb-4">
                    <View className="flex-1 mr-2">
                      <TextInput
                        placeholder="Min Purchase $"
                        placeholderTextColor="#6B7280"
                        value={promotionForm.minPurchase}
                        onChangeText={(text) => setPromotionForm({ ...promotionForm, minPurchase: text })}
                        keyboardType="decimal-pad"
                        className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                      />
                    </View>
                    <View className="flex-1">
                      <TextInput
                        placeholder="Max Discount $"
                        placeholderTextColor="#6B7280"
                        value={promotionForm.maxDiscount}
                        onChangeText={(text) => setPromotionForm({ ...promotionForm, maxDiscount: text })}
                        keyboardType="decimal-pad"
                        className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                      />
                    </View>
                  </View>

                  <Text className="text-gray-400 text-sm mb-2">Duration</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    <View className="flex-row gap-2">
                      {DURATION_OPTIONS.map((opt) => (
                        <Pressable
                          key={opt.value}
                          onPress={() => setPromotionForm({ ...promotionForm, duration: opt.value })}
                          className={`px-3 py-2 rounded-xl border ${
                            promotionForm.duration === opt.value
                              ? "bg-purple-600 border-purple-600"
                              : "bg-[#0A0A0F] border-gray-700"
                          }`}
                        >
                          <Text className="text-white text-xs">{opt.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>

                  <Text className="text-gray-400 text-sm mb-2">Target Audience</Text>
                  <View className="flex-row flex-wrap gap-2 mb-4">
                    {(["all", "streamers_only", "superfans_only", "new_users"] as const).map((audience) => (
                      <Pressable
                        key={audience}
                        onPress={() => setPromotionForm({ ...promotionForm, targetAudience: audience })}
                        className={`px-3 py-2 rounded-xl border ${
                          promotionForm.targetAudience === audience
                            ? "bg-purple-600 border-purple-600"
                            : "bg-[#0A0A0F] border-gray-700"
                        }`}
                      >
                        <Text className="text-white text-xs capitalize">
                          {audience.replace(/_/g, " ")}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable
                    onPress={() => setPromotionForm({ ...promotionForm, isVisible: !promotionForm.isVisible })}
                    className="flex-row items-center mb-6"
                  >
                    <View
                      className={`w-6 h-6 rounded border mr-3 items-center justify-center ${
                        promotionForm.isVisible ? "bg-purple-600 border-purple-600" : "border-gray-600"
                      }`}
                    >
                      {promotionForm.isVisible && <Ionicons name="checkmark" size={16} color="white" />}
                    </View>
                    <Text className="text-white">Show promotion banner to streamers</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleCreatePromotion}
                    className="bg-pink-600 py-4 rounded-xl mb-4"
                  >
                    <Text className="text-white text-center font-bold">Create Campaign</Text>
                  </Pressable>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Fees Modal */}
      <Modal visible={showEditFees} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-[#151520] rounded-t-3xl p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white text-xl font-bold">Edit Fee Structure</Text>
                  <Pressable onPress={() => setShowEditFees(false)}>
                    <Ionicons name="close" size={28} color="white" />
                  </Pressable>
                </View>

                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">Platform Fee (%)</Text>
                  <TextInput
                    placeholder="12"
                    placeholderTextColor="#6B7280"
                    value={feeForm.basePlatformFee}
                    onChangeText={(text) => setFeeForm({ ...feeForm, basePlatformFee: text })}
                    keyboardType="decimal-pad"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  />
                </View>

                <View className="flex-row mb-4">
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-400 text-sm mb-2">Streamer Trial (days)</Text>
                    <TextInput
                      placeholder="60"
                      placeholderTextColor="#6B7280"
                      value={feeForm.streamerTrialDays}
                      onChangeText={(text) => setFeeForm({ ...feeForm, streamerTrialDays: text })}
                      keyboardType="number-pad"
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 text-sm mb-2">Super Fan Trial (days)</Text>
                    <TextInput
                      placeholder="60"
                      placeholderTextColor="#6B7280"
                      value={feeForm.superfanTrialDays}
                      onChangeText={(text) => setFeeForm({ ...feeForm, superfanTrialDays: text })}
                      keyboardType="number-pad"
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                    />
                  </View>
                </View>

                <Pressable
                  onPress={handleUpdateFees}
                  className="bg-purple-600 py-4 rounded-xl"
                >
                  <Text className="text-white text-center font-bold">Update Fee Structure</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Create Product Modal */}
      <Modal visible={showCreateProduct} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[90%]">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-xl font-bold">Create Product</Text>
                  <Pressable onPress={() => setShowCreateProduct(false)}>
                    <Ionicons name="close" size={28} color="white" />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Product Type */}
                  <View className="bg-green-900/20 p-4 rounded-xl mb-4 border border-green-500/30">
                    <View className="flex-row items-center">
                      <Ionicons name="storefront" size={24} color="#10B981" />
                      <View className="ml-3 flex-1">
                        <Text className="text-green-400 font-bold">Direct Selling</Text>
                        <Text className="text-gray-400 text-xs">
                          Sell products directly without Printify integration
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TextInput
                    placeholder="Product Title *"
                    placeholderTextColor="#6B7280"
                    value={productForm.title}
                    onChangeText={(text) => setProductForm({ ...productForm, title: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />

                  <TextInput
                    placeholder="Description"
                    placeholderTextColor="#6B7280"
                    value={productForm.description}
                    onChangeText={(text) => setProductForm({ ...productForm, description: text })}
                    multiline
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                    style={{ minHeight: 80 }}
                  />

                  {/* Category Selection */}
                  <Text className="text-gray-400 text-sm mb-2">Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    <View className="flex-row gap-2">
                      {CATEGORY_OPTIONS.map((cat) => (
                        <Pressable
                          key={cat.value}
                          onPress={() => setProductForm({ ...productForm, category: cat.value })}
                          className={`px-4 py-2 rounded-xl border ${
                            productForm.category === cat.value
                              ? "bg-purple-600 border-purple-600"
                              : "bg-[#0A0A0F] border-gray-700"
                          }`}
                        >
                          <Text className="text-white text-sm">{cat.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>

                  {/* Pricing */}
                  <View className="flex-row mb-4">
                    <View className="flex-1 mr-2">
                      <Text className="text-gray-400 text-sm mb-2">Base Price ($) *</Text>
                      <TextInput
                        placeholder="25.00"
                        placeholderTextColor="#6B7280"
                        value={productForm.basePrice}
                        onChangeText={(text) => setProductForm({ ...productForm, basePrice: text })}
                        keyboardType="decimal-pad"
                        className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-400 text-sm mb-2">Markup ($)</Text>
                      <TextInput
                        placeholder="Auto: 30%"
                        placeholderTextColor="#6B7280"
                        value={productForm.markupPrice}
                        onChangeText={(text) => setProductForm({ ...productForm, markupPrice: text })}
                        keyboardType="decimal-pad"
                        className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                      />
                    </View>
                  </View>

                  {/* Product Images */}
                  <Text className="text-gray-400 text-sm mb-2">Product Images</Text>
                  <View className="flex-row flex-wrap mb-4">
                    {productForm.images.map((uri, index) => (
                      <View key={index} className="relative mr-2 mb-2">
                        <Image
                          source={{ uri }}
                          style={{ width: 80, height: 80, borderRadius: 8 }}
                          contentFit="cover"
                        />
                        <Pressable
                          onPress={() => handleRemoveProductImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                        >
                          <Ionicons name="close" size={14} color="white" />
                        </Pressable>
                      </View>
                    ))}
                    <Pressable
                      onPress={handlePickProductImage}
                      className="w-20 h-20 bg-[#0A0A0F] border-2 border-dashed border-gray-600 rounded-xl items-center justify-center"
                    >
                      <Ionicons name="add" size={24} color="#6B7280" />
                    </Pressable>
                  </View>

                  {/* Tags */}
                  <TextInput
                    placeholder="Tags (comma separated)"
                    placeholderTextColor="#6B7280"
                    value={productForm.tags}
                    onChangeText={(text) => setProductForm({ ...productForm, tags: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />

                  {/* Feature Toggle */}
                  <Pressable
                    onPress={() => setProductForm({ ...productForm, isFeatured: !productForm.isFeatured })}
                    className="flex-row items-center mb-6"
                  >
                    <View
                      className={`w-6 h-6 rounded border mr-3 items-center justify-center ${
                        productForm.isFeatured ? "bg-yellow-500 border-yellow-500" : "border-gray-600"
                      }`}
                    >
                      {productForm.isFeatured && <Ionicons name="checkmark" size={16} color="white" />}
                    </View>
                    <Text className="text-white">Feature this product</Text>
                  </Pressable>

                  {/* Price Preview */}
                  {productForm.basePrice && (
                    <View className="bg-[#0A0A0F] p-4 rounded-xl mb-4 border border-gray-800">
                      <Text className="text-gray-400 text-sm mb-2">Price Preview</Text>
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-gray-400">Base Price</Text>
                        <Text className="text-white">${parseFloat(productForm.basePrice || "0").toFixed(2)}</Text>
                      </View>
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-gray-400">Markup</Text>
                        <Text className="text-white">
                          ${(productForm.markupPrice ? parseFloat(productForm.markupPrice) : parseFloat(productForm.basePrice || "0") * 0.3).toFixed(2)}
                        </Text>
                      </View>
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-gray-400">Platform Fee (12%)</Text>
                        <Text className="text-white">${(parseFloat(productForm.basePrice || "0") * 0.12).toFixed(2)}</Text>
                      </View>
                      <View className="flex-row justify-between pt-2 border-t border-gray-700">
                        <Text className="text-white font-bold">Final Price</Text>
                        <Text className="text-green-400 font-bold">
                          ${(
                            parseFloat(productForm.basePrice || "0") +
                            (productForm.markupPrice ? parseFloat(productForm.markupPrice) : parseFloat(productForm.basePrice || "0") * 0.3) +
                            parseFloat(productForm.basePrice || "0") * 0.12
                          ).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  )}

                  <Pressable
                    onPress={handleCreateProduct}
                    className="bg-green-600 py-4 rounded-xl mb-4"
                  >
                    <Text className="text-white text-center font-bold">Create Product</Text>
                  </Pressable>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};
