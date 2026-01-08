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
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAppStore } from "../state/appStore";
import type { StreamerEvent } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "StreamerEvents">;

type EventType = StreamerEvent["eventType"];

const EVENT_TYPES: { value: EventType; label: string; icon: string }[] = [
  { value: "stream", label: "Stream", icon: "radio-outline" },
  { value: "tournament", label: "Tournament", icon: "trophy-outline" },
  { value: "collab", label: "Collab", icon: "people-outline" },
  { value: "meet-greet", label: "Meet & Greet", icon: "hand-left-outline" },
  { value: "special", label: "Special", icon: "star-outline" },
  { value: "other", label: "Other", icon: "ellipsis-horizontal-outline" },
];

export function StreamerEventsScreen({ navigation, route }: Props) {
  const { streamerId } = route.params as { streamerId: string };
  const streamers = useAppStore((s) => s.streamers);
  const updateStreamer = useAppStore((s) => s.updateStreamer);

  const streamer = streamers.find((s) => s.id === streamerId);

  const [events, setEvents] = useState<StreamerEvent[]>(streamer?.events || []);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<StreamerEvent | null>(null);

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    eventType: "stream" as EventType,
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
    isOnline: true,
    maxAttendees: "",
    price: "",
    imageUrl: "",
    isPublic: true,
  });

  if (!streamer) {
    return (
      <View className="flex-1 bg-[#050509] items-center justify-center">
        <Text className="text-white">Streamer not found</Text>
      </View>
    );
  }

  const handleSave = () => {
    updateStreamer(streamerId, { events });
    Alert.alert("Success", "Events saved!", [
      { text: "OK", onPress: () => navigation.goBack() },
    ]);
  };

  const pickEventImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEventForm({ ...eventForm, imageUrl: result.assets[0].uri });
    }
  };

  const handleAddEvent = () => {
    if (!eventForm.title.trim()) {
      Alert.alert("Error", "Event title is required");
      return;
    }
    if (!eventForm.startDate || !eventForm.startTime) {
      Alert.alert("Error", "Start date and time are required");
      return;
    }

    // Construct ISO date strings
    const startDateTime = new Date(`${eventForm.startDate}T${eventForm.startTime}`).toISOString();
    const endDateTime = eventForm.endDate && eventForm.endTime
      ? new Date(`${eventForm.endDate}T${eventForm.endTime}`).toISOString()
      : undefined;

    const newEvent: StreamerEvent = {
      id: editingEvent?.id || `event-${Date.now()}`,
      streamerId,
      title: eventForm.title.trim(),
      description: eventForm.description.trim(),
      eventType: eventForm.eventType,
      startDate: startDateTime,
      endDate: endDateTime,
      location: eventForm.location.trim() || undefined,
      isOnline: eventForm.isOnline,
      maxAttendees: eventForm.maxAttendees ? parseInt(eventForm.maxAttendees) : undefined,
      currentAttendees: editingEvent?.currentAttendees || 0,
      price: eventForm.price ? parseFloat(eventForm.price) : undefined,
      imageUrl: eventForm.imageUrl || undefined,
      isPublic: eventForm.isPublic,
      createdAt: editingEvent?.createdAt || new Date().toISOString(),
    };

    if (editingEvent) {
      setEvents(events.map((e) => (e.id === editingEvent.id ? newEvent : e)));
    } else {
      setEvents([...events, newEvent]);
    }

    resetEventForm();
    setShowAddEvent(false);
    setEditingEvent(null);
  };

  const handleEditEvent = (event: StreamerEvent) => {
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : null;

    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      startDate: startDate.toISOString().split("T")[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endDate: endDate ? endDate.toISOString().split("T")[0] : "",
      endTime: endDate ? endDate.toTimeString().slice(0, 5) : "",
      location: event.location || "",
      isOnline: event.isOnline,
      maxAttendees: event.maxAttendees?.toString() || "",
      price: event.price?.toString() || "",
      imageUrl: event.imageUrl || "",
      isPublic: event.isPublic,
    });
    setShowAddEvent(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setEvents(events.filter((e) => e.id !== eventId));
          },
        },
      ]
    );
  };

  const resetEventForm = () => {
    setEventForm({
      title: "",
      description: "",
      eventType: "stream",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      location: "",
      isOnline: true,
      maxAttendees: "",
      price: "",
      imageUrl: "",
      isPublic: true,
    });
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getEventTypeIcon = (type: EventType) => {
    return EVENT_TYPES.find((t) => t.value === type)?.icon || "help-outline";
  };

  const getEventTypeLabel = (type: EventType) => {
    return EVENT_TYPES.find((t) => t.value === type)?.label || type;
  };

  const isEventUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  // Sort events: upcoming first, then by date
  const sortedEvents = [...events].sort((a, b) => {
    const aUpcoming = isEventUpcoming(a.startDate);
    const bUpcoming = isEventUpcoming(b.startDate);
    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  return (
    <SafeAreaView className="flex-1 bg-[#050509]" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-white text-lg font-semibold">Events</Text>
        <Pressable onPress={handleSave}>
          <Text className="text-[#8B5CF6] text-base font-semibold">Save</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Add Event Button */}
          <Pressable
            onPress={() => {
              resetEventForm();
              setEditingEvent(null);
              setShowAddEvent(true);
            }}
            className="bg-purple-600 py-4 rounded-xl mb-6 flex-row items-center justify-center"
          >
            <Ionicons name="add-circle" size={24} color="white" />
            <Text className="text-white font-bold ml-2">Create New Event</Text>
          </Pressable>

          {/* Events List */}
          {sortedEvents.length > 0 ? (
            sortedEvents.map((event) => {
              const upcoming = isEventUpcoming(event.startDate);
              return (
                <View
                  key={event.id}
                  className={`bg-[#1A1A1F] rounded-xl overflow-hidden mb-4 border ${
                    upcoming ? "border-purple-500/30" : "border-gray-700"
                  }`}
                >
                  {/* Event Image */}
                  {event.imageUrl && (
                    <Image
                      source={{ uri: event.imageUrl }}
                      style={{ width: "100%", height: 120 }}
                      contentFit="cover"
                    />
                  )}

                  <View className="p-4">
                    {/* Status Badge */}
                    <View className="flex-row items-center mb-2">
                      <View
                        className={`px-2 py-1 rounded-full mr-2 ${
                          upcoming ? "bg-green-600/20" : "bg-gray-700"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            upcoming ? "text-green-400" : "text-gray-400"
                          }`}
                        >
                          {upcoming ? "UPCOMING" : "PAST"}
                        </Text>
                      </View>
                      <View className="bg-purple-600/20 px-2 py-1 rounded-full flex-row items-center">
                        <Ionicons
                          name={getEventTypeIcon(event.eventType) as any}
                          size={12}
                          color="#8B5CF6"
                        />
                        <Text className="text-purple-400 text-xs font-bold ml-1">
                          {getEventTypeLabel(event.eventType)}
                        </Text>
                      </View>
                      {!event.isPublic && (
                        <View className="bg-yellow-600/20 px-2 py-1 rounded-full ml-2">
                          <Text className="text-yellow-400 text-xs font-bold">PRIVATE</Text>
                        </View>
                      )}
                    </View>

                    {/* Title */}
                    <Text className="text-white font-bold text-lg">{event.title}</Text>

                    {/* Date & Time */}
                    <View className="flex-row items-center mt-2">
                      <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                      <Text className="text-gray-400 text-sm ml-2">
                        {formatEventDate(event.startDate)}
                      </Text>
                    </View>

                    {/* Location */}
                    {event.location && (
                      <View className="flex-row items-center mt-1">
                        <Ionicons
                          name={event.isOnline ? "globe-outline" : "location-outline"}
                          size={16}
                          color="#9CA3AF"
                        />
                        <Text className="text-gray-400 text-sm ml-2">{event.location}</Text>
                      </View>
                    )}

                    {/* Price & Attendees */}
                    <View className="flex-row items-center mt-2">
                      {event.price !== undefined && event.price > 0 && (
                        <View className="flex-row items-center mr-4">
                          <Ionicons name="pricetag-outline" size={14} color="#10B981" />
                          <Text className="text-green-400 text-sm ml-1">${event.price}</Text>
                        </View>
                      )}
                      {event.price === 0 && (
                        <View className="flex-row items-center mr-4">
                          <Text className="text-green-400 text-sm">FREE</Text>
                        </View>
                      )}
                      {event.maxAttendees && (
                        <View className="flex-row items-center">
                          <Ionicons name="people-outline" size={14} color="#9CA3AF" />
                          <Text className="text-gray-400 text-sm ml-1">
                            {event.currentAttendees}/{event.maxAttendees}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Description */}
                    {event.description && (
                      <Text className="text-gray-400 text-sm mt-2" numberOfLines={2}>
                        {event.description}
                      </Text>
                    )}

                    {/* Actions */}
                    <View className="flex-row mt-4 pt-3 border-t border-gray-800">
                      <Pressable
                        onPress={() => handleEditEvent(event)}
                        className="flex-row items-center mr-4"
                      >
                        <Ionicons name="create-outline" size={16} color="#3B82F6" />
                        <Text className="text-blue-400 text-sm ml-1">Edit</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteEvent(event.id)}
                        className="flex-row items-center"
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        <Text className="text-red-400 text-sm ml-1">Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View className="items-center py-12">
              <Ionicons name="calendar-outline" size={64} color="#4B5563" />
              <Text className="text-gray-400 mt-4 text-lg">No events yet</Text>
              <Text className="text-gray-500 text-sm text-center mt-2">
                Create events to let your fans know about upcoming streams, tournaments, and more
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Event Modal */}
      <Modal visible={showAddEvent} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[90%]">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">
                  {editingEvent ? "Edit Event" : "Create Event"}
                </Text>
                <Pressable
                  onPress={() => {
                    setShowAddEvent(false);
                    setEditingEvent(null);
                    resetEventForm();
                  }}
                >
                  <Ionicons name="close" size={28} color="white" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Event Image */}
                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">Event Image</Text>
                  <Pressable
                    onPress={pickEventImage}
                    className="bg-[#0A0A0F] rounded-xl overflow-hidden"
                    style={{ aspectRatio: 16 / 9 }}
                  >
                    {eventForm.imageUrl ? (
                      <View className="relative flex-1">
                        <Image
                          source={{ uri: eventForm.imageUrl }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                        <View className="absolute inset-0 items-center justify-center bg-black/40">
                          <Ionicons name="camera" size={28} color="#FFFFFF" />
                        </View>
                      </View>
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <Ionicons name="image-outline" size={48} color="#6B7280" />
                        <Text className="text-gray-400 mt-2">Add Event Image</Text>
                      </View>
                    )}
                  </Pressable>
                </View>

                {/* Event Type */}
                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">Event Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {EVENT_TYPES.map((type) => (
                      <Pressable
                        key={type.value}
                        onPress={() =>
                          setEventForm({ ...eventForm, eventType: type.value })
                        }
                        className={`mr-3 px-4 py-3 rounded-xl flex-row items-center ${
                          eventForm.eventType === type.value
                            ? "bg-purple-600"
                            : "bg-[#0A0A0F]"
                        }`}
                      >
                        <Ionicons
                          name={type.icon as any}
                          size={18}
                          color={eventForm.eventType === type.value ? "#FFFFFF" : "#9CA3AF"}
                        />
                        <Text
                          className={`ml-2 text-sm ${
                            eventForm.eventType === type.value
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

                {/* Title */}
                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">Event Title *</Text>
                  <TextInput
                    value={eventForm.title}
                    onChangeText={(text) => setEventForm({ ...eventForm, title: text })}
                    placeholder="e.g., Friday Night Gaming"
                    placeholderTextColor="#6B7280"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  />
                </View>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">Description</Text>
                  <TextInput
                    value={eventForm.description}
                    onChangeText={(text) =>
                      setEventForm({ ...eventForm, description: text })
                    }
                    placeholder="What is this event about?"
                    placeholderTextColor="#6B7280"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                    style={{ minHeight: 80 }}
                  />
                </View>

                {/* Start Date & Time */}
                <View className="flex-row mb-4">
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-400 text-sm mb-2">Start Date *</Text>
                    <TextInput
                      value={eventForm.startDate}
                      onChangeText={(text) =>
                        setEventForm({ ...eventForm, startDate: text })
                      }
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#6B7280"
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                    />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-gray-400 text-sm mb-2">Start Time *</Text>
                    <TextInput
                      value={eventForm.startTime}
                      onChangeText={(text) =>
                        setEventForm({ ...eventForm, startTime: text })
                      }
                      placeholder="HH:MM"
                      placeholderTextColor="#6B7280"
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                    />
                  </View>
                </View>

                {/* End Date & Time */}
                <View className="flex-row mb-4">
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-400 text-sm mb-2">End Date</Text>
                    <TextInput
                      value={eventForm.endDate}
                      onChangeText={(text) =>
                        setEventForm({ ...eventForm, endDate: text })
                      }
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#6B7280"
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                    />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-gray-400 text-sm mb-2">End Time</Text>
                    <TextInput
                      value={eventForm.endTime}
                      onChangeText={(text) =>
                        setEventForm({ ...eventForm, endTime: text })
                      }
                      placeholder="HH:MM"
                      placeholderTextColor="#6B7280"
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                    />
                  </View>
                </View>

                {/* Online Toggle */}
                <View className="flex-row items-center justify-between mb-4 bg-[#0A0A0F] p-4 rounded-xl">
                  <View className="flex-row items-center">
                    <Ionicons name="globe-outline" size={20} color="#8B5CF6" />
                    <Text className="text-white ml-2">Online Event</Text>
                  </View>
                  <Switch
                    value={eventForm.isOnline}
                    onValueChange={(value) =>
                      setEventForm({ ...eventForm, isOnline: value })
                    }
                    trackColor={{ false: "#374151", true: "#8B5CF6" }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* Location */}
                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">
                    {eventForm.isOnline ? "Stream URL / Platform" : "Location"}
                  </Text>
                  <TextInput
                    value={eventForm.location}
                    onChangeText={(text) =>
                      setEventForm({ ...eventForm, location: text })
                    }
                    placeholder={
                      eventForm.isOnline
                        ? "e.g., twitch.tv/yourhandle"
                        : "e.g., Convention Center, LA"
                    }
                    placeholderTextColor="#6B7280"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                  />
                </View>

                {/* Price and Max Attendees */}
                <View className="flex-row mb-4">
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-400 text-sm mb-2">Price ($)</Text>
                    <TextInput
                      value={eventForm.price}
                      onChangeText={(text) =>
                        setEventForm({ ...eventForm, price: text })
                      }
                      placeholder="0 for free"
                      placeholderTextColor="#6B7280"
                      keyboardType="decimal-pad"
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                    />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-gray-400 text-sm mb-2">Max Attendees</Text>
                    <TextInput
                      value={eventForm.maxAttendees}
                      onChangeText={(text) =>
                        setEventForm({ ...eventForm, maxAttendees: text })
                      }
                      placeholder="Unlimited"
                      placeholderTextColor="#6B7280"
                      keyboardType="number-pad"
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                    />
                  </View>
                </View>

                {/* Public Toggle */}
                <View className="flex-row items-center justify-between mb-6 bg-[#0A0A0F] p-4 rounded-xl">
                  <View className="flex-row items-center">
                    <Ionicons name="eye-outline" size={20} color="#8B5CF6" />
                    <Text className="text-white ml-2">Public Event</Text>
                  </View>
                  <Switch
                    value={eventForm.isPublic}
                    onValueChange={(value) =>
                      setEventForm({ ...eventForm, isPublic: value })
                    }
                    trackColor={{ false: "#374151", true: "#8B5CF6" }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* Save Button */}
                <Pressable
                  onPress={handleAddEvent}
                  className="bg-purple-600 py-4 rounded-xl mb-6"
                >
                  <Text className="text-white text-center font-bold">
                    {editingEvent ? "Update Event" : "Create Event"}
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
