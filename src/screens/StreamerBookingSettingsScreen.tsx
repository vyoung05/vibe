import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAppStore } from "../state/appStore";
import type { BookingSettings, BookingService, BookingType } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "StreamerBookingSettings">;

const BOOKING_TYPES: { value: BookingType; label: string; icon: string }[] = [
  { value: "shoutout", label: "Shoutout", icon: "megaphone-outline" },
  { value: "collab", label: "Collaboration", icon: "people-outline" },
  { value: "private-game", label: "Private Game", icon: "game-controller-outline" },
  { value: "coaching", label: "Coaching", icon: "school-outline" },
  { value: "meet-greet", label: "Meet & Greet", icon: "hand-left-outline" },
  { value: "custom", label: "Custom", icon: "create-outline" },
];

export function StreamerBookingSettingsScreen({ navigation, route }: Props) {
  const { streamerId } = route.params as { streamerId: string };
  const streamers = useAppStore((s) => s.streamers);
  const updateStreamer = useAppStore((s) => s.updateStreamer);

  const streamer = streamers.find((s) => s.id === streamerId);

  // Initialize booking settings
  const defaultSettings: BookingSettings = {
    isBookable: false,
    services: [],
    minNotice: 24,
    maxBookingsPerDay: 5,
    bookingMessage: "",
    autoApprove: false,
  };

  const [settings, setSettings] = useState<BookingSettings>(
    streamer?.bookingSettings || defaultSettings
  );
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState<BookingService | null>(null);

  // Service form state
  const [serviceForm, setServiceForm] = useState({
    type: "shoutout" as BookingType,
    name: "",
    description: "",
    price: "",
    duration: "30",
    isActive: true,
  });

  if (!streamer) {
    return (
      <View className="flex-1 bg-[#050509] items-center justify-center">
        <Text className="text-white">Streamer not found</Text>
      </View>
    );
  }

  const handleSave = () => {
    updateStreamer(streamerId, { bookingSettings: settings });
    Alert.alert("Success", "Booking settings saved!", [
      { text: "OK", onPress: () => navigation.goBack() },
    ]);
  };

  const handleAddService = () => {
    if (!serviceForm.name.trim()) {
      Alert.alert("Error", "Service name is required");
      return;
    }

    const price = parseFloat(serviceForm.price) || 0;
    const duration = parseInt(serviceForm.duration) || 30;

    const newService: BookingService = {
      id: editingService?.id || `service-${Date.now()}`,
      type: serviceForm.type,
      name: serviceForm.name.trim(),
      description: serviceForm.description.trim(),
      price,
      duration,
      isActive: serviceForm.isActive,
    };

    if (editingService) {
      // Update existing service
      setSettings({
        ...settings,
        services: settings.services.map((s) =>
          s.id === editingService.id ? newService : s
        ),
      });
    } else {
      // Add new service
      setSettings({
        ...settings,
        services: [...settings.services, newService],
      });
    }

    resetServiceForm();
    setShowAddService(false);
    setEditingService(null);
  };

  const handleEditService = (service: BookingService) => {
    setEditingService(service);
    setServiceForm({
      type: service.type,
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration.toString(),
      isActive: service.isActive,
    });
    setShowAddService(true);
  };

  const handleDeleteService = (serviceId: string) => {
    Alert.alert(
      "Delete Service",
      "Are you sure you want to delete this service?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setSettings({
              ...settings,
              services: settings.services.filter((s) => s.id !== serviceId),
            });
          },
        },
      ]
    );
  };

  const toggleServiceActive = (serviceId: string) => {
    setSettings({
      ...settings,
      services: settings.services.map((s) =>
        s.id === serviceId ? { ...s, isActive: !s.isActive } : s
      ),
    });
  };

  const resetServiceForm = () => {
    setServiceForm({
      type: "shoutout",
      name: "",
      description: "",
      price: "",
      duration: "30",
      isActive: true,
    });
  };

  const getTypeIcon = (type: BookingType) => {
    return BOOKING_TYPES.find((t) => t.value === type)?.icon || "help-outline";
  };

  return (
    <SafeAreaView className="flex-1 bg-[#050509]" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-white text-lg font-semibold">Booking Settings</Text>
        <Pressable onPress={handleSave}>
          <Text className="text-[#8B5CF6] text-base font-semibold">Save</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Enable Bookings Toggle */}
          <View className="bg-[#1A1A1F] rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-white font-semibold text-base">Accept Bookings</Text>
                <Text className="text-gray-400 text-sm mt-1">
                  Allow fans to book your services
                </Text>
              </View>
              <Switch
                value={settings.isBookable}
                onValueChange={(value) => setSettings({ ...settings, isBookable: value })}
                trackColor={{ false: "#374151", true: "#8B5CF6" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {settings.isBookable && (
            <>
              {/* Booking Settings */}
              <View className="bg-[#1A1A1F] rounded-xl p-4 mb-4">
                <Text className="text-white font-semibold text-base mb-4">Settings</Text>

                {/* Min Notice */}
                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">Minimum Notice (hours)</Text>
                  <TextInput
                    value={settings.minNotice.toString()}
                    onChangeText={(text) =>
                      setSettings({ ...settings, minNotice: parseInt(text) || 0 })
                    }
                    placeholder="24"
                    placeholderTextColor="#6B7280"
                    keyboardType="number-pad"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  />
                </View>

                {/* Max Bookings Per Day */}
                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">Max Bookings Per Day</Text>
                  <TextInput
                    value={settings.maxBookingsPerDay.toString()}
                    onChangeText={(text) =>
                      setSettings({ ...settings, maxBookingsPerDay: parseInt(text) || 1 })
                    }
                    placeholder="5"
                    placeholderTextColor="#6B7280"
                    keyboardType="number-pad"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  />
                </View>

                {/* Auto Approve */}
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-1 mr-4">
                    <Text className="text-white text-sm">Auto-Approve Bookings</Text>
                    <Text className="text-gray-500 text-xs mt-1">
                      Automatically approve incoming requests
                    </Text>
                  </View>
                  <Switch
                    value={settings.autoApprove}
                    onValueChange={(value) =>
                      setSettings({ ...settings, autoApprove: value })
                    }
                    trackColor={{ false: "#374151", true: "#8B5CF6" }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* Custom Message */}
                <View>
                  <Text className="text-gray-400 text-sm mb-2">
                    Booking Message (shown to customers)
                  </Text>
                  <TextInput
                    value={settings.bookingMessage || ""}
                    onChangeText={(text) =>
                      setSettings({ ...settings, bookingMessage: text })
                    }
                    placeholder="Thanks for booking! I'll respond within 24 hours..."
                    placeholderTextColor="#6B7280"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                    style={{ minHeight: 80 }}
                  />
                </View>
              </View>

              {/* Services */}
              <View className="bg-[#1A1A1F] rounded-xl p-4 mb-4">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white font-semibold text-base">Services</Text>
                  <Pressable
                    onPress={() => {
                      resetServiceForm();
                      setEditingService(null);
                      setShowAddService(true);
                    }}
                    className="flex-row items-center"
                  >
                    <Ionicons name="add-circle" size={20} color="#8B5CF6" />
                    <Text className="text-[#8B5CF6] text-sm ml-1">Add Service</Text>
                  </Pressable>
                </View>

                {settings.services.length > 0 ? (
                  settings.services.map((service) => (
                    <View
                      key={service.id}
                      className={`bg-[#0A0A0F] rounded-xl p-4 mb-3 border ${
                        service.isActive ? "border-purple-500/30" : "border-gray-700"
                      }`}
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-row items-center flex-1">
                          <View
                            className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                              service.isActive ? "bg-purple-600/30" : "bg-gray-700"
                            }`}
                          >
                            <Ionicons
                              name={getTypeIcon(service.type) as any}
                              size={20}
                              color={service.isActive ? "#8B5CF6" : "#6B7280"}
                            />
                          </View>
                          <View className="flex-1">
                            <Text
                              className={`font-semibold ${
                                service.isActive ? "text-white" : "text-gray-500"
                              }`}
                            >
                              {service.name}
                            </Text>
                            <Text className="text-gray-400 text-xs mt-1">
                              ${service.price} • {service.duration} min
                            </Text>
                          </View>
                        </View>
                        <Switch
                          value={service.isActive}
                          onValueChange={() => toggleServiceActive(service.id)}
                          trackColor={{ false: "#374151", true: "#8B5CF6" }}
                          thumbColor="#FFFFFF"
                        />
                      </View>

                      {service.description && (
                        <Text className="text-gray-400 text-sm mt-2" numberOfLines={2}>
                          {service.description}
                        </Text>
                      )}

                      <View className="flex-row mt-3 pt-3 border-t border-gray-800">
                        <Pressable
                          onPress={() => handleEditService(service)}
                          className="flex-row items-center mr-4"
                        >
                          <Ionicons name="create-outline" size={16} color="#3B82F6" />
                          <Text className="text-blue-400 text-sm ml-1">Edit</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeleteService(service.id)}
                          className="flex-row items-center"
                        >
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          <Text className="text-red-400 text-sm ml-1">Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
                ) : (
                  <View className="items-center py-8">
                    <Ionicons name="pricetag-outline" size={48} color="#4B5563" />
                    <Text className="text-gray-400 mt-3">No services added yet</Text>
                    <Text className="text-gray-500 text-sm text-center mt-1">
                      Add services that fans can book
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Service Modal */}
      <Modal visible={showAddService} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[85%]">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">
                  {editingService ? "Edit Service" : "Add Service"}
                </Text>
                <Pressable
                  onPress={() => {
                    setShowAddService(false);
                    setEditingService(null);
                    resetServiceForm();
                  }}
                >
                  <Ionicons name="close" size={28} color="white" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Service Type */}
                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">Service Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {BOOKING_TYPES.map((type) => (
                      <Pressable
                        key={type.value}
                        onPress={() =>
                          setServiceForm({ ...serviceForm, type: type.value })
                        }
                        className={`mr-3 px-4 py-3 rounded-xl flex-row items-center ${
                          serviceForm.type === type.value
                            ? "bg-purple-600"
                            : "bg-[#0A0A0F]"
                        }`}
                      >
                        <Ionicons
                          name={type.icon as any}
                          size={18}
                          color={serviceForm.type === type.value ? "#FFFFFF" : "#9CA3AF"}
                        />
                        <Text
                          className={`ml-2 text-sm ${
                            serviceForm.type === type.value
                              ? "text-white font-semibold"
                              : "text-gray-400"
                          }`}
                        >
                          {type.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                {/* Service Name */}
                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">Service Name *</Text>
                  <TextInput
                    value={serviceForm.name}
                    onChangeText={(text) =>
                      setServiceForm({ ...serviceForm, name: text })
                    }
                    placeholder="e.g., Personal Shoutout"
                    placeholderTextColor="#6B7280"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  />
                </View>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">Description</Text>
                  <TextInput
                    value={serviceForm.description}
                    onChangeText={(text) =>
                      setServiceForm({ ...serviceForm, description: text })
                    }
                    placeholder="Describe what the customer gets..."
                    placeholderTextColor="#6B7280"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                    style={{ minHeight: 80 }}
                  />
                </View>

                {/* Price and Duration */}
                <View className="flex-row mb-4">
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-400 text-sm mb-2">Price ($)</Text>
                    <TextInput
                      value={serviceForm.price}
                      onChangeText={(text) =>
                        setServiceForm({ ...serviceForm, price: text })
                      }
                      placeholder="0"
                      placeholderTextColor="#6B7280"
                      keyboardType="decimal-pad"
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                    />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-gray-400 text-sm mb-2">Duration (min)</Text>
                    <TextInput
                      value={serviceForm.duration}
                      onChangeText={(text) =>
                        setServiceForm({ ...serviceForm, duration: text })
                      }
                      placeholder="30"
                      placeholderTextColor="#6B7280"
                      keyboardType="number-pad"
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                    />
                  </View>
                </View>

                {/* Active Toggle */}
                <View className="flex-row items-center justify-between mb-6 bg-[#0A0A0F] p-4 rounded-xl">
                  <Text className="text-white">Service Active</Text>
                  <Switch
                    value={serviceForm.isActive}
                    onValueChange={(value) =>
                      setServiceForm({ ...serviceForm, isActive: value })
                    }
                    trackColor={{ false: "#374151", true: "#8B5CF6" }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* Save Button */}
                <Pressable
                  onPress={handleAddService}
                  className="bg-purple-600 py-4 rounded-xl mb-6"
                >
                  <Text className="text-white text-center font-bold">
                    {editingService ? "Update Service" : "Add Service"}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
