import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { useMerchantStore } from "../state/merchantStore";
import type { Order, OrderStatus } from "../types/merchant";
import type { RootStackParamList } from "../navigation/RootNavigator";

const ORDER_STATUSES: { value: OrderStatus; label: string; color: string }[] = [
  { value: "pending", label: "Pending", color: "#FBBF24" },
  { value: "confirmed", label: "Confirmed", color: "#8B5CF6" },
  { value: "preparing", label: "Preparing", color: "#3B82F6" },
  { value: "ready", label: "Ready", color: "#06B6D4" },
  { value: "out_for_delivery", label: "Out for Delivery", color: "#F97316" },
  { value: "delivered", label: "Delivered", color: "#22C55E" },
  { value: "completed", label: "Completed", color: "#22C55E" },
  { value: "cancelled", label: "Cancelled", color: "#EF4444" },
  { value: "refunded", label: "Refunded", color: "#EC4899" },
];

const getStatusInfo = (status: OrderStatus) => {
  return ORDER_STATUSES.find((s) => s.value === status) || ORDER_STATUSES[0];
};

interface OrderCardProps {
  order: Order;
  onPress: () => void;
  onUpdateStatus: (status: OrderStatus) => void;
}

const AdminOrderCard: React.FC<OrderCardProps> = ({
  order,
  onPress,
  onUpdateStatus,
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusInfo = getStatusInfo(order.status);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getNextStatus = (): OrderStatus | null => {
    const statusFlow: OrderStatus[] =
      order.deliveryType === "delivery"
        ? ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"]
        : ["pending", "confirmed", "preparing", "ready", "completed"];

    const currentIndex = statusFlow.indexOf(order.status);
    if (currentIndex >= 0 && currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    return null;
  };

  const nextStatus = getNextStatus();
  const nextStatusInfo = nextStatus ? getStatusInfo(nextStatus) : null;

  return (
    <Pressable
      onPress={onPress}
      className="bg-[#1A1A2E] rounded-xl overflow-hidden mb-3 border border-[#2A2A3E]"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between p-3 border-b border-[#2A2A3E]">
        <View>
          <Text className="text-white font-bold">{order.orderNumber}</Text>
          <Text className="text-gray-500 text-xs">{formatDate(order.createdAt)}</Text>
        </View>
        <Pressable
          onPress={() => setShowStatusMenu(!showStatusMenu)}
          className="flex-row items-center px-3 py-1.5 rounded-full"
          style={{ backgroundColor: `${statusInfo.color}20` }}
        >
          <Text style={{ color: statusInfo.color }} className="text-sm font-medium">
            {statusInfo.label}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={statusInfo.color}
            style={{ marginLeft: 4 }}
          />
        </Pressable>
      </View>

      {/* Status Dropdown */}
      {showStatusMenu && (
        <View className="bg-[#2A2A3E] p-2 border-b border-[#3A3A4E]">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {ORDER_STATUSES.filter(
              (s) =>
                !["cancelled", "refunded"].includes(s.value) ||
                ["cancelled", "refunded"].includes(order.status)
            ).map((status) => (
              <Pressable
                key={status.value}
                onPress={() => {
                  onUpdateStatus(status.value);
                  setShowStatusMenu(false);
                }}
                className={`px-3 py-1.5 rounded-full mr-2 ${
                  order.status === status.value ? "opacity-50" : ""
                }`}
                style={{ backgroundColor: `${status.color}20` }}
                disabled={order.status === status.value}
              >
                <Text style={{ color: status.color }} className="text-xs font-medium">
                  {status.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Order Info */}
      <View className="p-3">
        <View className="flex-row items-center mb-2">
          <Ionicons name="storefront-outline" size={14} color="#9CA3AF" />
          <Text className="text-gray-400 text-sm ml-2">{order.merchantName}</Text>
        </View>
        <View className="flex-row items-center mb-2">
          <Ionicons name="person-outline" size={14} color="#9CA3AF" />
          <Text className="text-white text-sm ml-2">{order.userName}</Text>
          {order.userPhone && (
            <Text className="text-gray-500 text-sm ml-2">({order.userPhone})</Text>
          )}
        </View>
        <View className="flex-row items-center mb-2">
          <Ionicons
            name={order.deliveryType === "delivery" ? "bicycle-outline" : "bag-outline"}
            size={14}
            color="#9CA3AF"
          />
          <Text className="text-gray-400 text-sm ml-2 capitalize">
            {order.deliveryType}
          </Text>
        </View>

        {/* Items Preview */}
        <Text className="text-gray-500 text-sm" numberOfLines={1}>
          {order.items.map((i) => `${i.quantity}x ${i.itemName}`).join(", ")}
        </Text>

        {/* Footer */}
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-[#2A2A3E]">
          <View className="flex-row items-center">
            <View
              className={`px-2 py-0.5 rounded ${
                order.paymentStatus === "paid"
                  ? "bg-green-500/20"
                  : order.paymentStatus === "refunded"
                  ? "bg-pink-500/20"
                  : "bg-yellow-500/20"
              }`}
            >
              <Text
                className={`text-xs capitalize ${
                  order.paymentStatus === "paid"
                    ? "text-green-400"
                    : order.paymentStatus === "refunded"
                    ? "text-pink-400"
                    : "text-yellow-400"
                }`}
              >
                {order.paymentStatus}
              </Text>
            </View>
          </View>
          <Text className="text-[#8B5CF6] font-bold">${order.total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Quick Action */}
      {nextStatusInfo && !["cancelled", "refunded"].includes(order.status) && (
        <Pressable
          onPress={() => onUpdateStatus(nextStatus!)}
          className="flex-row items-center justify-center py-3 border-t border-[#2A2A3E]"
          style={{ backgroundColor: `${nextStatusInfo.color}10` }}
        >
          <Ionicons name="arrow-forward" size={16} color={nextStatusInfo.color} />
          <Text style={{ color: nextStatusInfo.color }} className="font-medium ml-2">
            Mark as {nextStatusInfo.label}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
};

export const AdminOrdersScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const orders = useMerchantStore((s) => s.orders);
  const merchants = useMerchantStore((s) => s.merchants);
  const updateOrderStatus = useMerchantStore((s) => s.updateOrderStatus);
  const updatePaymentStatus = useMerchantStore((s) => s.updatePaymentStatus);
  const cancelOrder = useMerchantStore((s) => s.cancelOrder);
  const getAdminDashboardStats = useMerchantStore((s) => s.getAdminDashboardStats);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [merchantFilter, setMerchantFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const stats = getAdminDashboardStats(30);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (merchantFilter) {
      result = result.filter((o) => o.merchantId === merchantFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(query) ||
          o.userName.toLowerCase().includes(query) ||
          o.merchantName.toLowerCase().includes(query)
      );
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, statusFilter, merchantFilter, searchQuery]);

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    updateOrderStatus(orderId, status);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleCancelOrder = () => {
    if (!selectedOrder || !cancelReason.trim()) return;
    cancelOrder(selectedOrder.id, cancelReason.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowCancelModal(false);
    setSelectedOrder(null);
    setCancelReason("");
  };

  const handleRefund = (orderId: string) => {
    updatePaymentStatus(orderId, "refunded");
    updateOrderStatus(orderId, "refunded");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const orderCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    ORDER_STATUSES.forEach((s) => {
      counts[s.value] = orders.filter((o) => o.status === s.value).length;
    });
    return counts;
  }, [orders]);

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      {/* Header */}
      <View
        className="px-4 py-4 border-b border-[#1F1F2E]"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center mb-4">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text className="text-white text-xl font-bold">Manage Orders</Text>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-[#1A1A2E] rounded-xl px-4 py-3 mb-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 text-white ml-3"
            placeholder="Search orders..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Status Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Pressable
            onPress={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-full mr-2 ${
              statusFilter === "all" ? "bg-[#8B5CF6]" : "bg-[#1A1A2E]"
            }`}
          >
            <Text className={statusFilter === "all" ? "text-white" : "text-gray-400"}>
              All ({orderCounts.all})
            </Text>
          </Pressable>
          {ORDER_STATUSES.slice(0, 6).map((status) => (
            <Pressable
              key={status.value}
              onPress={() => setStatusFilter(status.value)}
              className={`px-3 py-1.5 rounded-full mr-2 ${
                statusFilter === status.value ? "bg-[#8B5CF6]" : "bg-[#1A1A2E]"
              }`}
            >
              <Text
                className={statusFilter === status.value ? "text-white" : "text-gray-400"}
              >
                {status.label} ({orderCounts[status.value] || 0})
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View className="flex-row mb-4">
          <View className="flex-1 bg-[#1A1A2E] rounded-xl p-3 mr-2 border border-[#2A2A3E]">
            <Text className="text-gray-400 text-xs">Today</Text>
            <Text className="text-white text-xl font-bold">
              {
                orders.filter((o) => {
                  const today = new Date().toISOString().split("T")[0];
                  return o.createdAt.startsWith(today);
                }).length
              }
            </Text>
          </View>
          <View className="flex-1 bg-[#1A1A2E] rounded-xl p-3 mr-2 border border-[#2A2A3E]">
            <Text className="text-gray-400 text-xs">Revenue (30d)</Text>
            <Text className="text-green-400 text-xl font-bold">
              ${stats.totalGMV.toFixed(0)}
            </Text>
          </View>
          <View className="flex-1 bg-[#1A1A2E] rounded-xl p-3 border border-[#2A2A3E]">
            <Text className="text-gray-400 text-xs">Pending</Text>
            <Text className="text-yellow-400 text-xl font-bold">
              {orderCounts.pending || 0}
            </Text>
          </View>
        </View>

        {/* Merchant Filter */}
        {merchants.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <Pressable
              onPress={() => setMerchantFilter(null)}
              className={`px-3 py-1.5 rounded-full mr-2 ${
                !merchantFilter ? "bg-[#8B5CF6]" : "bg-[#1A1A2E]"
              }`}
            >
              <Text className={!merchantFilter ? "text-white" : "text-gray-400"}>
                All Merchants
              </Text>
            </Pressable>
            {merchants.map((merchant) => (
              <Pressable
                key={merchant.id}
                onPress={() => setMerchantFilter(merchant.id)}
                className={`px-3 py-1.5 rounded-full mr-2 ${
                  merchantFilter === merchant.id ? "bg-[#8B5CF6]" : "bg-[#1A1A2E]"
                }`}
              >
                <Text
                  className={
                    merchantFilter === merchant.id ? "text-white" : "text-gray-400"
                  }
                >
                  {merchant.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Orders List */}
        {filteredOrders.map((order) => (
          <AdminOrderCard
            key={order.id}
            order={order}
            onPress={() => setSelectedOrder(order)}
            onUpdateStatus={(status) => handleUpdateStatus(order.id, status)}
          />
        ))}

        {filteredOrders.length === 0 && (
          <View className="items-center py-8">
            <Ionicons name="receipt-outline" size={48} color="#4B5563" />
            <Text className="text-gray-400 mt-2">No orders found</Text>
          </View>
        )}
      </ScrollView>

      {/* Order Detail Modal */}
      <Modal visible={!!selectedOrder} animationType="slide" transparent>
        <View className="flex-1 bg-black/70 justify-end">
          <View
            className="bg-[#1A1A2E] rounded-t-3xl"
            style={{ maxHeight: "85%", paddingBottom: insets.bottom + 20 }}
          >
            <View className="flex-row items-center justify-between p-4 border-b border-[#2A2A3E]">
              <Text className="text-white text-lg font-bold">Order Details</Text>
              <Pressable onPress={() => setSelectedOrder(null)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </Pressable>
            </View>

            {selectedOrder && (
              <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
                {/* Order Header */}
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-white text-xl font-bold">
                      {selectedOrder.orderNumber}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  <View
                    className="px-3 py-1.5 rounded-full"
                    style={{
                      backgroundColor: `${getStatusInfo(selectedOrder.status).color}20`,
                    }}
                  >
                    <Text
                      style={{ color: getStatusInfo(selectedOrder.status).color }}
                      className="font-medium"
                    >
                      {getStatusInfo(selectedOrder.status).label}
                    </Text>
                  </View>
                </View>

                {/* Customer Info */}
                <View className="bg-[#2A2A3E] rounded-xl p-4 mb-4">
                  <Text className="text-gray-400 text-sm mb-2">Customer</Text>
                  <Text className="text-white font-medium">{selectedOrder.userName}</Text>
                  {selectedOrder.userPhone && (
                    <Text className="text-gray-400">{selectedOrder.userPhone}</Text>
                  )}
                </View>

                {/* Delivery Info */}
                <View className="bg-[#2A2A3E] rounded-xl p-4 mb-4">
                  <Text className="text-gray-400 text-sm mb-2">
                    {selectedOrder.deliveryType === "delivery"
                      ? "Delivery Address"
                      : "Pickup Location"}
                  </Text>
                  {selectedOrder.deliveryType === "delivery" &&
                  selectedOrder.deliveryAddress ? (
                    <>
                      <Text className="text-white">
                        {selectedOrder.deliveryAddress.street}
                        {selectedOrder.deliveryAddress.apartment &&
                          `, ${selectedOrder.deliveryAddress.apartment}`}
                      </Text>
                      <Text className="text-gray-400">
                        {selectedOrder.deliveryAddress.city},{" "}
                        {selectedOrder.deliveryAddress.state}{" "}
                        {selectedOrder.deliveryAddress.zipCode}
                      </Text>
                      {selectedOrder.deliveryAddress.instructions && (
                        <Text className="text-gray-500 text-sm mt-1">
                          Note: {selectedOrder.deliveryAddress.instructions}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text className="text-white">{selectedOrder.merchantName}</Text>
                  )}
                </View>

                {/* Order Items */}
                <View className="bg-[#2A2A3E] rounded-xl p-4 mb-4">
                  <Text className="text-gray-400 text-sm mb-3">Items</Text>
                  {selectedOrder.items.map((item) => (
                    <View
                      key={item.id}
                      className="flex-row justify-between py-2 border-b border-[#3A3A4E] last:border-b-0"
                    >
                      <View className="flex-1">
                        <Text className="text-white">
                          {item.quantity}x {item.itemName}
                        </Text>
                        {item.selectedOptions.length > 0 && (
                          <Text className="text-gray-500 text-sm">
                            {item.selectedOptions.map((o) => o.choiceName).join(", ")}
                          </Text>
                        )}
                        {item.notes && (
                          <Text className="text-gray-500 text-sm italic">
                            Note: {item.notes}
                          </Text>
                        )}
                      </View>
                      <Text className="text-white">${item.lineTotal.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>

                {/* Order Summary */}
                <View className="bg-[#2A2A3E] rounded-xl p-4 mb-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-400">Subtotal</Text>
                    <Text className="text-white">${selectedOrder.subtotal.toFixed(2)}</Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-400">Tax</Text>
                    <Text className="text-white">${selectedOrder.tax.toFixed(2)}</Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-400">Delivery Fee</Text>
                    <Text className="text-white">
                      ${selectedOrder.deliveryFee.toFixed(2)}
                    </Text>
                  </View>
                  {selectedOrder.tip > 0 && (
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-gray-400">Tip</Text>
                      <Text className="text-white">${selectedOrder.tip.toFixed(2)}</Text>
                    </View>
                  )}
                  <View className="flex-row justify-between pt-2 border-t border-[#3A3A4E]">
                    <Text className="text-white font-bold">Total</Text>
                    <Text className="text-[#8B5CF6] font-bold">
                      ${selectedOrder.total.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row">
                  {!["cancelled", "refunded", "completed", "delivered"].includes(
                    selectedOrder.status
                  ) && (
                    <Pressable
                      onPress={() => {
                        setShowCancelModal(true);
                      }}
                      className="flex-1 bg-red-500/20 rounded-xl py-4 mr-2"
                    >
                      <Text className="text-red-400 font-semibold text-center">
                        Cancel Order
                      </Text>
                    </Pressable>
                  )}
                  {selectedOrder.paymentStatus === "paid" &&
                    !["refunded"].includes(selectedOrder.status) && (
                      <Pressable
                        onPress={() => handleRefund(selectedOrder.id)}
                        className="flex-1 bg-pink-500/20 rounded-xl py-4"
                      >
                        <Text className="text-pink-400 font-semibold text-center">
                          Refund
                        </Text>
                      </Pressable>
                    )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View className="flex-1 bg-black/70 items-center justify-center px-6">
          <View className="bg-[#1A1A2E] rounded-2xl p-6 w-full">
            <Text className="text-white text-xl font-bold text-center mb-2">
              Cancel Order?
            </Text>
            <Text className="text-gray-400 text-center mb-4">
              Please provide a reason for cancellation
            </Text>
            <TextInput
              className="bg-[#2A2A3E] rounded-xl px-4 py-3 text-white mb-4"
              placeholder="Cancellation reason..."
              placeholderTextColor="#6B7280"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
            />
            <Pressable
              onPress={handleCancelOrder}
              disabled={!cancelReason.trim()}
              className={`rounded-xl py-4 mb-3 ${
                cancelReason.trim() ? "bg-red-500" : "bg-gray-600"
              }`}
            >
              <Text className="text-white font-semibold text-center">
                Confirm Cancellation
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setShowCancelModal(false);
                setCancelReason("");
              }}
              className="bg-[#2A2A3E] rounded-xl py-4"
            >
              <Text className="text-white font-semibold text-center">Go Back</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};
