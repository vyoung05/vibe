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
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../state/authStore";
import { useMerchStore } from "../state/merchStore";
import type { MerchProduct, Promotion, MerchCategory, PromotionDuration } from "../types/printify";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES: { label: string; value: MerchCategory }[] = [
  { label: "Apparel", value: "apparel" },
  { label: "Accessories", value: "accessories" },
  { label: "Home Decor", value: "home_decor" },
  { label: "Stickers", value: "stickers" },
  { label: "Posters", value: "posters" },
  { label: "Mugs", value: "mugs" },
  { label: "Phone Cases", value: "phone_cases" },
  { label: "Bags", value: "bags" },
  { label: "Hats", value: "hats" },
  { label: "Other", value: "other" },
];

const PROMOTION_DURATIONS: { label: string; value: PromotionDuration }[] = [
  { label: "30 Minutes", value: "30_minutes" },
  { label: "1 Hour", value: "1_hour" },
  { label: "2 Hours", value: "2_hours" },
  { label: "6 Hours", value: "6_hours" },
  { label: "12 Hours", value: "12_hours" },
  { label: "24 Hours", value: "24_hours" },
  { label: "3 Days", value: "3_days" },
  { label: "7 Days", value: "7_days" },
  { label: "14 Days", value: "14_days" },
  { label: "30 Days", value: "30_days" },
];

export const StreamerMerchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);

  // Merch store state
  const products = useMerchStore((s) => s.products);
  const getStreamerProducts = useMerchStore((s) => s.getStreamerProducts);
  const getStreamerVisiblePromotions = useMerchStore((s) => s.getStreamerVisiblePromotions);
  const isStreamerInTrial = useMerchStore((s) => s.isStreamerInTrial);
  const getStreamerFeeStatus = useMerchStore((s) => s.getStreamerFeeStatus);
  const getStreamerCurrentFee = useMerchStore((s) => s.getStreamerCurrentFee);
  const getPrintifyConnection = useMerchStore((s) => s.getPrintifyConnection);
  const addPrintifyConnection = useMerchStore((s) => s.addPrintifyConnection);
  const validateAndConnectPrintful = useMerchStore((s) => s.validateAndConnectPrintful);
  const syncPrintfulProducts = useMerchStore((s) => s.syncPrintfulProducts);
  const validateAndConnectPrintify = useMerchStore((s) => s.validateAndConnectPrintify);
  const selectPrintifyShop = useMerchStore((s) => s.selectPrintifyShop);
  const syncPrintifyProducts = useMerchStore((s) => s.syncPrintifyProducts);
  const initializeStreamerFee = useMerchStore((s) => s.initializeStreamerFee);
  const seedSampleMerchData = useMerchStore((s) => s.seedSampleMerchData);
  const addProduct = useMerchStore((s) => s.addProduct);
  const updateProduct = useMerchStore((s) => s.updateProduct);
  const deleteProduct = useMerchStore((s) => s.deleteProduct);
  const addPromotion = useMerchStore((s) => s.addPromotion);
  const createQuickPromotion = useMerchStore((s) => s.createQuickPromotion);
  const connectProductsToStreamer = useMerchStore((s) => s.connectProductsToStreamer);

  const [activeTab, setActiveTab] = useState<"products" | "promotions" | "earnings">("products");
  const [showConnectPrintify, setShowConnectPrintify] = useState(false);
  const [printifyApiKey, setPrintifyApiKey] = useState("");
  const [printifyShopId, setPrintifyShopId] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [availableShops, setAvailableShops] = useState<Array<{ id: number; title: string }>>([]);
  const [showShopSelector, setShowShopSelector] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"printify" | "printful">("printify");

  // Product modals
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MerchProduct | null>(null);

  // Product form state
  const [productTitle, setProductTitle] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategory, setProductCategory] = useState<MerchCategory>("apparel");
  const [productBasePrice, setProductBasePrice] = useState("");
  const [productMarkup, setProductMarkup] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [productIsFeatured, setProductIsFeatured] = useState(false);

  // Promotion boost modal
  const [showBoostPromo, setShowBoostPromo] = useState(false);
  const [promoName, setPromoName] = useState("");
  const [promoValue, setPromoValue] = useState("");
  const [promoDuration, setPromoDuration] = useState<PromotionDuration>("24_hours");
  const [promoType, setPromoType] = useState<"percentage_off" | "fixed_amount_off">("percentage_off");

  // Streamer ID - use auth user ID
  const streamerId = user?.id || "streamer-1";
  const streamerName = user?.username || "Streamer";

  // Initialize data on mount
  useEffect(() => {
    seedSampleMerchData();
    initializeStreamerFee(streamerId);
    // Connect sample products to the authenticated streamer
    connectProductsToStreamer(streamerId, streamerName);
  }, []);

  const streamerProducts = getStreamerProducts(streamerId);
  const visiblePromotions = getStreamerVisiblePromotions();
  const printifyConnection = getPrintifyConnection(streamerId);
  const feeStatus = getStreamerFeeStatus(streamerId);
  const currentFee = getStreamerCurrentFee(streamerId);
  const inTrial = isStreamerInTrial(streamerId);

  // Calculate earnings
  const totalRevenue = streamerProducts.reduce((sum, p) => sum + p.revenue, 0);
  const totalUnitsSold = streamerProducts.reduce((sum, p) => sum + p.unitsSold, 0);
  const platformFees = inTrial ? 0 : totalRevenue * (currentFee / 100);
  const netEarnings = totalRevenue - platformFees;

  const handleConnectPrintify = async () => {
    if (!printifyApiKey) {
      Alert.alert("Error", "Please enter your API token");
      return;
    }

    setIsConnecting(true);

    try {
      if (selectedProvider === "printify") {
        // Validate Printify token and get shops
        const result = await validateAndConnectPrintify(streamerId, printifyApiKey);

        if (result.success && result.shops && result.shops.length > 0) {
          setAvailableShops(result.shops);
          if (result.shops.length === 1) {
            // Auto-select if only one shop
            selectPrintifyShop(streamerId, result.shops[0].id, result.shops[0].title);
            Alert.alert("Success", `Connected to Printify shop: ${result.shops[0].title}`);
            setShowConnectPrintify(false);
            setPrintifyApiKey("");
          } else {
            // Show shop selector
            setShowShopSelector(true);
          }
        } else {
          Alert.alert("Connection Failed", result.error || "Failed to connect to Printify. Please check your API token.");
        }
      } else {
        // Legacy Printful connection
        const result = await validateAndConnectPrintful(streamerId, printifyApiKey, printifyShopId || undefined);

        if (result.success) {
          Alert.alert("Success", "Printful connected successfully! You can now sync your products.");
          setShowConnectPrintify(false);
          setPrintifyApiKey("");
          setPrintifyShopId("");
        } else {
          Alert.alert("Connection Failed", result.error || "Failed to connect to Printful. Please check your API token.");
        }
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred while connecting");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSelectShop = (shopId: number, shopName: string) => {
    selectPrintifyShop(streamerId, shopId, shopName);
    setShowShopSelector(false);
    setShowConnectPrintify(false);
    setPrintifyApiKey("");
    setAvailableShops([]);
    Alert.alert("Success", `Connected to Printify shop: ${shopName}`);
  };

  const handleSyncProducts = async () => {
    setIsSyncing(true);

    try {
      const connection = printifyConnection;
      
      if (connection?.provider === "printify" || connection?.printifyApiToken) {
        // Sync from Printify
        const result = await syncPrintifyProducts(streamerId, streamerName, user?.avatar);

        if (result.success) {
          Alert.alert(
            "Sync Complete",
            `Successfully synced ${result.syncedCount} product${result.syncedCount === 1 ? "" : "s"} from Printify!`
          );
        } else {
          Alert.alert("Sync Failed", result.error || "Failed to sync products from Printify");
        }
      } else {
        // Legacy Printful sync
        const result = await syncPrintfulProducts(streamerId, streamerName);

        if (result.success) {
          Alert.alert(
            "Sync Complete",
            `Successfully synced ${result.syncedCount} product${result.syncedCount === 1 ? "" : "s"} from Printful!`
          );
        } else {
          Alert.alert("Sync Failed", result.error || "Failed to sync products from Printful");
        }
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred while syncing products");
    } finally {
      setIsSyncing(false);
    }
  };

  const resetProductForm = () => {
    setProductTitle("");
    setProductDescription("");
    setProductCategory("apparel");
    setProductBasePrice("");
    setProductMarkup("");
    setProductImageUrl("");
    setProductIsFeatured(false);
  };

  const handleAddProduct = () => {
    if (!productTitle || !productBasePrice || !productMarkup) return;

    const basePrice = parseFloat(productBasePrice);
    const markup = parseFloat(productMarkup);
    const platformFeeAmount = (basePrice + markup) * (currentFee / 100);
    const finalPrice = basePrice + markup + (inTrial ? 0 : platformFeeAmount);

    addProduct({
      streamerId,
      streamerName,
      printifyProductId: "custom-" + Date.now(),
      title: productTitle,
      description: productDescription || "No description provided",
      category: productCategory,
      basePrice,
      markupPrice: markup,
      platformFee: inTrial ? 0 : platformFeeAmount,
      finalPrice,
      images: productImageUrl ? [productImageUrl] : ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"],
      variants: [
        { id: "v-" + Date.now(), printifyVariantId: 1, title: "Default", additionalPrice: 0, stockStatus: "in_stock", isAvailable: true },
      ],
      isActive: true,
      isFeatured: productIsFeatured,
      tags: [productCategory],
    });

    setShowAddProduct(false);
    resetProductForm();
  };

  const handleEditProduct = () => {
    if (!selectedProduct || !productTitle || !productBasePrice || !productMarkup) return;

    const basePrice = parseFloat(productBasePrice);
    const markup = parseFloat(productMarkup);
    const platformFeeAmount = (basePrice + markup) * (currentFee / 100);
    const finalPrice = basePrice + markup + (inTrial ? 0 : platformFeeAmount);

    updateProduct(selectedProduct.id, {
      title: productTitle,
      description: productDescription,
      category: productCategory,
      basePrice,
      markupPrice: markup,
      platformFee: inTrial ? 0 : platformFeeAmount,
      finalPrice,
      images: productImageUrl ? [productImageUrl] : selectedProduct.images,
      isFeatured: productIsFeatured,
    });

    setShowEditProduct(false);
    setSelectedProduct(null);
    resetProductForm();
  };

  const handleDeleteProduct = () => {
    if (!selectedProduct) return;
    deleteProduct(selectedProduct.id);
    setShowDeleteConfirm(false);
    setSelectedProduct(null);
  };

  const openEditModal = (product: MerchProduct) => {
    setSelectedProduct(product);
    setProductTitle(product.title);
    setProductDescription(product.description);
    setProductCategory(product.category);
    setProductBasePrice(product.basePrice.toString());
    setProductMarkup(product.markupPrice.toString());
    setProductImageUrl(product.images[0] || "");
    setProductIsFeatured(product.isFeatured);
    setShowEditProduct(true);
  };

  const openDeleteConfirm = (product: MerchProduct) => {
    setSelectedProduct(product);
    setShowDeleteConfirm(true);
  };

  const handleCreateBoostPromo = () => {
    if (!promoName || !promoValue) return;

    createQuickPromotion(
      promoName,
      promoType,
      parseFloat(promoValue),
      promoDuration,
      "all"
    );

    setShowBoostPromo(false);
    setPromoName("");
    setPromoValue("");
    setPromoDuration("24_hours");
    setPromoType("percentage_off");
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getTrialDaysRemaining = () => {
    if (!feeStatus?.trialEndDate) return 0;
    const end = new Date(feeStatus.trialEndDate).getTime();
    const now = Date.now();
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
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
              <Text className="text-white text-xl font-bold">My Merch Store</Text>
              <Text className="text-gray-400 text-sm">Manage your products & earnings</Text>
            </View>
          </View>
          {printifyConnection?.isConnected ? (
            <View className="bg-green-600/20 px-3 py-1 rounded-full flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              <Text className="text-green-400 text-xs font-bold">CONNECTED</Text>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowConnectPrintify(true)}
              className="bg-purple-600 px-3 py-1 rounded-full"
            >
              <Text className="text-white text-xs font-bold">CONNECT</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Trial Banner */}
      {inTrial && (
        <View className="mx-6 mt-4 bg-gradient-to-r from-green-900/50 to-emerald-900/50 p-4 rounded-xl border border-green-500/30">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="gift" size={24} color="#10B981" />
              <View className="ml-3">
                <Text className="text-green-400 font-bold">Fee-Free Trial Active</Text>
                <Text className="text-green-300/70 text-sm">
                  0% platform fees for {getTrialDaysRemaining()} more days
                </Text>
              </View>
            </View>
            <View className="bg-green-600/30 px-3 py-1 rounded-full">
              <Text className="text-green-400 font-bold text-lg">0%</Text>
            </View>
          </View>
        </View>
      )}

      {/* Active Promotions Banner */}
      {visiblePromotions.length > 0 && (
        <View className="mx-6 mt-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="megaphone" size={16} color="#A855F7" />
            <Text className="text-purple-400 text-sm font-bold ml-2">Active Promotions</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {visiblePromotions.map((promo) => (
              <View
                key={promo.id}
                className="bg-purple-900/30 border border-purple-500/30 p-3 rounded-xl mr-3"
                style={{ minWidth: 200 }}
              >
                <Text className="text-white font-bold" numberOfLines={1}>{promo.name}</Text>
                <Text className="text-purple-300 text-sm">
                  {promo.type === "percentage_off" ? `${promo.value}% OFF` : `$${promo.value} OFF`}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                  <Text className="text-gray-400 text-xs ml-1">
                    {getTimeRemaining(promo.endDate)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Tabs */}
      <View className="flex-row border-b border-gray-800 mt-4">
        {(["products", "promotions", "earnings"] as const).map((tab) => (
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
        {/* Products Tab */}
        {activeTab === "products" && (
          <View className="p-6">
            {/* Add Product Button */}
            <Pressable
              onPress={() => setShowAddProduct(true)}
              className="bg-purple-600 flex-row items-center justify-center py-4 rounded-xl mb-6"
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text className="text-white font-bold ml-2">Add New Product</Text>
            </Pressable>

            {!printifyConnection?.isConnected ? (
              <View className="bg-[#151520] p-6 rounded-xl border border-gray-800 mb-6 items-center">
                <Ionicons name="cloud-upload-outline" size={48} color="#6B7280" />
                <Text className="text-white font-bold mt-4">Connect Print-on-Demand Provider</Text>
                <Text className="text-gray-400 text-center mt-2 mb-4">
                  Connect Printify or Printful to automatically sync products and fulfill orders
                </Text>
                <Pressable
                  onPress={() => setShowConnectPrintify(true)}
                  className="bg-purple-600 px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-bold">Connect Provider</Text>
                </Pressable>
              </View>
            ) : (
              <View className="bg-[#151520] p-4 rounded-xl border border-green-800 mb-6">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    <View className="ml-3 flex-1">
                      <Text className="text-white font-bold">
                        {printifyConnection?.provider === "printify" ? "Printify" : "Printful"} Connected
                      </Text>
                      <Text className="text-gray-400 text-sm">
                        {printifyConnection.lastSyncAt
                          ? `Last synced: ${new Date(printifyConnection.lastSyncAt).toLocaleDateString()}`
                          : "Ready to sync products"}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={handleSyncProducts}
                    disabled={isSyncing}
                    className="bg-purple-600 px-4 py-2 rounded-lg ml-2"
                  >
                    {isSyncing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View className="flex-row items-center">
                        <Ionicons name="sync" size={16} color="#FFFFFF" />
                        <Text className="text-white font-bold ml-1 text-sm">Sync</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {/* Products Grid */}
            {streamerProducts.length > 0 ? (
              <View className="flex-row flex-wrap -mx-2">
                {streamerProducts.map((product) => (
                  <View key={product.id} className="w-1/2 px-2 mb-4">
                    <View className="bg-[#151520] rounded-xl border border-gray-800 overflow-hidden">
                      {product.images[0] && (
                        <Image
                          source={{ uri: product.images[0] }}
                          style={{ width: "100%", height: 140 }}
                          contentFit="cover"
                        />
                      )}
                      <View className="p-3">
                        <Text className="text-white font-semibold" numberOfLines={1}>
                          {product.title}
                        </Text>
                        <Text className="text-green-400 font-bold mt-1">
                          ${product.finalPrice.toFixed(2)}
                        </Text>
                        <View className="flex-row items-center justify-between mt-2">
                          <Text className="text-gray-500 text-xs">{product.unitsSold} sold</Text>
                          {product.isFeatured && (
                            <View className="bg-yellow-600/20 px-2 py-0.5 rounded">
                              <Text className="text-yellow-400 text-xs">Featured</Text>
                            </View>
                          )}
                        </View>

                        {/* Action Buttons */}
                        <View className="flex-row mt-3 border-t border-gray-700 pt-3">
                          <Pressable
                            onPress={() => openEditModal(product)}
                            className="flex-1 flex-row items-center justify-center py-2 bg-blue-600/20 rounded-lg mr-2"
                          >
                            <Ionicons name="pencil" size={14} color="#60A5FA" />
                            <Text className="text-blue-400 text-xs font-semibold ml-1">Edit</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => openDeleteConfirm(product)}
                            className="flex-1 flex-row items-center justify-center py-2 bg-red-600/20 rounded-lg"
                          >
                            <Ionicons name="trash" size={14} color="#F87171" />
                            <Text className="text-red-400 text-xs font-semibold ml-1">Delete</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="items-center py-12">
                <Ionicons name="shirt-outline" size={64} color="#4B5563" />
                <Text className="text-gray-400 mt-4">No products yet</Text>
                <Text className="text-gray-600 text-sm text-center mt-2">
                  Add your first product to start selling
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Promotions Tab */}
        {activeTab === "promotions" && (
          <View className="p-6">
            {/* Create Boost Button */}
            <Pressable
              onPress={() => setShowBoostPromo(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 flex-row items-center justify-center py-4 rounded-xl mb-6"
              style={{ backgroundColor: "#9333EA" }}
            >
              <Ionicons name="rocket" size={24} color="white" />
              <Text className="text-white font-bold ml-2">Boost with Promotion</Text>
            </Pressable>

            <Text className="text-white font-bold mb-4">Available Promotions</Text>
            <Text className="text-gray-400 text-sm mb-6">
              These are special deals you can opt into. Your fans will see these discounts when purchasing your merch.
            </Text>

            {visiblePromotions.length > 0 ? (
              visiblePromotions.map((promo) => (
                <View
                  key={promo.id}
                  className="bg-[#151520] p-4 rounded-xl border border-gray-800 mb-4"
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-white font-bold">{promo.name}</Text>
                      <Text className="text-gray-400 text-sm">{promo.description}</Text>
                    </View>
                    <View className="bg-green-600/20 px-3 py-1 rounded-full">
                      <Text className="text-green-400 font-bold">
                        {promo.type === "percentage_off"
                          ? `${promo.value}% OFF`
                          : promo.type === "fixed_amount_off"
                          ? `$${promo.value} OFF`
                          : "FREE SHIP"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                      <Text className="text-gray-400 text-sm ml-1">
                        Ends in {getTimeRemaining(promo.endDate)}
                      </Text>
                    </View>
                    {promo.code && (
                      <View className="bg-gray-700 px-3 py-1 rounded">
                        <Text className="text-white text-sm font-mono">{promo.code}</Text>
                      </View>
                    )}
                  </View>

                  {promo.targetAudience !== "all" && (
                    <View className="mt-3 pt-3 border-t border-gray-800">
                      <Text className="text-purple-400 text-xs">
                        Available to: {promo.targetAudience.replace(/_/g, " ")}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View className="items-center py-12">
                <Ionicons name="pricetag-outline" size={64} color="#4B5563" />
                <Text className="text-gray-400 mt-4">No active promotions</Text>
                <Text className="text-gray-600 text-sm text-center mt-2">
                  Create a boost promotion to attract more customers
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Earnings Tab */}
        {activeTab === "earnings" && (
          <View className="p-6">
            {/* Earnings Overview */}
            <View className="bg-[#151520] p-6 rounded-xl border border-gray-800 mb-6">
              <Text className="text-gray-400 text-sm">Total Earnings</Text>
              <Text className="text-white text-4xl font-bold mt-1">
                ${netEarnings.toFixed(2)}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                From {totalUnitsSold} items sold
              </Text>
            </View>

            {/* Breakdown */}
            <View className="bg-[#151520] p-4 rounded-xl border border-gray-800 mb-6">
              <Text className="text-white font-bold mb-4">Breakdown</Text>

              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-400">Gross Revenue</Text>
                <Text className="text-white font-semibold">${totalRevenue.toFixed(2)}</Text>
              </View>

              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Text className="text-gray-400">Platform Fee</Text>
                  {inTrial && (
                    <View className="bg-green-600/20 px-2 py-0.5 rounded ml-2">
                      <Text className="text-green-400 text-xs">TRIAL</Text>
                    </View>
                  )}
                </View>
                <Text className={inTrial ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
                  {inTrial ? "$0.00" : `-$${platformFees.toFixed(2)}`}
                </Text>
              </View>

              <View className="border-t border-gray-700 pt-3 mt-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white font-bold">Net Earnings</Text>
                  <Text className="text-green-400 font-bold text-lg">${netEarnings.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* Fee Status */}
            <View className="bg-[#151520] p-4 rounded-xl border border-gray-800">
              <Text className="text-white font-bold mb-3">Your Fee Status</Text>

              {inTrial ? (
                <View className="bg-green-900/20 p-4 rounded-xl border border-green-500/20">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-green-400 font-bold">Fee-Free Trial</Text>
                    <Text className="text-green-400 font-bold text-2xl">0%</Text>
                  </View>
                  <Text className="text-green-300/70 text-sm">
                    {getTrialDaysRemaining()} days remaining in your trial period
                  </Text>
                  <View className="mt-3 bg-green-900/30 p-3 rounded-lg">
                    <Text className="text-green-300 text-xs">
                      You have saved ${platformFees.toFixed(2)} in platform fees during your trial!
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="bg-purple-900/20 p-4 rounded-xl border border-purple-500/20">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-purple-400 font-bold">Standard Rate</Text>
                    <Text className="text-purple-400 font-bold text-2xl">{currentFee}%</Text>
                  </View>
                  <Text className="text-purple-300/70 text-sm">
                    This is 20% lower than TikTok and Instagram rates
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Connect Print Provider Modal */}
      <Modal visible={showConnectPrintify} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[90%]">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-xl font-bold">Connect Print Provider</Text>
                  <Pressable onPress={() => { setShowConnectPrintify(false); setAvailableShops([]); }}>
                    <Ionicons name="close" size={28} color="white" />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Provider Selection */}
                  <Text className="text-gray-400 text-sm mb-2">Choose your print provider:</Text>
                  <View className="flex-row mb-4">
                    <Pressable
                      onPress={() => setSelectedProvider("printify")}
                      className={`flex-1 p-4 rounded-xl mr-2 border-2 ${
                        selectedProvider === "printify" 
                          ? "bg-green-900/30 border-green-500" 
                          : "bg-[#0A0A0F] border-gray-700"
                      }`}
                    >
                      <Text className={`font-bold text-center ${selectedProvider === "printify" ? "text-green-400" : "text-white"}`}>
                        Printify
                      </Text>
                      <Text className="text-gray-400 text-xs text-center mt-1">Lower cost</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSelectedProvider("printful")}
                      className={`flex-1 p-4 rounded-xl ml-2 border-2 ${
                        selectedProvider === "printful" 
                          ? "bg-red-900/30 border-red-500" 
                          : "bg-[#0A0A0F] border-gray-700"
                      }`}
                    >
                      <Text className={`font-bold text-center ${selectedProvider === "printful" ? "text-red-400" : "text-white"}`}>
                        Printful
                      </Text>
                      <Text className="text-gray-400 text-xs text-center mt-1">Premium quality</Text>
                    </Pressable>
                  </View>

                  {/* Instructions based on selected provider */}
                  {selectedProvider === "printify" ? (
                    <View className="bg-green-900/20 p-4 rounded-xl border border-green-500/20 mb-4">
                      <Text className="text-green-400 font-bold mb-2">📋 How to get your Printify API Token:</Text>
                      <Text className="text-green-300/70 text-sm">
                        1. Go to printify.com and log in{"\n"}
                        2. Click your profile → Connections{"\n"}
                        3. Scroll to "Personal Access Tokens"{"\n"}
                        4. Click "Generate new token"{"\n"}
                        5. Name it (e.g., "DDNS App"){"\n"}
                        6. Copy the token and paste below
                      </Text>
                    </View>
                  ) : (
                    <View className="bg-red-900/20 p-4 rounded-xl border border-red-500/20 mb-4">
                      <Text className="text-red-400 font-bold mb-2">📋 How to get your Printful API Token:</Text>
                      <Text className="text-red-300/70 text-sm">
                        1. Go to printful.com and log in{"\n"}
                        2. Go to Settings → Stores{"\n"}
                        3. Create a "Manual order / API" store{"\n"}
                        4. Go to Settings → API{"\n"}
                        5. Generate an OAuth token{"\n"}
                        6. Copy the token and paste below
                      </Text>
                    </View>
                  )}

                  <TextInput
                    placeholder={`${selectedProvider === "printify" ? "Printify" : "Printful"} API Token`}
                    placeholderTextColor="#6B7280"
                    value={printifyApiKey}
                    onChangeText={setPrintifyApiKey}
                    secureTextEntry
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />

                  {selectedProvider === "printful" && (
                    <TextInput
                      placeholder="Store ID (optional)"
                      placeholderTextColor="#6B7280"
                      value={printifyShopId}
                      onChangeText={setPrintifyShopId}
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                    />
                  )}

                  {/* Shop selector for Printify */}
                  {availableShops.length > 0 && (
                    <View className="mb-4">
                      <Text className="text-white font-bold mb-2">Select your shop:</Text>
                      {availableShops.map((shop) => (
                        <Pressable
                          key={shop.id}
                          onPress={() => handleSelectShop(shop.id, shop.title)}
                          className="bg-[#0A0A0F] p-4 rounded-xl mb-2 flex-row items-center justify-between border border-gray-700"
                        >
                          <View className="flex-row items-center">
                            <Ionicons name="storefront" size={20} color="#A855F7" />
                            <Text className="text-white font-semibold ml-3">{shop.title}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                        </Pressable>
                      ))}
                    </View>
                  )}

                  <Pressable
                    onPress={handleConnectPrintify}
                    disabled={isConnecting || !printifyApiKey}
                    className={`py-4 rounded-xl mb-4 ${
                      isConnecting || !printifyApiKey ? "bg-gray-700" : "bg-purple-600"
                    }`}
                  >
                    {isConnecting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="text-white text-center font-bold">
                        {availableShops.length > 0 ? "Select a Shop Above" : "Connect Account"}
                      </Text>
                    )}
                  </Pressable>

                  {/* Help link */}
                  <View className="items-center pb-4">
                    <Text className="text-gray-500 text-xs text-center">
                      Need help? Visit {selectedProvider === "printify" ? "printify.com" : "printful.com"} for detailed setup guides
                    </Text>
                  </View>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Product Modal */}
      <Modal visible={showAddProduct} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[90%]">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white text-xl font-bold">Add New Product</Text>
                  <Pressable onPress={() => { setShowAddProduct(false); resetProductForm(); }}>
                    <Ionicons name="close" size={28} color="white" />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <TextInput
                    placeholder="Product Title"
                    placeholderTextColor="#6B7280"
                    value={productTitle}
                    onChangeText={setProductTitle}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />

                  <TextInput
                    placeholder="Description"
                    placeholderTextColor="#6B7280"
                    value={productDescription}
                    onChangeText={setProductDescription}
                    multiline
                    numberOfLines={3}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                    style={{ minHeight: 80, textAlignVertical: "top" }}
                  />

                  <Text className="text-gray-400 text-sm mb-2">Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    {CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat.value}
                        onPress={() => setProductCategory(cat.value)}
                        className={`px-4 py-2 rounded-full mr-2 ${
                          productCategory === cat.value ? "bg-purple-600" : "bg-gray-700"
                        }`}
                      >
                        <Text className="text-white text-sm">{cat.label}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <View className="flex-row mb-4">
                    <View className="flex-1 mr-2">
                      <TextInput
                        placeholder="Base Price ($)"
                        placeholderTextColor="#6B7280"
                        value={productBasePrice}
                        onChangeText={setProductBasePrice}
                        keyboardType="decimal-pad"
                        className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                      />
                    </View>
                    <View className="flex-1 ml-2">
                      <TextInput
                        placeholder="Your Markup ($)"
                        placeholderTextColor="#6B7280"
                        value={productMarkup}
                        onChangeText={setProductMarkup}
                        keyboardType="decimal-pad"
                        className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                      />
                    </View>
                  </View>

                  <TextInput
                    placeholder="Image URL (optional)"
                    placeholderTextColor="#6B7280"
                    value={productImageUrl}
                    onChangeText={setProductImageUrl}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />

                  <Pressable
                    onPress={() => setProductIsFeatured(!productIsFeatured)}
                    className="flex-row items-center mb-6"
                  >
                    <View className={`w-6 h-6 rounded-md border-2 mr-3 items-center justify-center ${
                      productIsFeatured ? "bg-purple-600 border-purple-600" : "border-gray-600"
                    }`}>
                      {productIsFeatured && <Ionicons name="checkmark" size={16} color="white" />}
                    </View>
                    <Text className="text-white">Mark as Featured</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleAddProduct}
                    className="bg-purple-600 py-4 rounded-xl mb-6"
                  >
                    <Text className="text-white text-center font-bold">Create Product</Text>
                  </Pressable>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Product Modal */}
      <Modal visible={showEditProduct} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[90%]">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white text-xl font-bold">Edit Product</Text>
                  <Pressable onPress={() => { setShowEditProduct(false); setSelectedProduct(null); resetProductForm(); }}>
                    <Ionicons name="close" size={28} color="white" />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <TextInput
                    placeholder="Product Title"
                    placeholderTextColor="#6B7280"
                    value={productTitle}
                    onChangeText={setProductTitle}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />

                  <TextInput
                    placeholder="Description"
                    placeholderTextColor="#6B7280"
                    value={productDescription}
                    onChangeText={setProductDescription}
                    multiline
                    numberOfLines={3}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                    style={{ minHeight: 80, textAlignVertical: "top" }}
                  />

                  <Text className="text-gray-400 text-sm mb-2">Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    {CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat.value}
                        onPress={() => setProductCategory(cat.value)}
                        className={`px-4 py-2 rounded-full mr-2 ${
                          productCategory === cat.value ? "bg-purple-600" : "bg-gray-700"
                        }`}
                      >
                        <Text className="text-white text-sm">{cat.label}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <View className="flex-row mb-4">
                    <View className="flex-1 mr-2">
                      <TextInput
                        placeholder="Base Price ($)"
                        placeholderTextColor="#6B7280"
                        value={productBasePrice}
                        onChangeText={setProductBasePrice}
                        keyboardType="decimal-pad"
                        className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                      />
                    </View>
                    <View className="flex-1 ml-2">
                      <TextInput
                        placeholder="Your Markup ($)"
                        placeholderTextColor="#6B7280"
                        value={productMarkup}
                        onChangeText={setProductMarkup}
                        keyboardType="decimal-pad"
                        className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                      />
                    </View>
                  </View>

                  <TextInput
                    placeholder="Image URL"
                    placeholderTextColor="#6B7280"
                    value={productImageUrl}
                    onChangeText={setProductImageUrl}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />

                  <Pressable
                    onPress={() => setProductIsFeatured(!productIsFeatured)}
                    className="flex-row items-center mb-6"
                  >
                    <View className={`w-6 h-6 rounded-md border-2 mr-3 items-center justify-center ${
                      productIsFeatured ? "bg-purple-600 border-purple-600" : "border-gray-600"
                    }`}>
                      {productIsFeatured && <Ionicons name="checkmark" size={16} color="white" />}
                    </View>
                    <Text className="text-white">Mark as Featured</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleEditProduct}
                    className="bg-purple-600 py-4 rounded-xl mb-6"
                  >
                    <Text className="text-white text-center font-bold">Save Changes</Text>
                  </Pressable>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} animationType="fade" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-[#151520] rounded-2xl p-6 w-full">
            <View className="items-center mb-4">
              <View className="bg-red-600/20 p-4 rounded-full mb-4">
                <Ionicons name="trash" size={32} color="#F87171" />
              </View>
              <Text className="text-white text-xl font-bold">Delete Product?</Text>
              <Text className="text-gray-400 text-center mt-2">
                Are you sure you want to delete &quot;{selectedProduct?.title}&quot;? This action cannot be undone.
              </Text>
            </View>

            <View className="flex-row mt-4">
              <Pressable
                onPress={() => { setShowDeleteConfirm(false); setSelectedProduct(null); }}
                className="flex-1 py-3 rounded-xl bg-gray-700 mr-2"
              >
                <Text className="text-white text-center font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteProduct}
                className="flex-1 py-3 rounded-xl bg-red-600 ml-2"
              >
                <Text className="text-white text-center font-semibold">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Boost Promotion Modal */}
      <Modal visible={showBoostPromo} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-[#151520] rounded-t-3xl p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white text-xl font-bold">Create Boost Promotion</Text>
                  <Pressable onPress={() => setShowBoostPromo(false)}>
                    <Ionicons name="close" size={28} color="white" />
                  </Pressable>
                </View>

                <View className="bg-purple-900/20 p-4 rounded-xl border border-purple-500/20 mb-6">
                  <View className="flex-row items-center">
                    <Ionicons name="rocket" size={24} color="#A855F7" />
                    <Text className="text-purple-400 font-bold ml-2">Boost Your Sales</Text>
                  </View>
                  <Text className="text-purple-300/70 text-sm mt-2">
                    Create a limited-time promotion to attract more customers to your store.
                  </Text>
                </View>

                <TextInput
                  placeholder="Promotion Name"
                  placeholderTextColor="#6B7280"
                  value={promoName}
                  onChangeText={setPromoName}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                <Text className="text-gray-400 text-sm mb-2">Discount Type</Text>
                <View className="flex-row mb-4">
                  <Pressable
                    onPress={() => setPromoType("percentage_off")}
                    className={`flex-1 py-3 rounded-xl mr-2 ${
                      promoType === "percentage_off" ? "bg-purple-600" : "bg-gray-700"
                    }`}
                  >
                    <Text className="text-white text-center font-semibold">% Off</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPromoType("fixed_amount_off")}
                    className={`flex-1 py-3 rounded-xl ml-2 ${
                      promoType === "fixed_amount_off" ? "bg-purple-600" : "bg-gray-700"
                    }`}
                  >
                    <Text className="text-white text-center font-semibold">$ Off</Text>
                  </Pressable>
                </View>

                <TextInput
                  placeholder={promoType === "percentage_off" ? "Discount %" : "Discount Amount ($)"}
                  placeholderTextColor="#6B7280"
                  value={promoValue}
                  onChangeText={setPromoValue}
                  keyboardType="decimal-pad"
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                <Text className="text-gray-400 text-sm mb-2">Duration</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                  {PROMOTION_DURATIONS.map((dur) => (
                    <Pressable
                      key={dur.value}
                      onPress={() => setPromoDuration(dur.value)}
                      className={`px-4 py-2 rounded-full mr-2 ${
                        promoDuration === dur.value ? "bg-purple-600" : "bg-gray-700"
                      }`}
                    >
                      <Text className="text-white text-sm">{dur.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Pressable
                  onPress={handleCreateBoostPromo}
                  className="bg-purple-600 py-4 rounded-xl"
                >
                  <Text className="text-white text-center font-bold">Launch Promotion</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};
