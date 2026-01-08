import React, { useState } from "react";
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
import type { Merchant, MerchantCategory, MerchantHours } from "../types/merchant";
import type { RootStackParamList } from "../navigation/RootNavigator";

const CATEGORY_OPTIONS: { value: MerchantCategory; label: string }[] = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Cafe" },
  { value: "grocery", label: "Grocery" },
  { value: "retail", label: "Retail" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion" },
  { value: "beauty", label: "Beauty" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
];

const DEFAULT_HOURS: MerchantHours[] = [
  { day: "monday", open: "09:00", close: "21:00", isClosed: false },
  { day: "tuesday", open: "09:00", close: "21:00", isClosed: false },
  { day: "wednesday", open: "09:00", close: "21:00", isClosed: false },
  { day: "thursday", open: "09:00", close: "21:00", isClosed: false },
  { day: "friday", open: "09:00", close: "22:00", isClosed: false },
  { day: "saturday", open: "10:00", close: "22:00", isClosed: false },
  { day: "sunday", open: "10:00", close: "20:00", isClosed: false },
];

interface MerchantCardProps {
  merchant: Merchant;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

const AdminMerchantCard: React.FC<MerchantCardProps> = ({
  merchant,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  return (
    <View className="bg-[#1A1A2E] rounded-xl overflow-hidden mb-3 border border-[#2A2A3E]">
      <View className="flex-row p-3">
        {merchant.logoUrl && (
          <Image
            source={{ uri: merchant.logoUrl }}
            style={{ width: 60, height: 60, borderRadius: 12 }}
            contentFit="cover"
            transition={200}
          />
        )}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text className="text-white font-semibold flex-1" numberOfLines={1}>
              {merchant.name}
            </Text>
            <View
              className={`px-2 py-0.5 rounded ${
                merchant.isActive ? "bg-green-500/20" : "bg-red-500/20"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  merchant.isActive ? "text-green-400" : "text-red-400"
                }`}
              >
                {merchant.isActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
          <Text className="text-gray-400 text-sm capitalize">{merchant.category}</Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="star" size={12} color="#FBBF24" />
            <Text className="text-gray-400 text-xs ml-1">
              {merchant.rating.toFixed(1)} ({merchant.reviewCount} reviews)
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row border-t border-[#2A2A3E]">
        <Pressable
          onPress={onEdit}
          className="flex-1 py-3 flex-row items-center justify-center border-r border-[#2A2A3E]"
        >
          <Ionicons name="create-outline" size={16} color="#8B5CF6" />
          <Text className="text-[#8B5CF6] text-sm ml-1">Edit</Text>
        </Pressable>
        <Pressable
          onPress={onToggleActive}
          className="flex-1 py-3 flex-row items-center justify-center border-r border-[#2A2A3E]"
        >
          <Ionicons
            name={merchant.isActive ? "pause-outline" : "play-outline"}
            size={16}
            color={merchant.isActive ? "#FBBF24" : "#22C55E"}
          />
          <Text
            className={`text-sm ml-1 ${
              merchant.isActive ? "text-yellow-400" : "text-green-400"
            }`}
          >
            {merchant.isActive ? "Deactivate" : "Activate"}
          </Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          className="flex-1 py-3 flex-row items-center justify-center"
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text className="text-red-400 text-sm ml-1">Delete</Text>
        </Pressable>
      </View>
    </View>
  );
};

interface MerchantFormData {
  name: string;
  description: string;
  category: MerchantCategory;
  address: string;
  phone: string;
  logoUrl: string;
  bannerUrl: string;
  minOrderAmount: string;
  deliveryFee: string;
  deliveryTime: string;
  supportsDelivery: boolean;
  supportsPickup: boolean;
}

export const AdminMerchantsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const merchants = useMerchantStore((s) => s.merchants);
  const addMerchant = useMerchantStore((s) => s.addMerchant);
  const updateMerchant = useMerchantStore((s) => s.updateMerchant);
  const deleteMerchant = useMerchantStore((s) => s.deleteMerchant);
  const seedSampleData = useMerchantStore((s) => s.seedSampleData);

  const [showModal, setShowModal] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState<MerchantFormData>({
    name: "",
    description: "",
    category: "restaurant",
    address: "",
    phone: "",
    logoUrl: "",
    bannerUrl: "",
    minOrderAmount: "",
    deliveryFee: "",
    deliveryTime: "20-30 min",
    supportsDelivery: true,
    supportsPickup: true,
  });

  const filteredMerchants = merchants.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "restaurant",
      address: "",
      phone: "",
      logoUrl: "",
      bannerUrl: "",
      minOrderAmount: "",
      deliveryFee: "",
      deliveryTime: "20-30 min",
      supportsDelivery: true,
      supportsPickup: true,
    });
    setEditingMerchant(null);
  };

  const handleOpenModal = (merchant?: Merchant) => {
    if (merchant) {
      setEditingMerchant(merchant);
      setFormData({
        name: merchant.name,
        description: merchant.description,
        category: merchant.category,
        address: merchant.address || "",
        phone: merchant.phone || "",
        logoUrl: merchant.logoUrl || "",
        bannerUrl: merchant.bannerUrl || "",
        minOrderAmount: merchant.minOrderAmount?.toString() || "",
        deliveryFee: merchant.deliveryFee?.toString() || "",
        deliveryTime: merchant.deliveryTime || "20-30 min",
        supportsDelivery: merchant.supportsDelivery,
        supportsPickup: merchant.supportsPickup,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    const merchantData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category,
      address: formData.address.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      logoUrl: formData.logoUrl.trim() || undefined,
      bannerUrl: formData.bannerUrl.trim() || undefined,
      hours: DEFAULT_HOURS,
      rating: editingMerchant?.rating || 0,
      reviewCount: editingMerchant?.reviewCount || 0,
      isActive: editingMerchant?.isActive ?? true,
      isOpen: true,
      minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
      deliveryFee: formData.deliveryFee ? parseFloat(formData.deliveryFee) : 0,
      deliveryTime: formData.deliveryTime || undefined,
      supportsDelivery: formData.supportsDelivery,
      supportsPickup: formData.supportsPickup,
    };

    if (editingMerchant) {
      updateMerchant(editingMerchant.id, merchantData);
    } else {
      addMerchant(merchantData);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (merchantId: string) => {
    deleteMerchant(merchantId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setDeleteConfirm(null);
  };

  const handleToggleActive = (merchant: Merchant) => {
    updateMerchant(merchant.id, { isActive: !merchant.isActive });
    Haptics.selectionAsync();
  };

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
            <Text className="text-white text-xl font-bold">Manage Merchants</Text>
          </View>
          <Pressable
            onPress={() => handleOpenModal()}
            className="bg-[#8B5CF6] rounded-full p-2"
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-[#1A1A2E] rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 text-white ml-3"
            placeholder="Search merchants..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View className="flex-row mb-4">
          <View className="flex-1 bg-[#1A1A2E] rounded-xl p-4 mr-2 border border-[#2A2A3E]">
            <Text className="text-gray-400 text-sm">Total Merchants</Text>
            <Text className="text-white text-2xl font-bold">{merchants.length}</Text>
          </View>
          <View className="flex-1 bg-[#1A1A2E] rounded-xl p-4 ml-2 border border-[#2A2A3E]">
            <Text className="text-gray-400 text-sm">Active</Text>
            <Text className="text-green-400 text-2xl font-bold">
              {merchants.filter((m) => m.isActive).length}
            </Text>
          </View>
        </View>

        {/* Seed Data Button */}
        {merchants.length === 0 && (
          <Pressable
            onPress={seedSampleData}
            className="bg-[#8B5CF6]/20 border border-[#8B5CF6] rounded-xl p-4 mb-4 flex-row items-center justify-center"
          >
            <Ionicons name="sparkles" size={20} color="#8B5CF6" />
            <Text className="text-[#8B5CF6] font-medium ml-2">
              Load Sample Merchants
            </Text>
          </Pressable>
        )}

        {/* Merchant List */}
        {filteredMerchants.map((merchant) => (
          <AdminMerchantCard
            key={merchant.id}
            merchant={merchant}
            onEdit={() => handleOpenModal(merchant)}
            onDelete={() => setDeleteConfirm(merchant.id)}
            onToggleActive={() => handleToggleActive(merchant)}
          />
        ))}

        {filteredMerchants.length === 0 && merchants.length > 0 && (
          <View className="items-center py-8">
            <Ionicons name="search" size={48} color="#4B5563" />
            <Text className="text-gray-400 mt-2">No merchants found</Text>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/70 justify-end">
          <View
            className="bg-[#1A1A2E] rounded-t-3xl"
            style={{ maxHeight: "90%", paddingBottom: insets.bottom + 20 }}
          >
            <View className="flex-row items-center justify-between p-4 border-b border-[#2A2A3E]">
              <Text className="text-white text-lg font-bold">
                {editingMerchant ? "Edit Merchant" : "Add Merchant"}
              </Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </Pressable>
            </View>

            <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
              {/* Name */}
              <Text className="text-gray-400 text-sm mb-2">Name *</Text>
              <TextInput
                className="bg-[#2A2A3E] rounded-xl px-4 py-3 text-white mb-4"
                placeholder="Merchant name"
                placeholderTextColor="#6B7280"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              {/* Description */}
              <Text className="text-gray-400 text-sm mb-2">Description</Text>
              <TextInput
                className="bg-[#2A2A3E] rounded-xl px-4 py-3 text-white mb-4"
                placeholder="Brief description"
                placeholderTextColor="#6B7280"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={2}
              />

              {/* Category */}
              <Text className="text-gray-400 text-sm mb-2">Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <Pressable
                    key={cat.value}
                    onPress={() => setFormData({ ...formData, category: cat.value })}
                    className={`px-4 py-2 rounded-full mr-2 ${
                      formData.category === cat.value
                        ? "bg-[#8B5CF6]"
                        : "bg-[#2A2A3E]"
                    }`}
                  >
                    <Text
                      className={
                        formData.category === cat.value
                          ? "text-white"
                          : "text-gray-400"
                      }
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Address & Phone */}
              <View className="flex-row mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-gray-400 text-sm mb-2">Address</Text>
                  <TextInput
                    className="bg-[#2A2A3E] rounded-xl px-4 py-3 text-white"
                    placeholder="123 Main St"
                    placeholderTextColor="#6B7280"
                    value={formData.address}
                    onChangeText={(text) => setFormData({ ...formData, address: text })}
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-gray-400 text-sm mb-2">Phone</Text>
                  <TextInput
                    className="bg-[#2A2A3E] rounded-xl px-4 py-3 text-white"
                    placeholder="(555) 123-4567"
                    placeholderTextColor="#6B7280"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Images */}
              <Text className="text-gray-400 text-sm mb-2">Logo URL</Text>
              <TextInput
                className="bg-[#2A2A3E] rounded-xl px-4 py-3 text-white mb-4"
                placeholder="https://..."
                placeholderTextColor="#6B7280"
                value={formData.logoUrl}
                onChangeText={(text) => setFormData({ ...formData, logoUrl: text })}
              />

              <Text className="text-gray-400 text-sm mb-2">Banner URL</Text>
              <TextInput
                className="bg-[#2A2A3E] rounded-xl px-4 py-3 text-white mb-4"
                placeholder="https://..."
                placeholderTextColor="#6B7280"
                value={formData.bannerUrl}
                onChangeText={(text) => setFormData({ ...formData, bannerUrl: text })}
              />

              {/* Delivery Settings */}
              <View className="flex-row mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-gray-400 text-sm mb-2">Min Order ($)</Text>
                  <TextInput
                    className="bg-[#2A2A3E] rounded-xl px-4 py-3 text-white"
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    value={formData.minOrderAmount}
                    onChangeText={(text) =>
                      setFormData({ ...formData, minOrderAmount: text })
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-gray-400 text-sm mb-2">Delivery Fee ($)</Text>
                  <TextInput
                    className="bg-[#2A2A3E] rounded-xl px-4 py-3 text-white"
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    value={formData.deliveryFee}
                    onChangeText={(text) =>
                      setFormData({ ...formData, deliveryFee: text })
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <Text className="text-gray-400 text-sm mb-2">Delivery Time</Text>
              <TextInput
                className="bg-[#2A2A3E] rounded-xl px-4 py-3 text-white mb-4"
                placeholder="20-30 min"
                placeholderTextColor="#6B7280"
                value={formData.deliveryTime}
                onChangeText={(text) => setFormData({ ...formData, deliveryTime: text })}
              />

              {/* Toggles */}
              <View className="flex-row mb-6">
                <Pressable
                  onPress={() =>
                    setFormData({ ...formData, supportsDelivery: !formData.supportsDelivery })
                  }
                  className="flex-1 flex-row items-center mr-4"
                >
                  <View
                    className={`w-5 h-5 rounded border-2 items-center justify-center mr-2 ${
                      formData.supportsDelivery
                        ? "bg-[#8B5CF6] border-[#8B5CF6]"
                        : "border-gray-500"
                    }`}
                  >
                    {formData.supportsDelivery && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                  <Text className="text-white">Delivery</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    setFormData({ ...formData, supportsPickup: !formData.supportsPickup })
                  }
                  className="flex-1 flex-row items-center"
                >
                  <View
                    className={`w-5 h-5 rounded border-2 items-center justify-center mr-2 ${
                      formData.supportsPickup
                        ? "bg-[#8B5CF6] border-[#8B5CF6]"
                        : "border-gray-500"
                    }`}
                  >
                    {formData.supportsPickup && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                  <Text className="text-white">Pickup</Text>
                </Pressable>
              </View>

              {/* Save Button */}
              <Pressable
                onPress={handleSave}
                disabled={!formData.name.trim()}
                className={`rounded-xl py-4 ${
                  formData.name.trim() ? "bg-[#8B5CF6]" : "bg-gray-600"
                }`}
              >
                <Text className="text-white font-semibold text-center">
                  {editingMerchant ? "Update Merchant" : "Add Merchant"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteConfirm} transparent animationType="fade">
        <View className="flex-1 bg-black/70 items-center justify-center px-6">
          <View className="bg-[#1A1A2E] rounded-2xl p-6 w-full">
            <Text className="text-white text-xl font-bold text-center mb-2">
              Delete Merchant?
            </Text>
            <Text className="text-gray-400 text-center mb-6">
              This will also delete all items associated with this merchant. This action
              cannot be undone.
            </Text>
            <Pressable
              onPress={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-500 rounded-xl py-4 mb-3"
            >
              <Text className="text-white font-semibold text-center">Delete</Text>
            </Pressable>
            <Pressable
              onPress={() => setDeleteConfirm(null)}
              className="bg-[#2A2A3E] rounded-xl py-4"
            >
              <Text className="text-white font-semibold text-center">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};
