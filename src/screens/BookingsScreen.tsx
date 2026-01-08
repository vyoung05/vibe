import React, { useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppStore } from "../state/appStore";
import { useAuthStore } from "../state/authStore";
import type { MainTabsParamList } from "../navigation/MainTabs";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { BookingType, Booking } from "../types";

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, "Bookings">,
  NativeStackNavigationProp<RootStackParamList>
>;

const BOOKING_TYPES: { label: string; value: BookingType; icon: string; description: string }[] = [
  { label: "Shoutout", value: "shoutout", icon: "megaphone-outline", description: "Get a personalized shoutout during a stream" },
  { label: "Collab", value: "collab", icon: "people-outline", description: "Collaborate on content or stream together" },
  { label: "Private Game", value: "private-game", icon: "game-controller-outline", description: "Play a private gaming session" },
  { label: "Coaching", value: "coaching", icon: "school-outline", description: "Get 1-on-1 coaching and tips" },
  { label: "Meet & Greet", value: "meet-greet", icon: "videocam-outline", description: "Virtual meet and greet session" },
  { label: "Event", value: "event", icon: "calendar-outline", description: "Book for a special event" },
  { label: "Custom", value: "custom", icon: "create-outline", description: "Request something custom" },
];

export const BookingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const rootNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

  const streamers = useAppStore((s) => s.streamers);
  const bookings = useAppStore((s) => s.bookings);
  const addBooking = useAppStore((s) => s.addBooking);
  const user = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<"browse" | "my-bookings">("browse");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedStreamer, setSelectedStreamer] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<BookingType>("shoutout");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [budget, setBudget] = useState("");

  // Filter bookable streamers (those with booking settings enabled)
  const bookableStreamers = streamers.filter((s) => s.bookingSettings?.isBookable);

  // Get user's bookings
  const myBookings = bookings.filter((b) => b.userId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleOpenBooking = (streamerId: string) => {
    if (!user) {
      // Would show sign in prompt
      return;
    }
    setSelectedStreamer(streamerId);
    setShowBookingModal(true);
  };

  const handleSubmitBooking = () => {
    if (!user || !selectedStreamer || !bookingDate) return;

    const newBooking: Booking = {
      id: "booking-" + Date.now(),
      userId: user.id,
      userName: user.username,
      userEmail: user.email,
      streamerIds: [selectedStreamer],
      type: selectedType,
      preferredDate: bookingDate,
      preferredTime: bookingTime,
      budget: parseFloat(budget) || 0,
      notes: bookingNotes,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    addBooking(newBooking);
    setShowBookingModal(false);
    resetForm();
    setActiveTab("my-bookings");
  };

  const resetForm = () => {
    setSelectedStreamer(null);
    setSelectedType("shoutout");
    setBookingDate("");
    setBookingTime("");
    setBookingNotes("");
    setBudget("");
  };

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "pending": return "text-yellow-400";
      case "approved": return "text-green-400";
      case "declined": return "text-red-400";
      case "completed": return "text-blue-400";
      case "cancelled": return "text-gray-400";
      default: return "text-gray-400";
    }
  };

  const getStatusBgColor = (status: Booking["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-600/20";
      case "approved": return "bg-green-600/20";
      case "declined": return "bg-red-600/20";
      case "completed": return "bg-blue-600/20";
      case "cancelled": return "bg-gray-600/20";
      default: return "bg-gray-600/20";
    }
  };

  const selectedStreamerData = streamers.find((s) => s.id === selectedStreamer);

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <LinearGradient colors={["#0A0A0F", "#151520"]} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingTop: insets.top }} className="px-6 pb-4 border-b border-gray-800">
          <Text className="text-white text-3xl font-bold mb-1">Bookings</Text>
          <Text className="text-gray-400 text-sm">Book your favorite streamers</Text>
        </View>

        {/* Tabs */}
        <View className="flex-row border-b border-gray-800">
          <Pressable
            onPress={() => setActiveTab("browse")}
            className={`flex-1 py-3 ${activeTab === "browse" ? "border-b-2 border-purple-500" : ""}`}
          >
            <Text className={`text-center font-semibold ${activeTab === "browse" ? "text-purple-400" : "text-gray-400"}`}>
              Browse
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("my-bookings")}
            className={`flex-1 py-3 ${activeTab === "my-bookings" ? "border-b-2 border-purple-500" : ""}`}
          >
            <View className="flex-row items-center justify-center">
              <Text className={`font-semibold ${activeTab === "my-bookings" ? "text-purple-400" : "text-gray-400"}`}>
                My Bookings
              </Text>
              {myBookings.length > 0 && (
                <View className="bg-purple-600 w-5 h-5 rounded-full items-center justify-center ml-2">
                  <Text className="text-white text-xs font-bold">{myBookings.length}</Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* Browse Tab */}
          {activeTab === "browse" && (
            <View className="p-6">
              {/* Info Banner */}
              <View className="bg-purple-900/30 p-4 rounded-xl border border-purple-500/30 mb-6">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="sparkles" size={20} color="#A855F7" />
                  <Text className="text-purple-300 font-bold ml-2">Book Direct!</Text>
                </View>
                <Text className="text-gray-300 text-sm">
                  Request shoutouts, collaborations, coaching sessions, and more from your favorite streamers.
                </Text>
              </View>

              {/* Booking Types Overview */}
              <Text className="text-white font-bold text-lg mb-3">What can you book?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                <View className="flex-row gap-3">
                  {BOOKING_TYPES.slice(0, 5).map((type) => (
                    <View key={type.value} className="bg-[#151520] p-4 rounded-xl border border-gray-800" style={{ width: 140 }}>
                      <Ionicons name={type.icon as any} size={24} color="#8B5CF6" />
                      <Text className="text-white font-semibold mt-2">{type.label}</Text>
                      <Text className="text-gray-400 text-xs mt-1" numberOfLines={2}>{type.description}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Available Streamers */}
              <Text className="text-white font-bold text-lg mb-3">Available Streamers</Text>

              {bookableStreamers.length > 0 ? (
                bookableStreamers.map((streamer) => (
                  <Pressable
                    key={streamer.id}
                    onPress={() => handleOpenBooking(streamer.id)}
                    className="bg-[#151520] p-4 rounded-xl border border-gray-800 mb-3"
                  >
                    <View className="flex-row items-center">
                      <Image
                        source={{ uri: streamer.avatar }}
                        style={{ width: 56, height: 56, borderRadius: 28 }}
                        contentFit="cover"
                      />
                      <View className="flex-1 ml-3">
                        <View className="flex-row items-center">
                          <Text className="text-white font-bold text-lg">{streamer.name}</Text>
                          {streamer.isLive && (
                            <View className="bg-red-500 px-2 py-0.5 rounded ml-2">
                              <Text className="text-white text-xs font-bold">LIVE</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-purple-400 text-sm">@{streamer.gamertag}</Text>
                        <Text className="text-gray-400 text-xs mt-1">
                          {streamer.bookingSettings?.services?.length || 0} services available
                        </Text>
                      </View>
                      <View className="bg-purple-600 px-4 py-2 rounded-xl">
                        <Text className="text-white font-bold">Book</Text>
                      </View>
                    </View>

                    {/* Services Preview */}
                    {streamer.bookingSettings?.services && streamer.bookingSettings.services.length > 0 && (
                      <View className="flex-row flex-wrap mt-3 pt-3 border-t border-gray-800">
                        {streamer.bookingSettings.services.filter(s => s.isActive).slice(0, 3).map((service) => (
                          <View key={service.id} className="bg-gray-800 px-3 py-1 rounded-full mr-2 mb-2">
                            <Text className="text-gray-300 text-xs">
                              {service.name} - ${service.price}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </Pressable>
                ))
              ) : (
                // Show all streamers with option to request bookings
                streamers.length > 0 ? (
                  <>
                    <Text className="text-gray-400 text-sm mb-3">
                      These streamers have not set up booking yet. Tap to view their profile.
                    </Text>
                    {streamers.map((streamer) => (
                      <Pressable
                        key={streamer.id}
                        onPress={() => rootNavigation?.navigate("StreamerProfile", { streamerId: streamer.id })}
                        className="bg-[#151520] p-4 rounded-xl border border-gray-800 mb-3"
                      >
                        <View className="flex-row items-center">
                          <Image
                            source={{ uri: streamer.avatar }}
                            style={{ width: 48, height: 48, borderRadius: 24 }}
                            contentFit="cover"
                          />
                          <View className="flex-1 ml-3">
                            <Text className="text-white font-bold">{streamer.name}</Text>
                            <Text className="text-purple-400 text-sm">@{streamer.gamertag}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                        </View>
                      </Pressable>
                    ))}
                  </>
                ) : (
                  <View className="items-center py-12">
                    <Ionicons name="calendar-outline" size={64} color="#4B5563" />
                    <Text className="text-gray-400 text-lg mt-4">No streamers available yet</Text>
                    <Text className="text-gray-500 text-sm text-center mt-2">
                      Check back later for bookable streamers
                    </Text>
                  </View>
                )
              )}
            </View>
          )}

          {/* My Bookings Tab */}
          {activeTab === "my-bookings" && (
            <View className="p-6">
              {!user ? (
                <View className="items-center py-12">
                  <Ionicons name="person-outline" size={64} color="#4B5563" />
                  <Text className="text-gray-400 text-lg mt-4">Sign in to view your bookings</Text>
                </View>
              ) : myBookings.length > 0 ? (
                myBookings.map((booking) => {
                  const streamer = streamers.find((s) => booking.streamerIds.includes(s.id));
                  return (
                    <View
                      key={booking.id}
                      className="bg-[#151520] p-4 rounded-xl border border-gray-800 mb-3"
                    >
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                          {streamer && (
                            <Image
                              source={{ uri: streamer.avatar }}
                              style={{ width: 40, height: 40, borderRadius: 20 }}
                              contentFit="cover"
                            />
                          )}
                          <View className="ml-3">
                            <Text className="text-white font-bold">{streamer?.name || "Unknown Streamer"}</Text>
                            <Text className="text-gray-400 text-sm capitalize">{booking.type.replace("-", " ")}</Text>
                          </View>
                        </View>
                        <View className={`px-3 py-1 rounded-full ${getStatusBgColor(booking.status)}`}>
                          <Text className={`text-xs font-bold capitalize ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </Text>
                        </View>
                      </View>

                      <View className="bg-[#0A0A0F] p-3 rounded-xl">
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                          <Text className="text-gray-300 ml-2">{booking.preferredDate}</Text>
                          {booking.preferredTime && (
                            <Text className="text-gray-300 ml-2">at {booking.preferredTime}</Text>
                          )}
                        </View>
                        {booking.budget > 0 && (
                          <View className="flex-row items-center mb-2">
                            <Ionicons name="cash-outline" size={16} color="#9CA3AF" />
                            <Text className="text-green-400 font-bold ml-2">${booking.budget}</Text>
                          </View>
                        )}
                        {booking.notes && (
                          <Text className="text-gray-400 text-sm">{booking.notes}</Text>
                        )}
                      </View>

                      {booking.streamerResponse && (
                        <View className="mt-3 pt-3 border-t border-gray-800">
                          <Text className="text-gray-400 text-xs mb-1">Response from streamer:</Text>
                          <Text className="text-white text-sm">{booking.streamerResponse}</Text>
                        </View>
                      )}

                      <Text className="text-gray-500 text-xs mt-3">
                        Created: {new Date(booking.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <View className="items-center py-12">
                  <Ionicons name="calendar-outline" size={64} color="#4B5563" />
                  <Text className="text-gray-400 text-lg mt-4">No bookings yet</Text>
                  <Text className="text-gray-500 text-sm text-center mt-2">
                    Browse available streamers and book your first session!
                  </Text>
                  <Pressable
                    onPress={() => setActiveTab("browse")}
                    className="bg-purple-600 px-6 py-3 rounded-xl mt-4"
                  >
                    <Text className="text-white font-bold">Browse Streamers</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Booking Modal */}
        <Modal visible={showBookingModal} animationType="slide" transparent>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[85%]">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-white text-xl font-bold">Book a Session</Text>
                    <Pressable onPress={() => { setShowBookingModal(false); resetForm(); }}>
                      <Ionicons name="close" size={28} color="white" />
                    </Pressable>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Selected Streamer */}
                    {selectedStreamerData && (
                      <View className="flex-row items-center bg-[#0A0A0F] p-3 rounded-xl mb-4">
                        <Image
                          source={{ uri: selectedStreamerData.avatar }}
                          style={{ width: 48, height: 48, borderRadius: 24 }}
                          contentFit="cover"
                        />
                        <View className="ml-3">
                          <Text className="text-white font-bold">{selectedStreamerData.name}</Text>
                          <Text className="text-purple-400 text-sm">@{selectedStreamerData.gamertag}</Text>
                        </View>
                      </View>
                    )}

                    {/* Booking Type */}
                    <Text className="text-gray-400 text-sm mb-2">Type of Booking *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                      <View className="flex-row gap-2">
                        {BOOKING_TYPES.map((type) => (
                          <Pressable
                            key={type.value}
                            onPress={() => setSelectedType(type.value)}
                            className={`px-4 py-2 rounded-xl border flex-row items-center ${
                              selectedType === type.value
                                ? "bg-purple-600 border-purple-600"
                                : "bg-[#0A0A0F] border-gray-700"
                            }`}
                          >
                            <Ionicons
                              name={type.icon as any}
                              size={16}
                              color={selectedType === type.value ? "white" : "#9CA3AF"}
                            />
                            <Text className={`ml-2 text-sm ${selectedType === type.value ? "text-white" : "text-gray-400"}`}>
                              {type.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Date */}
                    <Text className="text-gray-400 text-sm mb-2">Preferred Date *</Text>
                    <TextInput
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#6B7280"
                      value={bookingDate}
                      onChangeText={setBookingDate}
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                    />

                    {/* Time */}
                    <Text className="text-gray-400 text-sm mb-2">Preferred Time (Optional)</Text>
                    <TextInput
                      placeholder="e.g., 7:00 PM EST"
                      placeholderTextColor="#6B7280"
                      value={bookingTime}
                      onChangeText={setBookingTime}
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                    />

                    {/* Budget */}
                    <Text className="text-gray-400 text-sm mb-2">Your Budget ($)</Text>
                    <TextInput
                      placeholder="e.g., 50"
                      placeholderTextColor="#6B7280"
                      value={budget}
                      onChangeText={setBudget}
                      keyboardType="decimal-pad"
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                    />

                    {/* Notes */}
                    <Text className="text-gray-400 text-sm mb-2">Additional Notes</Text>
                    <TextInput
                      placeholder="Tell them what you are looking for..."
                      placeholderTextColor="#6B7280"
                      value={bookingNotes}
                      onChangeText={setBookingNotes}
                      multiline
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-6"
                      style={{ minHeight: 100 }}
                    />

                    <Pressable
                      onPress={handleSubmitBooking}
                      disabled={!bookingDate}
                      className={`py-4 rounded-xl ${bookingDate ? "bg-purple-600" : "bg-gray-700"}`}
                    >
                      <Text className="text-white text-center font-bold">Submit Booking Request</Text>
                    </Pressable>
                  </ScrollView>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>
      </LinearGradient>
    </View>
  );
};
