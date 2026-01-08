import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { useMerchantStore } from "../state/merchantStore";
import type { MerchantItem, Merchant } from "../types/merchant";
import type { RootStackParamList } from "../navigation/RootNavigator";

interface ItemCardProps {
  item: MerchantItem;
  merchant?: Merchant;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AdminItemCard: React.FC<ItemCardProps> = ({
  item,
  merchant,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) => {
  return (
    <Pressable
      onLongPress={onSelect}
      onPress={onEdit}
      className={`bg-[#1A1A2E] rounded-xl overflow-hidden mb-3 border ${
        isSelected ? "border-[#8B5CF6]" : "border-[#2A2A3E]"
      }`}
    >
      <View className="flex-row p-3">
        {/* Selection Checkbox */}
        <Pressable onPress={onSelect} className="mr-3 justify-center">
          <View
            className={`w-5 h-5 rounded border-2 items-center justify-center ${
              isSelected ? "bg-[#8B5CF6] border-[#8B5CF6]" : "border-gray-500"
            }`}
          >
            {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </View>
        </Pressable>

        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: 60, height: 60, borderRadius: 8 }}
            contentFit="cover"
            transition={200}
          />
        )}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text className="text-white font-semibold flex-1" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-[#8B5CF6] font-bold">${item.price.toFixed(2)}</Text>
          </View>
          <Text className="text-gray-500 text-xs">{merchant?.name || "Unknown"}</Text>
          <View className="flex-row items-center mt-1">
            <View
              className={`px-2 py-0.5 rounded mr-2 ${
                item.isAvailable ? "bg-green-500/20" : "bg-red-500/20"
              }`}
            >
              <Text
                className={`text-xs ${
                  item.isAvailable ? "text-green-400" : "text-red-400"
                }`}
              >
                {item.isAvailable ? "Available" : "Unavailable"}
              </Text>
            </View>
            {item.isFeatured && (
              <View className="bg-yellow-500/20 px-2 py-0.5 rounded">
                <Text className="text-yellow-400 text-xs">Featured</Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center mt-1">
            <Text className="text-gray-500 text-xs">
              {item.unitsSold} sold • ${item.revenue.toFixed(0)} revenue
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

interface ItemFormData {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
  isFeatured: boolean;
}

export const AdminItemsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const merchants = useMerchantStore((s) => s.merchants);
  const items = useMerchantStore((s) => s.items);
  const getMerchant = useMerchantStore((s) => s.getMerchant);
  const addItem = useMerchantStore((s) => s.addItem);
  const updateItem = useMerchantStore((s) => s.updateItem);
  const deleteItem = useMerchantStore((s) => s.deleteItem);
  const bulkUpdateItems = useMerchantStore((s) => s.bulkUpdateItems);
  const bulkDeleteItems = useMerchantStore((s) => s.bulkDeleteItems);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MerchantItem | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "price" | "unitsSold">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [formData, setFormData] = useState<ItemFormData>({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    category: "",
    isAvailable: true,
    isFeatured: false,
  });
  const [formMerchantId, setFormMerchantId] = useState<string>("");

  // Bulk action form
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkDiscount, setBulkDiscount] = useState("");
  const [bulkAvailability, setBulkAvailability] = useState<boolean | null>(null);
  const [bulkFeatured, setBulkFeatured] = useState<boolean | null>(null);

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (selectedMerchantId) {
      result = result.filter((i) => i.merchantId === selectedMerchantId);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(query) ||
          i.category.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      const order = sortOrder === "desc" ? -1 : 1;
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name) * order;
        case "price":
          return (a.price - b.price) * order;
        case "unitsSold":
          return (a.unitsSold - b.unitsSold) * order;
        default:
          return 0;
      }
    });

    return result;
  }, [items, selectedMerchantId, searchQuery, sortBy, sortOrder]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      category: "",
      isAvailable: true,
      isFeatured: false,
    });
    setFormMerchantId("");
    setEditingItem(null);
  };

  const handleOpenModal = (item?: MerchantItem) => {
    if (item) {
      setEditingItem(item);
      setFormMerchantId(item.merchantId);
      setFormData({
        name: item.name,
        description: item.description || "",
        price: item.price.toString(),
        imageUrl: item.imageUrl || "",
        category: item.category,
        isAvailable: item.isAvailable,
        isFeatured: item.isFeatured,
      });
    } else {
      resetForm();
      if (selectedMerchantId) {
        setFormMerchantId(selectedMerchantId);
      }
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.price || !formMerchantId) return;

    const itemData = {
      merchantId: formMerchantId,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      price: parseFloat(formData.price),
      imageUrl: formData.imageUrl.trim() || undefined,
      category: formData.category.trim() || "General",
      optionGroups: editingItem?.optionGroups || [],
      images: editingItem?.images || [],
      isAvailable: formData.isAvailable,
      isFeatured: formData.isFeatured,
      sortOrder: editingItem?.sortOrder || items.length,
    };

    if (editingItem) {
      updateItem(editingItem.id, itemData);
    } else {
      addItem(itemData);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowModal(false);
    resetForm();
  };

  const handleSelectItem = (itemId: string) => {
    Haptics.selectionAsync();
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const handleBulkAction = (action: "update" | "delete") => {
    if (selectedItems.size === 0) return;

    const itemIds = Array.from(selectedItems);

    if (action === "delete") {
      bulkDeleteItems(itemIds);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      const updates: Partial<MerchantItem> = {};

      if (bulkPrice) {
        updates.price = parseFloat(bulkPrice);
      }

      if (bulkDiscount) {
        // Apply percentage discount to current prices
        const discountPercent = parseFloat(bulkDiscount) / 100;
        itemIds.forEach((id) => {
          const item = items.find((i) => i.id === id);
          if (item) {
            updateItem(id, { price: item.price * (1 - discountPercent) });
          }
        });
      } else if (Object.keys(updates).length > 0) {
        bulkUpdateItems(itemIds, updates);
      }

      if (bulkAvailability !== null) {
        bulkUpdateItems(itemIds, { isAvailable: bulkAvailability });
      }

      if (bulkFeatured !== null) {
        bulkUpdateItems(itemIds, { isFeatured: bulkFeatured });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setSelectedItems(new Set());
    setShowBulkModal(false);
    setBulkPrice("");
    setBulkDiscount("");
    setBulkAvailability(null);
    setBulkFeatured(null);
  };

  const topSellers = useMemo(() => {
    return [...items].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);
  }, [items]);

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      {/* Header */}
      <View
        className="px-4 py-4 border-b border-[#1F1F2E]"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Pressable onPress={() => navigation.goBack()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <Text className="text-white text-xl font-bold">Manage Items</Text>
          </View>
          <Pressable
            onPress={() => handleOpenModal()}
            className="bg-[#8B5CF6] rounded-full p-2"
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-[#1A1A2E] rounded-xl px-4 py-3 mb-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 text-white ml-3"
            placeholder="Search items..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Merchant Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Pressable
            onPress={() => setSelectedMerchantId(null)}
            className={`px-4 py-2 rounded-full mr-2 ${
              !selectedMerchantId ? "bg-[#8B5CF6]" : "bg-[#1A1A2E]"
            }`}
          >
            <Text className={!selectedMerchantId ? "text-white" : "text-gray-400"}>
              All
            </Text>
          </Pressable>
          {merchants.map((merchant) => (
            <Pressable
              key={merchant.id}
              onPress={() => setSelectedMerchantId(merchant.id)}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedMerchantId === merchant.id ? "bg-[#8B5CF6]" : "bg-[#1A1A2E]"
              }`}
            >
              <Text
                className={
                  selectedMerchantId === merchant.id ? "text-white" : "text-gray-400"
                }
              >
                {merchant.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <View className="bg-[#8B5CF6]/20 px-4 py-3 flex-row items-center justify-between">
          <Text className="text-[#8B5CF6] font-medium">
            {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""} selected
          </Text>
          <View className="flex-row">
            <Pressable
              onPress={() => setShowBulkModal(true)}
              className="bg-[#8B5CF6] px-4 py-2 rounded-lg mr-2"
            >
              <Text className="text-white font-medium">Edit</Text>
            </Pressable>
            <Pressable
              onPress={() => handleBulkAction("delete")}
              className="bg-red-500 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">Delete</Text>
            </Pressable>
          </View>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Row */}
        <View className="flex-row mb-4">
          <View className="flex-1 bg-[#1A1A2E] rounded-xl p-3 mr-2 border border-[#2A2A3E]">
            <Text className="text-gray-400 text-xs">Total Items</Text>
            <Text className="text-white text-xl font-bold">{items.length}</Text>
          </View>
          <View className="flex-1 bg-[#1A1A2E] rounded-xl p-3 mr-2 border border-[#2A2A3E]">
            <Text className="text-gray-400 text-xs">Available</Text>
            <Text className="text-green-400 text-xl font-bold">
              {items.filter((i) => i.isAvailable).length}
            </Text>
          </View>
          <View className="flex-1 bg-[#1A1A2E] rounded-xl p-3 border border-[#2A2A3E]">
            <Text className="text-gray-400 text-xs">Featured</Text>
            <Text className="text-yellow-400 text-xl font-bold">
              {items.filter((i) => i.isFeatured).length}
            </Text>
          </View>
        </View>

        {/* Top Sellers */}
        {topSellers.length > 0 && !selectedMerchantId && (
          <View className="mb-4">
            <Text className="text-white font-semibold mb-2">Top Sellers</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {topSellers.map((item, index) => (
                <View
                  key={item.id}
                  className="bg-[#1A1A2E] rounded-xl p-3 mr-3 border border-[#2A2A3E] w-32"
                >
                  <View className="flex-row items-center mb-2">
                    <View
                      className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${
                        index === 0
                          ? "bg-yellow-500"
                          : index === 1
                          ? "bg-gray-400"
                          : index === 2
                          ? "bg-amber-600"
                          : "bg-[#2A2A3E]"
                      }`}
                    >
                      <Text className="text-white text-xs font-bold">
                        #{index + 1}
                      </Text>
                    </View>
                    <Text className="text-gray-400 text-xs">
                      {item.unitsSold} sold
                    </Text>
                  </View>
                  <Text className="text-white text-sm font-medium" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="text-[#8B5CF6] text-sm font-bold">
                    ${item.revenue.toFixed(0)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Sort Controls */}
        <View className="flex-row items-center justify-between mb-3">
          <Pressable onPress={handleSelectAll} className="flex-row items-center">
            <View
              className={`w-5 h-5 rounded border-2 items-center justify-center mr-2 ${
                selectedItems.size === filteredItems.length && filteredItems.length > 0
                  ? "bg-[#8B5CF6] border-[#8B5CF6]"
                  : "border-gray-500"
              }`}
            >
              {selectedItems.size === filteredItems.length && filteredItems.length > 0 && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
            <Text className="text-gray-400 text-sm">Select All</Text>
          </Pressable>

          <View className="flex-row items-center">
            <Text className="text-gray-500 text-sm mr-2">Sort:</Text>
            <Pressable
              onPress={() => {
                if (sortBy === "name") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortBy("name");
                  setSortOrder("asc");
                }
              }}
              className={`px-3 py-1 rounded mr-1 ${
                sortBy === "name" ? "bg-[#8B5CF6]" : "bg-[#2A2A3E]"
              }`}
            >
              <Text className={sortBy === "name" ? "text-white" : "text-gray-400"}>
                Name
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (sortBy === "price") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortBy("price");
                  setSortOrder("desc");
                }
              }}
              className={`px-3 py-1 rounded mr-1 ${
                sortBy === "price" ? "bg-[#8B5CF6]" : "bg-[#2A2A3E]"
              }`}
            >
              <Text className={sortBy === "price" ? "text-white" : "text-gray-400"}>
                Price
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (sortBy === "unitsSold") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortBy("unitsSold");
                  setSortOrder("desc");
                }
              }}
              className={`px-3 py-1 rounded ${
                sortBy === "unitsSold" ? "bg-[#8B5CF6]" : "bg-[#2A2A3E]"
              }`}
            >
              <Text className={sortBy === "unitsSold" ? "text-white" : "text-gray-400"}>
                Sales
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Item List */}
        {filteredItems.map((item) => (
          <AdminItemCard
            key={item.id}
            item={item}
            merchant={getMerchant(item.merchantId)}
            isSelected={selectedItems.has(item.id)}
            onSelect={() => handleSelectItem(item.id)}
            onEdit={() => handleOpenModal(item)}
            onDelete={() => {
              deleteItem(item.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }}
          />
        ))}

        {filteredItems.length === 0 && (
          <View className="items-center py-8">
            <Ionicons name="cube-outline" size={48} color="#4B5563" />
            <Text className="text-gray-400 mt-2">No items found</Text>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Item Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/70 justify-end">
          <View
            className="bg-[#1A1A2E] rounded-t-3xl"
            style={{ maxHeight: "90%", paddingBottom: insets.bottom + 20 }}
          >
            <View className="flex-row items-center justify-between p-4 border-b border-[#2A2A3E]">
              <Text className="text-white text-lg font-bold">
                {editingItem ? "Edit Item" : "Add Item"}
              </Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </Pressable>
            </View>

            <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
              {/* Merchant Selection */}
              <Text className="text-gray-400 text-sm mb-2">Merchant *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
              >
                {merchants.map((merchant) => (
                  <Pressable
                    key={merchant.id}
                    onPress={() => setFormMerchantId(merchant.id)}
                    className={`px-4 py-2 rounded-full mr-2 ${
                      formMerchantId === merchant.id ? "bg-[#8B5CF6]" : "bg-[#2A2A3E]"
                    }`}
                  >
                    <Text
                      className={
                        formMerchantId === merchant.id ? "text-white" : "text-gray-400"
                      }
                    >
                      {merchant.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Name */}
              <Text className="text-gray-400 text-sm mb-2">Name *</Text>
              <TextInput
                className="bg-[#2A2A3E] rounded-xl px-4 py-3 text-white mb-4"
                placeholder="Item name"
                placeholderTextColor="#6B7280"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              {/* Description */}
              <Text className="text-gray-400 text-sm mb-2">Description</Text>
              <TextInput
                className="bg-[#2A2A3E] rounded-xl px-4 py-3 text-white mb-4"
                placeholder="Item description"
                placeholderTextColor="#6B7280"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
              />

              {/* Price & Category */}
              <View className="flex-row mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-gray-400 text-sm mb-2">Price *</Text>
                  <TextInput
                    className="bg-[#2A2A3E] rounded-xl px-4 py-3 text-white"
                    placeholder="0.00"
                    placeholderTextColor="#6B7280"
                    value={formData.price}
                    onChangeText={(text) => setFormData({ ...formData, price: text })}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-gray-400 text-sm mb-2">Category</Text>
                  <TextInput
                    className="bg-[#2A2A3E] rounded-xl px-4 py-3 text-white"
                    placeholder="e.g., Appetizers"
                    placeholderTextColor="#6B7280"
                    value={formData.category}
                    onChangeText={(text) => setFormData({ ...formData, category: text })}
                  />
                </View>
              </View>

              {/* Image URL */}
              <Text className="text-gray-400 text-sm mb-2">Image URL</Text>
              <TextInput
                className="bg-[#2A2A3E] rounded-xl px-4 py-3 text-white mb-4"
                placeholder="https://..."
                placeholderTextColor="#6B7280"
                value={formData.imageUrl}
                onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
              />

              {/* Toggles */}
              <View className="flex-row mb-6">
                <Pressable
                  onPress={() =>
                    setFormData({ ...formData, isAvailable: !formData.isAvailable })
                  }
                  className="flex-1 flex-row items-center mr-4"
                >
                  <View
                    className={`w-5 h-5 rounded border-2 items-center justify-center mr-2 ${
                      formData.isAvailable
                        ? "bg-green-500 border-green-500"
                        : "border-gray-500"
                    }`}
                  >
                    {formData.isAvailable && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                  <Text className="text-white">Available</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    setFormData({ ...formData, isFeatured: !formData.isFeatured })
                  }
                  className="flex-1 flex-row items-center"
                >
                  <View
                    className={`w-5 h-5 rounded border-2 items-center justify-center mr-2 ${
                      formData.isFeatured
                        ? "bg-yellow-500 border-yellow-500"
                        : "border-gray-500"
                    }`}
                  >
                    {formData.isFeatured && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                  <Text className="text-white">Featured</Text>
                </Pressable>
              </View>

              {/* Save Button */}
              <Pressable
                onPress={handleSave}
                disabled={!formData.name.trim() || !formData.price || !formMerchantId}
                className={`rounded-xl py-4 ${
                  formData.name.trim() && formData.price && formMerchantId
                    ? "bg-[#8B5CF6]"
                    : "bg-gray-600"
                }`}
              >
                <Text className="text-white font-semibold text-center">
                  {editingItem ? "Update Item" : "Add Item"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bulk Edit Modal */}
      <Modal visible={showBulkModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/70 justify-end">
          <View
            className="bg-[#1A1A2E] rounded-t-3xl p-4"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-bold">
                Bulk Edit ({selectedItems.size} items)
              </Text>
              <Pressable onPress={() => setShowBulkModal(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* Set Price */}
            <Text className="text-gray-400 text-sm mb-2">Set Price (overwrite)</Text>
            <TextInput
              className="bg-[#2A2A3E] rounded-xl px-4 py-3 text-white mb-4"
              placeholder="Leave empty to skip"
              placeholderTextColor="#6B7280"
              value={bulkPrice}
              onChangeText={setBulkPrice}
              keyboardType="decimal-pad"
            />

            {/* Apply Discount */}
            <Text className="text-gray-400 text-sm mb-2">Apply Discount (%)</Text>
            <TextInput
              className="bg-[#2A2A3E] rounded-xl px-4 py-3 text-white mb-4"
              placeholder="e.g., 20 for 20% off"
              placeholderTextColor="#6B7280"
              value={bulkDiscount}
              onChangeText={setBulkDiscount}
              keyboardType="decimal-pad"
            />

            {/* Availability */}
            <Text className="text-gray-400 text-sm mb-2">Availability</Text>
            <View className="flex-row mb-4">
              <Pressable
                onPress={() => setBulkAvailability(null)}
                className={`flex-1 py-2 rounded-l-xl ${
                  bulkAvailability === null ? "bg-[#8B5CF6]" : "bg-[#2A2A3E]"
                }`}
              >
                <Text
                  className={`text-center ${
                    bulkAvailability === null ? "text-white" : "text-gray-400"
                  }`}
                >
                  No Change
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setBulkAvailability(true)}
                className={`flex-1 py-2 ${
                  bulkAvailability === true ? "bg-green-500" : "bg-[#2A2A3E]"
                }`}
              >
                <Text
                  className={`text-center ${
                    bulkAvailability === true ? "text-white" : "text-gray-400"
                  }`}
                >
                  Available
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setBulkAvailability(false)}
                className={`flex-1 py-2 rounded-r-xl ${
                  bulkAvailability === false ? "bg-red-500" : "bg-[#2A2A3E]"
                }`}
              >
                <Text
                  className={`text-center ${
                    bulkAvailability === false ? "text-white" : "text-gray-400"
                  }`}
                >
                  Unavailable
                </Text>
              </Pressable>
            </View>

            {/* Featured */}
            <Text className="text-gray-400 text-sm mb-2">Featured</Text>
            <View className="flex-row mb-6">
              <Pressable
                onPress={() => setBulkFeatured(null)}
                className={`flex-1 py-2 rounded-l-xl ${
                  bulkFeatured === null ? "bg-[#8B5CF6]" : "bg-[#2A2A3E]"
                }`}
              >
                <Text
                  className={`text-center ${
                    bulkFeatured === null ? "text-white" : "text-gray-400"
                  }`}
                >
                  No Change
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setBulkFeatured(true)}
                className={`flex-1 py-2 ${
                  bulkFeatured === true ? "bg-yellow-500" : "bg-[#2A2A3E]"
                }`}
              >
                <Text
                  className={`text-center ${
                    bulkFeatured === true ? "text-white" : "text-gray-400"
                  }`}
                >
                  Featured
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setBulkFeatured(false)}
                className={`flex-1 py-2 rounded-r-xl ${
                  bulkFeatured === false ? "bg-gray-500" : "bg-[#2A2A3E]"
                }`}
              >
                <Text
                  className={`text-center ${
                    bulkFeatured === false ? "text-white" : "text-gray-400"
                  }`}
                >
                  Not Featured
                </Text>
              </Pressable>
            </View>

            {/* Apply Button */}
            <Pressable
              onPress={() => handleBulkAction("update")}
              className="bg-[#8B5CF6] rounded-xl py-4"
            >
              <Text className="text-white font-semibold text-center">
                Apply Changes
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};
