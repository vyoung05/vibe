import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { useMerchantStore } from "../state/merchantStore";
import type { SelectedOption, ItemOptionGroup, ProductImage } from "../types/merchant";
import type { RootStackParamList } from "../navigation/RootNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Image Carousel Component
interface ImageCarouselProps {
  images: ProductImage[];
  primaryImageUrl?: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, primaryImageUrl }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Build full image list: primary image first, then carousel images
  const allImages = useMemo(() => {
    const result: { id: string; url: string }[] = [];
    if (primaryImageUrl) {
      result.push({ id: "primary", url: primaryImageUrl });
    }
    images
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((img) => {
        // Avoid duplicates if primary is also in images array
        if (img.url !== primaryImageUrl) {
          result.push({ id: img.id, url: img.url });
        }
      });
    return result;
  }, [images, primaryImageUrl]);

  if (allImages.length === 0) {
    return (
      <View className="h-72 bg-[#1A1A2E] items-center justify-center">
        <Ionicons name="image-outline" size={48} color="#6B7280" />
        <Text className="text-gray-500 mt-2">No image available</Text>
      </View>
    );
  }

  if (allImages.length === 1) {
    return (
      <View className="h-72">
        <Image
          source={{ uri: allImages[0].url }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={200}
        />
      </View>
    );
  }

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / SCREEN_WIDTH);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <View className="h-72">
      <FlatList
        ref={flatListRef}
        data={allImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH, height: 288 }}>
            <Image
              source={{ uri: item.url }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
            />
          </View>
        )}
      />
      {/* Pagination Dots */}
      <View className="absolute bottom-4 left-0 right-0 flex-row justify-center">
        {allImages.map((_, index) => (
          <Pressable
            key={index}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index, animated: true });
              setActiveIndex(index);
            }}
          >
            <View
              className={`w-2 h-2 rounded-full mx-1 ${
                index === activeIndex ? "bg-white" : "bg-white/40"
              }`}
            />
          </Pressable>
        ))}
      </View>
      {/* Image Counter */}
      <View className="absolute top-4 right-4 bg-black/60 rounded-full px-3 py-1">
        <Text className="text-white text-xs font-medium">
          {activeIndex + 1} / {allImages.length}
        </Text>
      </View>
    </View>
  );
};

interface OptionGroupProps {
  group: ItemOptionGroup;
  selectedChoices: string[];
  onSelect: (choiceId: string) => void;
}

const OptionGroup: React.FC<OptionGroupProps> = ({
  group,
  selectedChoices,
  onSelect,
}) => {
  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-white font-semibold text-base">{group.name}</Text>
        {group.required && (
          <View className="bg-red-500/20 px-2 py-0.5 rounded">
            <Text className="text-red-400 text-xs font-medium">Required</Text>
          </View>
        )}
      </View>
      {group.selectionType === "single" && (
        <Text className="text-gray-500 text-sm mb-2">Select one</Text>
      )}
      {group.selectionType === "multiple" && group.maxSelect && (
        <Text className="text-gray-500 text-sm mb-2">
          Select up to {group.maxSelect}
        </Text>
      )}
      {group.choices.map((choice) => {
        const isSelected = selectedChoices.includes(choice.id);
        const isDisabled = !choice.isAvailable;

        return (
          <Pressable
            key={choice.id}
            onPress={() => {
              if (!isDisabled) {
                Haptics.selectionAsync();
                onSelect(choice.id);
              }
            }}
            disabled={isDisabled}
            className={`flex-row items-center justify-between py-3 px-4 rounded-xl mb-2 ${
              isSelected
                ? "bg-[#8B5CF6]/20 border border-[#8B5CF6]"
                : "bg-[#1A1A2E] border border-[#2A2A3E]"
            } ${isDisabled ? "opacity-50" : ""}`}
          >
            <View className="flex-row items-center flex-1">
              {group.selectionType === "single" ? (
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                    isSelected ? "border-[#8B5CF6] bg-[#8B5CF6]" : "border-gray-500"
                  }`}
                >
                  {isSelected && (
                    <View className="w-2 h-2 rounded-full bg-white" />
                  )}
                </View>
              ) : (
                <View
                  className={`w-5 h-5 rounded border-2 items-center justify-center mr-3 ${
                    isSelected ? "border-[#8B5CF6] bg-[#8B5CF6]" : "border-gray-500"
                  }`}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </View>
              )}
              <Text className="text-white flex-1">{choice.name}</Text>
            </View>
            {choice.priceDelta !== 0 && (
              <Text className="text-gray-400 ml-2">
                {choice.priceDelta > 0 ? "+" : ""}${choice.priceDelta.toFixed(2)}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

export const ItemDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "ItemDetail">>();
  const { itemId, merchantId } = route.params;

  const getItem = useMerchantStore((s) => s.getItem);
  const getMerchant = useMerchantStore((s) => s.getMerchant);
  const addToCart = useMerchantStore((s) => s.addToCart);
  const cart = useMerchantStore((s) => s.cart);
  const clearCart = useMerchantStore((s) => s.clearCart);

  const item = getItem(itemId);
  const merchant = getMerchant(merchantId);

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(() => {
    // Initialize with default selections
    const defaults: Record<string, string[]> = {};
    item?.optionGroups.forEach((group) => {
      const defaultChoice = group.choices.find((c) => c.isDefault);
      if (defaultChoice) {
        defaults[group.id] = [defaultChoice.id];
      } else {
        defaults[group.id] = [];
      }
    });
    return defaults;
  });

  const [showCartConflictModal, setShowCartConflictModal] = useState(false);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!item) return 0;
    let price = item.price;
    Object.entries(selectedOptions).forEach(([groupId, choiceIds]) => {
      const group = item.optionGroups.find((g) => g.id === groupId);
      if (group) {
        choiceIds.forEach((choiceId) => {
          const choice = group.choices.find((c) => c.id === choiceId);
          if (choice) {
            price += choice.priceDelta;
          }
        });
      }
    });
    return price * quantity;
  }, [item, selectedOptions, quantity]);

  // Check if all required options are selected
  const canAddToCart = useMemo(() => {
    if (!item) return false;
    return item.optionGroups.every((group) => {
      if (!group.required) return true;
      const selected = selectedOptions[group.id] || [];
      return selected.length > 0;
    });
  }, [item, selectedOptions]);

  const handleOptionSelect = (groupId: string, choiceId: string) => {
    const group = item?.optionGroups.find((g) => g.id === groupId);
    if (!group) return;

    setSelectedOptions((prev) => {
      const current = prev[groupId] || [];

      if (group.selectionType === "single") {
        return { ...prev, [groupId]: [choiceId] };
      } else {
        // Multiple selection
        if (current.includes(choiceId)) {
          return { ...prev, [groupId]: current.filter((id) => id !== choiceId) };
        } else {
          if (group.maxSelect && current.length >= group.maxSelect) {
            // Remove first and add new
            return { ...prev, [groupId]: [...current.slice(1), choiceId] };
          }
          return { ...prev, [groupId]: [...current, choiceId] };
        }
      }
    });
  };

  const buildSelectedOptions = (): SelectedOption[] => {
    if (!item) return [];
    const result: SelectedOption[] = [];

    Object.entries(selectedOptions).forEach(([groupId, choiceIds]) => {
      const group = item.optionGroups.find((g) => g.id === groupId);
      if (group) {
        choiceIds.forEach((choiceId) => {
          const choice = group.choices.find((c) => c.id === choiceId);
          if (choice) {
            result.push({
              groupId: group.id,
              groupName: group.name,
              choiceId: choice.id,
              choiceName: choice.name,
              priceDelta: choice.priceDelta,
            });
          }
        });
      }
    });

    return result;
  };

  const handleAddToCart = () => {
    if (!item || !canAddToCart) return;

    // Check if cart exists and is for a different merchant
    if (cart && cart.merchantId !== merchantId) {
      setShowCartConflictModal(true);
      return;
    }

    const options = buildSelectedOptions();
    const success = addToCart(item, quantity, options, notes || undefined);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    }
  };

  const handleReplaceCart = () => {
    if (!item) return;
    clearCart();
    const options = buildSelectedOptions();
    const success = addToCart(item, quantity, options, notes || undefined);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCartConflictModal(false);
      navigation.goBack();
    }
  };

  if (!item || !merchant) {
    return (
      <View className="flex-1 bg-[#0A0A0F] items-center justify-center">
        <Text className="text-white">Item not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0A0A0F]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        className="absolute z-20 left-4"
        style={{ top: insets.top + 8 }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          className="bg-black/50 rounded-full p-2"
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Item Image Carousel */}
        <ImageCarousel
          images={item.images || []}
          primaryImageUrl={item.imageUrl}
        />

        {/* Item Info */}
        <View className="px-4 pt-6">
          <Text className="text-white text-2xl font-bold">{item.name}</Text>
          <Text className="text-[#8B5CF6] text-xl font-semibold mt-2">
            ${item.price.toFixed(2)}
          </Text>
          {item.description && (
            <Text className="text-gray-400 mt-3">{item.description}</Text>
          )}
        </View>

        {/* Option Groups */}
        {item.optionGroups.length > 0 && (
          <View className="px-4 mt-6">
            {item.optionGroups.map((group) => (
              <OptionGroup
                key={group.id}
                group={group}
                selectedChoices={selectedOptions[group.id] || []}
                onSelect={(choiceId) => handleOptionSelect(group.id, choiceId)}
              />
            ))}
          </View>
        )}

        {/* Special Instructions */}
        <View className="px-4 mt-2">
          <Text className="text-white font-semibold text-base mb-3">
            Special Instructions
          </Text>
          <TextInput
            className="bg-[#1A1A2E] border border-[#2A2A3E] rounded-xl px-4 py-3 text-white"
            placeholder="Add notes for the kitchen..."
            placeholderTextColor="#6B7280"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-[#1A1A2E] border-t border-[#2A2A3E] px-4 py-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <View className="flex-row items-center">
          {/* Quantity Selector */}
          <View className="flex-row items-center bg-[#2A2A3E] rounded-xl mr-4">
            <Pressable
              onPress={() => {
                if (quantity > 1) {
                  Haptics.selectionAsync();
                  setQuantity(quantity - 1);
                }
              }}
              className="p-3"
            >
              <Ionicons
                name="remove"
                size={20}
                color={quantity > 1 ? "#FFFFFF" : "#4B5563"}
              />
            </Pressable>
            <Text className="text-white font-bold text-lg w-8 text-center">
              {quantity}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setQuantity(quantity + 1);
              }}
              className="p-3"
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Add to Cart Button */}
          <Pressable
            onPress={handleAddToCart}
            disabled={!canAddToCart || !item.isAvailable}
            className={`flex-1 rounded-xl py-4 px-6 flex-row items-center justify-center ${
              canAddToCart && item.isAvailable
                ? "bg-[#8B5CF6]"
                : "bg-gray-600"
            }`}
          >
            <Text className="text-white font-semibold text-base mr-2">
              {item.isAvailable ? "Add to Cart" : "Unavailable"}
            </Text>
            <Text className="text-white font-bold text-base">
              ${totalPrice.toFixed(2)}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Cart Conflict Modal */}
      {showCartConflictModal && (
        <View className="absolute inset-0 bg-black/70 items-center justify-center px-6">
          <View className="bg-[#1A1A2E] rounded-2xl p-6 w-full">
            <Text className="text-white text-xl font-bold text-center mb-2">
              Start a new cart?
            </Text>
            <Text className="text-gray-400 text-center mb-6">
              Your cart contains items from {cart?.merchantName}. Would you like
              to clear it and add items from {merchant.name}?
            </Text>
            <Pressable
              onPress={handleReplaceCart}
              className="bg-[#8B5CF6] rounded-xl py-4 mb-3"
            >
              <Text className="text-white font-semibold text-center">
                Start New Cart
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setShowCartConflictModal(false)}
              className="bg-[#2A2A3E] rounded-xl py-4"
            >
              <Text className="text-white font-semibold text-center">
                Keep Current Cart
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};
