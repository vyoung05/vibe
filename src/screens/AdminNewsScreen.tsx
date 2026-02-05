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
import {
  useNewsStore,
  NewsItem,
  GamingEvent,
  NewsCategory,
  EventType,
} from "../state/newsStore";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NEWS_CATEGORIES: { label: string; value: NewsCategory }[] = [
  { label: "Gaming", value: "gaming" },
  { label: "Esports", value: "esports" },
  { label: "Streaming", value: "streaming" },
  { label: "Tech", value: "tech" },
  { label: "Announcement", value: "announcement" },
];

const EVENT_TYPES: { label: string; value: EventType }[] = [
  { label: "Tournament", value: "tournament" },
  { label: "Livestream", value: "livestream" },
  { label: "Game Release", value: "release" },
  { label: "Community", value: "community" },
  { label: "Sale", value: "sale" },
];

const CATEGORY_COLORS: Record<string, string> = {
  gaming: "#10B981",
  esports: "#F59E0B",
  streaming: "#A855F7",
  tech: "#3B82F6",
  announcement: "#EF4444",
};

const EVENT_COLORS: Record<string, string> = {
  tournament: "#F59E0B",
  livestream: "#EF4444",
  release: "#10B981",
  community: "#A855F7",
  sale: "#3B82F6",
};

export const AdminNewsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);

  // News store - Use Supabase sync functions
  const news = useNewsStore((s) => s.news);
  const events = useNewsStore((s) => s.events);
  const isLoading = useNewsStore((s) => s.isLoading);
  const syncFromSupabase = useNewsStore((s) => s.syncFromSupabase);
  const syncNewsToSupabase = useNewsStore((s) => s.syncNewsToSupabase);
  const syncEventToSupabase = useNewsStore((s) => s.syncEventToSupabase);
  const updateNewsInSupabase = useNewsStore((s) => s.updateNewsInSupabase);
  const updateEventInSupabase = useNewsStore((s) => s.updateEventInSupabase);
  const deleteNewsFromSupabase = useNewsStore((s) => s.deleteNewsFromSupabase);
  const deleteEventFromSupabase = useNewsStore((s) => s.deleteEventFromSupabase);
  
  // Sync from Supabase on mount
  useEffect(() => {
    syncFromSupabase();
  }, []);

  const [activeTab, setActiveTab] = useState<"news" | "events">("news");
  const [showAddNews, setShowAddNews] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [editingEvent, setEditingEvent] = useState<GamingEvent | null>(null);

  // News form
  const [newsForm, setNewsForm] = useState({
    title: "",
    summary: "",
    content: "",
    imageUrl: "",
    category: "gaming" as NewsCategory,
    source: "",
    sourceUrl: "",
    tags: "",
    isActive: true,
    isPinned: false,
  });

  // Event form
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    eventType: "tournament" as EventType,
    startDate: "",
    endDate: "",
    location: "",
    isOnline: true,
    streamUrl: "",
    registrationUrl: "",
    game: "",
    prizePool: "",
    tags: "",
    isActive: true,
    isFeatured: false,
  });

  // Check admin
  if (user?.role !== "admin") {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0F] items-center justify-center px-6">
        <Ionicons name="lock-closed" size={64} color="#EF4444" />
        <Text className="text-white text-xl font-bold mt-4">Access Denied</Text>
        <Text className="text-gray-400 text-center mt-2">
          You do not have permission to access this area.
        </Text>
      </SafeAreaView>
    );
  }

  const resetNewsForm = () => {
    setNewsForm({
      title: "",
      summary: "",
      content: "",
      imageUrl: "",
      category: "gaming",
      source: "",
      sourceUrl: "",
      tags: "",
      isActive: true,
      isPinned: false,
    });
    setEditingNews(null);
  };

  const resetEventForm = () => {
    setEventForm({
      title: "",
      description: "",
      imageUrl: "",
      eventType: "tournament",
      startDate: "",
      endDate: "",
      location: "",
      isOnline: true,
      streamUrl: "",
      registrationUrl: "",
      game: "",
      prizePool: "",
      tags: "",
      isActive: true,
      isFeatured: false,
    });
    setEditingEvent(null);
  };

  const handleSaveNews = async () => {
    if (!newsForm.title || !newsForm.summary) {
      Alert.alert("Error", "Title and summary are required");
      return;
    }

    const newsData = {
      title: newsForm.title,
      summary: newsForm.summary,
      content: newsForm.content || undefined,
      imageUrl: newsForm.imageUrl || undefined,
      category: newsForm.category,
      source: newsForm.source || undefined,
      sourceUrl: newsForm.sourceUrl || undefined,
      tags: newsForm.tags.split(",").map((t) => t.trim()).filter((t) => t),
      isActive: newsForm.isActive,
      isPinned: newsForm.isPinned,
    };

    if (editingNews) {
      const success = await updateNewsInSupabase(editingNews.id, newsData);
      if (!success) {
        Alert.alert("Error", "Failed to update news article");
        return;
      }
    } else {
      const result = await syncNewsToSupabase({
        ...newsData,
        publishedAt: new Date().toISOString(),
        createdBy: user?.id || "admin",
      });
      if (!result) {
        Alert.alert("Error", "Failed to create news article");
        return;
      }
    }

    setShowAddNews(false);
    resetNewsForm();
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title || !eventForm.description || !eventForm.startDate) {
      Alert.alert("Error", "Title, description, and start date are required");
      return;
    }

    const eventData = {
      title: eventForm.title,
      description: eventForm.description,
      imageUrl: eventForm.imageUrl || undefined,
      eventType: eventForm.eventType,
      startDate: eventForm.startDate,
      endDate: eventForm.endDate || undefined,
      location: eventForm.location || undefined,
      isOnline: eventForm.isOnline,
      streamUrl: eventForm.streamUrl || undefined,
      registrationUrl: eventForm.registrationUrl || undefined,
      game: eventForm.game || undefined,
      prizePool: eventForm.prizePool || undefined,
      tags: eventForm.tags.split(",").map((t) => t.trim()).filter((t) => t),
      isActive: eventForm.isActive,
      isFeatured: eventForm.isFeatured,
    };

    if (editingEvent) {
      const success = await updateEventInSupabase(editingEvent.id, eventData);
      if (!success) {
        Alert.alert("Error", "Failed to update event");
        return;
      }
    } else {
      const result = await syncEventToSupabase({
        ...eventData,
        createdBy: user?.id || "admin",
      });
      if (!result) {
        Alert.alert("Error", "Failed to create event");
        return;
      }
    }

    setShowAddEvent(false);
    resetEventForm();
  };

  const handleEditNews = (item: NewsItem) => {
    setNewsForm({
      title: item.title,
      summary: item.summary,
      content: item.content || "",
      imageUrl: item.imageUrl || "",
      category: item.category,
      source: item.source || "",
      sourceUrl: item.sourceUrl || "",
      tags: item.tags.join(", "),
      isActive: item.isActive,
      isPinned: item.isPinned,
    });
    setEditingNews(item);
    setShowAddNews(true);
  };

  const handleEditEvent = (item: GamingEvent) => {
    setEventForm({
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl || "",
      eventType: item.eventType,
      startDate: item.startDate,
      endDate: item.endDate || "",
      location: item.location || "",
      isOnline: item.isOnline,
      streamUrl: item.streamUrl || "",
      registrationUrl: item.registrationUrl || "",
      game: item.game || "",
      prizePool: item.prizePool || "",
      tags: item.tags.join(", "),
      isActive: item.isActive,
      isFeatured: item.isFeatured,
    });
    setEditingEvent(item);
    setShowAddEvent(true);
  };

  const handleDeleteNews = (id: string) => {
    Alert.alert("Delete News", "Are you sure you want to delete this news item?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          const success = await deleteNewsFromSupabase(id);
          if (!success) {
            Alert.alert("Error", "Failed to delete news article");
          }
        } 
      },
    ]);
  };

  const handleDeleteEvent = (id: string) => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          const success = await deleteEventFromSupabase(id);
          if (!success) {
            Alert.alert("Error", "Failed to delete event");
          }
        } 
      },
    ]);
  };
  
  // Toggle functions using Supabase
  const handleToggleNewsActive = async (id: string) => {
    const item = news.find(n => n.id === id);
    if (item) {
      await updateNewsInSupabase(id, { isActive: !item.isActive });
    }
  };

  const handleToggleNewsPinned = async (id: string) => {
    const item = news.find(n => n.id === id);
    if (item) {
      await updateNewsInSupabase(id, { isPinned: !item.isPinned });
    }
  };

  const handleToggleEventActive = async (id: string) => {
    const item = events.find(e => e.id === id);
    if (item) {
      await updateEventInSupabase(id, { isActive: !item.isActive });
    }
  };

  const handleToggleEventFeatured = async (id: string) => {
    const item = events.find(e => e.id === id);
    if (item) {
      await updateEventInSupabase(id, { isFeatured: !item.isFeatured });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
              <Text className="text-white text-xl font-bold">News & Events</Text>
              <Text className="text-gray-400 text-sm">Manage gaming content</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-gray-800">
        <Pressable
          onPress={() => setActiveTab("news")}
          className={`flex-1 py-3 ${activeTab === "news" ? "border-b-2 border-purple-500" : ""}`}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === "news" ? "text-purple-500" : "text-gray-400"
            }`}
          >
            News ({news.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("events")}
          className={`flex-1 py-3 ${activeTab === "events" ? "border-b-2 border-yellow-500" : ""}`}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === "events" ? "text-yellow-500" : "text-gray-400"
            }`}
          >
            Events ({events.length})
          </Text>
        </Pressable>
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View className="absolute inset-0 bg-black/50 z-50 items-center justify-center">
          <ActivityIndicator size="large" color="#A855F7" />
          <Text className="text-white mt-2">Loading...</Text>
        </View>
      )}

      <ScrollView className="flex-1 p-6">
        {/* News Tab */}
        {activeTab === "news" && (
          <View>
            {/* Add News Button */}
            <Pressable
              onPress={() => {
                resetNewsForm();
                setShowAddNews(true);
              }}
              className="bg-purple-600 flex-row items-center justify-center py-4 rounded-xl mb-6"
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text className="text-white font-bold ml-2">Add News Article</Text>
            </Pressable>

            {/* News List */}
            {news.length > 0 ? (
              news.map((item) => (
                <View
                  key={item.id}
                  className={`bg-[#151520] rounded-xl mb-4 overflow-hidden border ${
                    item.isActive ? "border-gray-800" : "border-red-800/50"
                  }`}
                >
                  <View className="flex-row">
                    {item.imageUrl && (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={{ width: 100, height: 100 }}
                        contentFit="cover"
                      />
                    )}
                    <View className="flex-1 p-3">
                      {/* Badges */}
                      <View className="flex-row items-center mb-1 flex-wrap">
                        <View
                          className="px-2 py-0.5 rounded-full mr-2"
                          style={{ backgroundColor: `${CATEGORY_COLORS[item.category]}20` }}
                        >
                          <Text
                            className="text-xs font-bold capitalize"
                            style={{ color: CATEGORY_COLORS[item.category] }}
                          >
                            {item.category}
                          </Text>
                        </View>
                        {item.isPinned && (
                          <View className="bg-yellow-600/20 px-2 py-0.5 rounded-full mr-2">
                            <Text className="text-yellow-400 text-xs font-bold">PINNED</Text>
                          </View>
                        )}
                        {!item.isActive && (
                          <View className="bg-red-600/20 px-2 py-0.5 rounded-full">
                            <Text className="text-red-400 text-xs font-bold">INACTIVE</Text>
                          </View>
                        )}
                      </View>

                      {/* Title */}
                      <Text className="text-white font-bold" numberOfLines={2}>
                        {item.title}
                      </Text>

                      {/* Meta */}
                      <View className="flex-row items-center mt-1">
                        <Text className="text-gray-500 text-xs">
                          {formatDate(item.publishedAt)}
                        </Text>
                        <Text className="text-gray-600 mx-2">•</Text>
                        <Text className="text-gray-500 text-xs">
                          {item.viewCount} views
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="flex-row border-t border-gray-800">
                    <Pressable
                      onPress={() => handleToggleNewsActive(item.id)}
                      className="flex-1 py-3 flex-row items-center justify-center"
                    >
                      <Ionicons
                        name={item.isActive ? "eye" : "eye-off"}
                        size={16}
                        color={item.isActive ? "#10B981" : "#6B7280"}
                      />
                      <Text
                        className={`ml-1 text-sm ${
                          item.isActive ? "text-green-400" : "text-gray-400"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleToggleNewsPinned(item.id)}
                      className="flex-1 py-3 flex-row items-center justify-center border-l border-gray-800"
                    >
                      <Ionicons
                        name={item.isPinned ? "pin" : "pin-outline"}
                        size={16}
                        color={item.isPinned ? "#EAB308" : "#6B7280"}
                      />
                      <Text
                        className={`ml-1 text-sm ${
                          item.isPinned ? "text-yellow-400" : "text-gray-400"
                        }`}
                      >
                        {item.isPinned ? "Pinned" : "Pin"}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleEditNews(item)}
                      className="flex-1 py-3 flex-row items-center justify-center border-l border-gray-800"
                    >
                      <Ionicons name="pencil" size={16} color="#3B82F6" />
                      <Text className="text-blue-400 ml-1 text-sm">Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteNews(item.id)}
                      className="flex-1 py-3 flex-row items-center justify-center border-l border-gray-800"
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                      <Text className="text-red-400 ml-1 text-sm">Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center py-12">
                <Ionicons name="newspaper-outline" size={64} color="#4B5563" />
                <Text className="text-gray-400 mt-4">No news articles yet</Text>
                <Text className="text-gray-600 text-sm">Add your first news article</Text>
              </View>
            )}
          </View>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <View>
            {/* Add Event Button */}
            <Pressable
              onPress={() => {
                resetEventForm();
                setShowAddEvent(true);
              }}
              className="bg-yellow-600 flex-row items-center justify-center py-4 rounded-xl mb-6"
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text className="text-white font-bold ml-2">Add Event</Text>
            </Pressable>

            {/* Events List */}
            {events.length > 0 ? (
              events.map((item) => (
                <View
                  key={item.id}
                  className={`bg-[#151520] rounded-xl mb-4 overflow-hidden border ${
                    item.isActive ? "border-gray-800" : "border-red-800/50"
                  }`}
                >
                  <View className="flex-row">
                    {item.imageUrl && (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={{ width: 100, height: 100 }}
                        contentFit="cover"
                      />
                    )}
                    <View className="flex-1 p-3">
                      {/* Badges */}
                      <View className="flex-row items-center mb-1 flex-wrap">
                        <View
                          className="px-2 py-0.5 rounded-full mr-2"
                          style={{ backgroundColor: `${EVENT_COLORS[item.eventType]}20` }}
                        >
                          <Text
                            className="text-xs font-bold capitalize"
                            style={{ color: EVENT_COLORS[item.eventType] }}
                          >
                            {item.eventType}
                          </Text>
                        </View>
                        {item.isFeatured && (
                          <View className="bg-purple-600/20 px-2 py-0.5 rounded-full mr-2">
                            <Text className="text-purple-400 text-xs font-bold">FEATURED</Text>
                          </View>
                        )}
                        {!item.isActive && (
                          <View className="bg-red-600/20 px-2 py-0.5 rounded-full">
                            <Text className="text-red-400 text-xs font-bold">INACTIVE</Text>
                          </View>
                        )}
                      </View>

                      {/* Title */}
                      <Text className="text-white font-bold" numberOfLines={1}>
                        {item.title}
                      </Text>

                      {/* Date */}
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                        <Text className="text-gray-400 text-xs ml-1">
                          {formatDate(item.startDate)}
                        </Text>
                        {item.prizePool && (
                          <>
                            <Text className="text-gray-600 mx-2">•</Text>
                            <Text className="text-green-400 text-xs font-bold">
                              {item.prizePool}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="flex-row border-t border-gray-800">
                    <Pressable
                      onPress={() => handleToggleEventActive(item.id)}
                      className="flex-1 py-3 flex-row items-center justify-center"
                    >
                      <Ionicons
                        name={item.isActive ? "eye" : "eye-off"}
                        size={16}
                        color={item.isActive ? "#10B981" : "#6B7280"}
                      />
                      <Text
                        className={`ml-1 text-sm ${
                          item.isActive ? "text-green-400" : "text-gray-400"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleToggleEventFeatured(item.id)}
                      className="flex-1 py-3 flex-row items-center justify-center border-l border-gray-800"
                    >
                      <Ionicons
                        name={item.isFeatured ? "star" : "star-outline"}
                        size={16}
                        color={item.isFeatured ? "#A855F7" : "#6B7280"}
                      />
                      <Text
                        className={`ml-1 text-sm ${
                          item.isFeatured ? "text-purple-400" : "text-gray-400"
                        }`}
                      >
                        {item.isFeatured ? "Featured" : "Feature"}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleEditEvent(item)}
                      className="flex-1 py-3 flex-row items-center justify-center border-l border-gray-800"
                    >
                      <Ionicons name="pencil" size={16} color="#3B82F6" />
                      <Text className="text-blue-400 ml-1 text-sm">Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteEvent(item.id)}
                      className="flex-1 py-3 flex-row items-center justify-center border-l border-gray-800"
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                      <Text className="text-red-400 ml-1 text-sm">Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center py-12">
                <Ionicons name="calendar-outline" size={64} color="#4B5563" />
                <Text className="text-gray-400 mt-4">No events yet</Text>
                <Text className="text-gray-600 text-sm">Add your first gaming event</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit News Modal */}
      <Modal visible={showAddNews} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[90%]">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-xl font-bold">
                    {editingNews ? "Edit News" : "Add News Article"}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setShowAddNews(false);
                      resetNewsForm();
                    }}
                  >
                    <Ionicons name="close" size={28} color="white" />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <TextInput
                    placeholder="Title *"
                    placeholderTextColor="#6B7280"
                    value={newsForm.title}
                    onChangeText={(text) => setNewsForm({ ...newsForm, title: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />

                  <TextInput
                    placeholder="Summary * (shown in feed)"
                    placeholderTextColor="#6B7280"
                    value={newsForm.summary}
                    onChangeText={(text) => setNewsForm({ ...newsForm, summary: text })}
                    multiline
                    numberOfLines={2}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                    style={{ minHeight: 60, textAlignVertical: "top" }}
                  />

                  <TextInput
                    placeholder="Full Content (optional)"
                    placeholderTextColor="#6B7280"
                    value={newsForm.content}
                    onChangeText={(text) => setNewsForm({ ...newsForm, content: text })}
                    multiline
                    numberOfLines={4}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                    style={{ minHeight: 100, textAlignVertical: "top" }}
                  />

                  <TextInput
                    placeholder="Image URL"
                    placeholderTextColor="#6B7280"
                    value={newsForm.imageUrl}
                    onChangeText={(text) => setNewsForm({ ...newsForm, imageUrl: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />

                  <Text className="text-gray-400 text-sm mb-2">Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    {NEWS_CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat.value}
                        onPress={() => setNewsForm({ ...newsForm, category: cat.value })}
                        className={`px-4 py-2 rounded-full mr-2 ${
                          newsForm.category === cat.value ? "bg-purple-600" : "bg-gray-700"
                        }`}
                      >
                        <Text className="text-white text-sm">{cat.label}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <View className="flex-row mb-4">
                    <TextInput
                      placeholder="Source Name"
                      placeholderTextColor="#6B7280"
                      value={newsForm.source}
                      onChangeText={(text) => setNewsForm({ ...newsForm, source: text })}
                      className="flex-1 bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mr-2"
                    />
                    <TextInput
                      placeholder="Source URL"
                      placeholderTextColor="#6B7280"
                      value={newsForm.sourceUrl}
                      onChangeText={(text) => setNewsForm({ ...newsForm, sourceUrl: text })}
                      className="flex-1 bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                    />
                  </View>

                  <TextInput
                    placeholder="Tags (comma separated)"
                    placeholderTextColor="#6B7280"
                    value={newsForm.tags}
                    onChangeText={(text) => setNewsForm({ ...newsForm, tags: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />

                  {/* Toggles */}
                  <View className="flex-row mb-6">
                    <Pressable
                      onPress={() => setNewsForm({ ...newsForm, isActive: !newsForm.isActive })}
                      className="flex-1 flex-row items-center mr-4"
                    >
                      <View
                        className={`w-6 h-6 rounded-md border-2 mr-2 items-center justify-center ${
                          newsForm.isActive ? "bg-green-600 border-green-600" : "border-gray-600"
                        }`}
                      >
                        {newsForm.isActive && <Ionicons name="checkmark" size={16} color="white" />}
                      </View>
                      <Text className="text-white">Active</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setNewsForm({ ...newsForm, isPinned: !newsForm.isPinned })}
                      className="flex-1 flex-row items-center"
                    >
                      <View
                        className={`w-6 h-6 rounded-md border-2 mr-2 items-center justify-center ${
                          newsForm.isPinned ? "bg-yellow-600 border-yellow-600" : "border-gray-600"
                        }`}
                      >
                        {newsForm.isPinned && <Ionicons name="checkmark" size={16} color="white" />}
                      </View>
                      <Text className="text-white">Pinned</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={handleSaveNews}
                    className="bg-purple-600 py-4 rounded-xl mb-6"
                  >
                    <Text className="text-white text-center font-bold">
                      {editingNews ? "Save Changes" : "Publish News"}
                    </Text>
                  </Pressable>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add/Edit Event Modal */}
      <Modal visible={showAddEvent} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[90%]">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-xl font-bold">
                    {editingEvent ? "Edit Event" : "Add Event"}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setShowAddEvent(false);
                      resetEventForm();
                    }}
                  >
                    <Ionicons name="close" size={28} color="white" />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <TextInput
                    placeholder="Event Title *"
                    placeholderTextColor="#6B7280"
                    value={eventForm.title}
                    onChangeText={(text) => setEventForm({ ...eventForm, title: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />

                  <TextInput
                    placeholder="Description *"
                    placeholderTextColor="#6B7280"
                    value={eventForm.description}
                    onChangeText={(text) => setEventForm({ ...eventForm, description: text })}
                    multiline
                    numberOfLines={3}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                    style={{ minHeight: 80, textAlignVertical: "top" }}
                  />

                  <TextInput
                    placeholder="Image URL"
                    placeholderTextColor="#6B7280"
                    value={eventForm.imageUrl}
                    onChangeText={(text) => setEventForm({ ...eventForm, imageUrl: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />

                  <Text className="text-gray-400 text-sm mb-2">Event Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    {EVENT_TYPES.map((type) => (
                      <Pressable
                        key={type.value}
                        onPress={() => setEventForm({ ...eventForm, eventType: type.value })}
                        className={`px-4 py-2 rounded-full mr-2 ${
                          eventForm.eventType === type.value ? "bg-yellow-600" : "bg-gray-700"
                        }`}
                      >
                        <Text className="text-white text-sm">{type.label}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <View className="flex-row mb-4">
                    <View className="flex-1 mr-2">
                      <Text className="text-gray-400 text-sm mb-1">Start Date *</Text>
                      <TextInput
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#6B7280"
                        value={eventForm.startDate}
                        onChangeText={(text) => setEventForm({ ...eventForm, startDate: text })}
                        className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-400 text-sm mb-1">End Date</Text>
                      <TextInput
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#6B7280"
                        value={eventForm.endDate}
                        onChangeText={(text) => setEventForm({ ...eventForm, endDate: text })}
                        className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                      />
                    </View>
                  </View>

                  <View className="flex-row mb-4">
                    <TextInput
                      placeholder="Game (e.g., Fortnite)"
                      placeholderTextColor="#6B7280"
                      value={eventForm.game}
                      onChangeText={(text) => setEventForm({ ...eventForm, game: text })}
                      className="flex-1 bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mr-2"
                    />
                    <TextInput
                      placeholder="Prize Pool"
                      placeholderTextColor="#6B7280"
                      value={eventForm.prizePool}
                      onChangeText={(text) => setEventForm({ ...eventForm, prizePool: text })}
                      className="flex-1 bg-[#0A0A0F] text-white px-4 py-3 rounded-xl"
                    />
                  </View>

                  <Pressable
                    onPress={() => setEventForm({ ...eventForm, isOnline: !eventForm.isOnline })}
                    className="flex-row items-center mb-4"
                  >
                    <View
                      className={`w-6 h-6 rounded-md border-2 mr-2 items-center justify-center ${
                        eventForm.isOnline ? "bg-blue-600 border-blue-600" : "border-gray-600"
                      }`}
                    >
                      {eventForm.isOnline && <Ionicons name="checkmark" size={16} color="white" />}
                    </View>
                    <Text className="text-white">Online Event</Text>
                  </Pressable>

                  {!eventForm.isOnline && (
                    <TextInput
                      placeholder="Location"
                      placeholderTextColor="#6B7280"
                      value={eventForm.location}
                      onChangeText={(text) => setEventForm({ ...eventForm, location: text })}
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                    />
                  )}

                  <TextInput
                    placeholder="Stream URL"
                    placeholderTextColor="#6B7280"
                    value={eventForm.streamUrl}
                    onChangeText={(text) => setEventForm({ ...eventForm, streamUrl: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />

                  <TextInput
                    placeholder="Registration URL"
                    placeholderTextColor="#6B7280"
                    value={eventForm.registrationUrl}
                    onChangeText={(text) => setEventForm({ ...eventForm, registrationUrl: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />

                  <TextInput
                    placeholder="Tags (comma separated)"
                    placeholderTextColor="#6B7280"
                    value={eventForm.tags}
                    onChangeText={(text) => setEventForm({ ...eventForm, tags: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />

                  {/* Toggles */}
                  <View className="flex-row mb-6">
                    <Pressable
                      onPress={() => setEventForm({ ...eventForm, isActive: !eventForm.isActive })}
                      className="flex-1 flex-row items-center mr-4"
                    >
                      <View
                        className={`w-6 h-6 rounded-md border-2 mr-2 items-center justify-center ${
                          eventForm.isActive ? "bg-green-600 border-green-600" : "border-gray-600"
                        }`}
                      >
                        {eventForm.isActive && <Ionicons name="checkmark" size={16} color="white" />}
                      </View>
                      <Text className="text-white">Active</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setEventForm({ ...eventForm, isFeatured: !eventForm.isFeatured })}
                      className="flex-1 flex-row items-center"
                    >
                      <View
                        className={`w-6 h-6 rounded-md border-2 mr-2 items-center justify-center ${
                          eventForm.isFeatured ? "bg-purple-600 border-purple-600" : "border-gray-600"
                        }`}
                      >
                        {eventForm.isFeatured && <Ionicons name="checkmark" size={16} color="white" />}
                      </View>
                      <Text className="text-white">Featured</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={handleSaveEvent}
                    className="bg-yellow-600 py-4 rounded-xl mb-6"
                  >
                    <Text className="text-white text-center font-bold">
                      {editingEvent ? "Save Changes" : "Create Event"}
                    </Text>
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

export default AdminNewsScreen;
