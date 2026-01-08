import React from "react";
import {
  View,
  Text,
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
import { useAuthStore } from "../state/authStore";
import type { Order, OrderStatus } from "../types/merchant";
import type { RootStackParamList } from "../navigation/RootNavigator";

const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case "pending":
      return "#FBBF24"; // yellow
    case "confirmed":
    case "preparing":
    case "ready":
    case "out_for_delivery":
      return "#8B5CF6"; // purple
    case "delivered":
    case "completed":
      return "#22C55E"; // green
    case "cancelled":
    case "refunded":
      return "#EF4444"; // red
    default:
      return "#9CA3AF";
  }
};

const getStatusLabel = (status: OrderStatus): string => {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "preparing":
      return "Preparing";
    case "ready":
      return "Ready";
    case "out_for_delivery":
      return "On the Way";
    case "delivered":
      return "Delivered";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
};

interface OrderCardProps {
  order: Order;
  onPress: () => void;
  onReorder: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onPress, onReorder }) => {
  const getMerchant = useMerchantStore((s) => s.getMerchant);
  const merchant = getMerchant(order.merchantId);

  const statusColor = getStatusColor(order.status);
  const statusLabel = getStatusLabel(order.status);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isActive = ["pending", "confirmed", "preparing", "ready", "out_for_delivery"].includes(
    order.status
  );

  return (
    <Pressable
      onPress={onPress}
      className="bg-[#1A1A2E] rounded-xl overflow-hidden mb-4 border border-[#2A2A3E]"
    >
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-[#2A2A3E]">
        {merchant?.logoUrl && (
          <Image
            source={{ uri: merchant.logoUrl }}
            style={{ width: 48, height: 48, borderRadius: 12 }}
            contentFit="cover"
            transition={200}
          />
        )}
        <View className="flex-1 ml-3">
          <Text className="text-white font-semibold">{order.merchantName}</Text>
          <Text className="text-gray-500 text-sm">{formatDate(order.createdAt)}</Text>
        </View>
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: `${statusColor}20` }}
        >
          <Text style={{ color: statusColor }} className="text-sm font-medium">
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Order Items Preview */}
      <View className="p-4">
        <Text className="text-gray-400 text-sm mb-2">
          Order #{order.orderNumber}
        </Text>
        <Text className="text-white" numberOfLines={2}>
          {order.items.map((item) => `${item.quantity}x ${item.itemName}`).join(", ")}
        </Text>
        <View className="flex-row items-center justify-between mt-3">
          <Text className="text-[#8B5CF6] font-bold">
            ${order.total.toFixed(2)}
          </Text>
          <Text className="text-gray-500 text-sm">
            {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row border-t border-[#2A2A3E]">
        {isActive ? (
          <Pressable
            onPress={onPress}
            className="flex-1 py-3 flex-row items-center justify-center"
          >
            <Ionicons name="location-outline" size={18} color="#8B5CF6" />
            <Text className="text-[#8B5CF6] font-medium ml-2">Track Order</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={onPress}
              className="flex-1 py-3 flex-row items-center justify-center border-r border-[#2A2A3E]"
            >
              <Ionicons name="receipt-outline" size={18} color="#9CA3AF" />
              <Text className="text-gray-400 font-medium ml-2">View Details</Text>
            </Pressable>
            <Pressable
              onPress={onReorder}
              className="flex-1 py-3 flex-row items-center justify-center"
            >
              <Ionicons name="refresh-outline" size={18} color="#8B5CF6" />
              <Text className="text-[#8B5CF6] font-medium ml-2">Reorder</Text>
            </Pressable>
          </>
        )}
      </View>
    </Pressable>
  );
};

export const OrderHistoryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const user = useAuthStore((s) => s.user);
  const getUserOrders = useMerchantStore((s) => s.getUserOrders);
  const getMerchantItems = useMerchantStore((s) => s.getMerchantItems);
  const addToCart = useMerchantStore((s) => s.addToCart);
  const clearCart = useMerchantStore((s) => s.clearCart);

  const [refreshing, setRefreshing] = React.useState(false);

  const orders = user ? getUserOrders(user.id) : [];

  const activeOrders = orders.filter((o) =>
    ["pending", "confirmed", "preparing", "ready", "out_for_delivery"].includes(o.status)
  );

  const pastOrders = orders.filter((o) =>
    ["delivered", "completed", "cancelled", "refunded"].includes(o.status)
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleOrderPress = (order: Order) => {
    navigation.navigate("OrderTracking", { orderId: order.id });
  };

  const handleReorder = (order: Order) => {
    // Clear existing cart
    clearCart();

    // Get current items from merchant
    const merchantItems = getMerchantItems(order.merchantId);

    // Add each item from the order to cart
    order.items.forEach((orderItem) => {
      const item = merchantItems.find((i) => i.id === orderItem.itemId);
      if (item && item.isAvailable) {
        addToCart(item, orderItem.quantity, orderItem.selectedOptions, orderItem.notes);
      }
    });

    // Navigate to cart
    navigation.navigate("Cart");
  };

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      {/* Header */}
      <View
        className="flex-row items-center px-4 py-4 border-b border-[#1F1F2E]"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="text-white text-xl font-bold">Order History</Text>
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
        {orders.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="receipt-outline" size={80} color="#4B5563" />
            <Text className="text-white text-xl font-bold mt-6">No orders yet</Text>
            <Text className="text-gray-400 text-center mt-2 px-8">
              Your order history will appear here once you place your first order
            </Text>
            <Pressable
              onPress={() => navigation.navigate("MerchantList")}
              className="bg-[#8B5CF6] rounded-xl py-4 px-8 mt-8"
            >
              <Text className="text-white font-semibold">Browse Merchants</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-4">
                  Active Orders
                </Text>
                {activeOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onPress={() => handleOrderPress(order)}
                    onReorder={() => handleReorder(order)}
                  />
                ))}
              </View>
            )}

            {/* Past Orders */}
            {pastOrders.length > 0 && (
              <View>
                <Text className="text-white text-lg font-bold mb-4">
                  Past Orders
                </Text>
                {pastOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onPress={() => handleOrderPress(order)}
                    onReorder={() => handleReorder(order)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};
