import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNewsStore, NewsItem, GamingEvent } from "../state/newsStore";

interface GamingNewsFeedProps {
  maxNews?: number;
  maxEvents?: number;
  showEvents?: boolean;
  onSeeAllNews?: () => void;
  onSeeAllEvents?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  gaming: "#10B981",
  esports: "#F59E0B",
  streaming: "#A855F7",
  tech: "#3B82F6",
  announcement: "#EF4444",
};

const CATEGORY_ICONS: Record<string, string> = {
  gaming: "game-controller",
  esports: "trophy",
  streaming: "videocam",
  tech: "hardware-chip",
  announcement: "megaphone",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  tournament: "#F59E0B",
  livestream: "#EF4444",
  release: "#10B981",
  community: "#A855F7",
  sale: "#3B82F6",
};

const EVENT_TYPE_ICONS: Record<string, string> = {
  tournament: "trophy",
  livestream: "radio",
  release: "rocket",
  community: "people",
  sale: "pricetag",
};

export const GamingNewsFeed: React.FC<GamingNewsFeedProps> = ({
  maxNews = 5,
  maxEvents = 3,
  showEvents = true,
  onSeeAllNews,
  onSeeAllEvents,
}) => {
  const getActiveNews = useNewsStore((s) => s.getActiveNews);
  const getUpcomingEvents = useNewsStore((s) => s.getUpcomingEvents);
  const getFeaturedEvents = useNewsStore((s) => s.getFeaturedEvents);
  const incrementViewCount = useNewsStore((s) => s.incrementViewCount);

  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<GamingEvent | null>(null);

  const activeNews = getActiveNews().slice(0, maxNews);
  const upcomingEvents = getUpcomingEvents().slice(0, maxEvents);
  const featuredEvents = getFeaturedEvents();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatEventDate = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffMs = start.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `In ${diffDays} days`;

    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    if (endDate) {
      const end = new Date(endDate);
      return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;
    }
    return start.toLocaleDateString(undefined, options);
  };

  const handleOpenNews = (news: NewsItem) => {
    incrementViewCount(news.id);
    if (news.sourceUrl) {
      Linking.openURL(news.sourceUrl);
    } else {
      setSelectedNews(news);
    }
  };

  const handleOpenEvent = (event: GamingEvent) => {
    if (event.registrationUrl) {
      Linking.openURL(event.registrationUrl);
    } else if (event.streamUrl) {
      Linking.openURL(event.streamUrl);
    } else {
      setSelectedEvent(event);
    }
  };

  if (activeNews.length === 0 && upcomingEvents.length === 0) {
    return null; // Don't render if no content
  }

  return (
    <View className="mb-6">
      {/* Gaming News Section */}
      {activeNews.length > 0 && (
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-4 mb-3">
            <View className="flex-row items-center">
              <Ionicons name="newspaper" size={20} color="#A855F7" />
              <Text className="text-white font-bold text-lg ml-2">Gaming News</Text>
            </View>
            {onSeeAllNews && (
              <Pressable onPress={onSeeAllNews}>
                <Text className="text-purple-400 text-sm">See All</Text>
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {activeNews.map((news) => (
              <Pressable
                key={news.id}
                onPress={() => handleOpenNews(news)}
                className="bg-[#151520] rounded-xl mr-3 overflow-hidden"
                style={{ width: 280 }}
              >
                {news.imageUrl && (
                  <Image
                    source={{ uri: news.imageUrl }}
                    style={{ width: "100%", height: 140 }}
                    contentFit="cover"
                  />
                )}
                <View className="p-3">
                  {/* Category Badge */}
                  <View className="flex-row items-center mb-2">
                    <View
                      className="flex-row items-center px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${CATEGORY_COLORS[news.category]}20` }}
                    >
                      <Ionicons
                        name={CATEGORY_ICONS[news.category] as any}
                        size={12}
                        color={CATEGORY_COLORS[news.category]}
                      />
                      <Text
                        className="text-xs font-bold ml-1 capitalize"
                        style={{ color: CATEGORY_COLORS[news.category] }}
                      >
                        {news.category}
                      </Text>
                    </View>
                    {news.isPinned && (
                      <View className="bg-yellow-600/20 px-2 py-1 rounded-full ml-2">
                        <Ionicons name="pin" size={12} color="#EAB308" />
                      </View>
                    )}
                  </View>

                  {/* Title */}
                  <Text className="text-white font-bold" numberOfLines={2}>
                    {news.title}
                  </Text>

                  {/* Summary */}
                  <Text className="text-gray-400 text-sm mt-1" numberOfLines={2}>
                    {news.summary}
                  </Text>

                  {/* Footer */}
                  <View className="flex-row items-center justify-between mt-3">
                    <Text className="text-gray-500 text-xs">
                      {formatDate(news.publishedAt)}
                    </Text>
                    {news.source && (
                      <Text className="text-gray-500 text-xs">{news.source}</Text>
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Upcoming Events Section */}
      {showEvents && upcomingEvents.length > 0 && (
        <View>
          <View className="flex-row items-center justify-between px-4 mb-3">
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={20} color="#F59E0B" />
              <Text className="text-white font-bold text-lg ml-2">Upcoming Events</Text>
            </View>
            {onSeeAllEvents && (
              <Pressable onPress={onSeeAllEvents}>
                <Text className="text-yellow-400 text-sm">See All</Text>
              </Pressable>
            )}
          </View>

          <View className="px-4">
            {upcomingEvents.map((event) => (
              <Pressable
                key={event.id}
                onPress={() => handleOpenEvent(event)}
                className="bg-[#151520] rounded-xl mb-3 overflow-hidden"
              >
                <View className="flex-row">
                  {event.imageUrl && (
                    <Image
                      source={{ uri: event.imageUrl }}
                      style={{ width: 100, height: 100 }}
                      contentFit="cover"
                    />
                  )}
                  <View className="flex-1 p-3">
                    {/* Event Type & Featured Badge */}
                    <View className="flex-row items-center mb-1">
                      <View
                        className="flex-row items-center px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${EVENT_TYPE_COLORS[event.eventType]}20` }}
                      >
                        <Ionicons
                          name={EVENT_TYPE_ICONS[event.eventType] as any}
                          size={10}
                          color={EVENT_TYPE_COLORS[event.eventType]}
                        />
                        <Text
                          className="text-xs font-bold ml-1 capitalize"
                          style={{ color: EVENT_TYPE_COLORS[event.eventType] }}
                        >
                          {event.eventType}
                        </Text>
                      </View>
                      {event.isFeatured && (
                        <View className="bg-purple-600/20 px-2 py-0.5 rounded-full ml-2">
                          <Text className="text-purple-400 text-xs font-bold">FEATURED</Text>
                        </View>
                      )}
                    </View>

                    {/* Title */}
                    <Text className="text-white font-bold" numberOfLines={1}>
                      {event.title}
                    </Text>

                    {/* Date & Location */}
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                      <Text className="text-gray-400 text-xs ml-1">
                        {formatEventDate(event.startDate, event.endDate)}
                      </Text>
                    </View>

                    {event.location && (
                      <View className="flex-row items-center mt-0.5">
                        <Ionicons
                          name={event.isOnline ? "globe-outline" : "location-outline"}
                          size={12}
                          color="#9CA3AF"
                        />
                        <Text className="text-gray-400 text-xs ml-1">
                          {event.isOnline ? "Online" : event.location}
                        </Text>
                      </View>
                    )}

                    {/* Prize Pool */}
                    {event.prizePool && (
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="cash-outline" size={12} color="#10B981" />
                        <Text className="text-green-400 text-xs font-bold ml-1">
                          {event.prizePool}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* News Detail Modal */}
      <Modal visible={!!selectedNews} animationType="slide" transparent>
        <View className="flex-1 bg-black/50">
          <View className="flex-1 bg-[#0A0A0F] mt-20 rounded-t-3xl overflow-hidden">
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-800">
              <Text className="text-white font-bold text-lg flex-1" numberOfLines={1}>
                {selectedNews?.title}
              </Text>
              <Pressable onPress={() => setSelectedNews(null)} className="p-2">
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 p-6">
              {selectedNews?.imageUrl && (
                <Image
                  source={{ uri: selectedNews.imageUrl }}
                  style={{ width: "100%", height: 200, borderRadius: 12 }}
                  contentFit="cover"
                />
              )}

              <View className="mt-4">
                <View className="flex-row items-center mb-3">
                  <View
                    className="flex-row items-center px-2 py-1 rounded-full"
                    style={{ backgroundColor: `${CATEGORY_COLORS[selectedNews?.category || "gaming"]}20` }}
                  >
                    <Text
                      className="text-sm font-bold capitalize"
                      style={{ color: CATEGORY_COLORS[selectedNews?.category || "gaming"] }}
                    >
                      {selectedNews?.category}
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-sm ml-3">
                    {selectedNews && formatDate(selectedNews.publishedAt)}
                  </Text>
                </View>

                <Text className="text-white text-xl font-bold mb-3">
                  {selectedNews?.title}
                </Text>

                <Text className="text-gray-300 text-base leading-6">
                  {selectedNews?.content || selectedNews?.summary}
                </Text>

                {selectedNews?.source && (
                  <Text className="text-gray-500 text-sm mt-4">
                    Source: {selectedNews.source}
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Event Detail Modal */}
      <Modal visible={!!selectedEvent} animationType="slide" transparent>
        <View className="flex-1 bg-black/50">
          <View className="flex-1 bg-[#0A0A0F] mt-20 rounded-t-3xl overflow-hidden">
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-800">
              <Text className="text-white font-bold text-lg flex-1" numberOfLines={1}>
                {selectedEvent?.title}
              </Text>
              <Pressable onPress={() => setSelectedEvent(null)} className="p-2">
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 p-6">
              {selectedEvent?.imageUrl && (
                <Image
                  source={{ uri: selectedEvent.imageUrl }}
                  style={{ width: "100%", height: 200, borderRadius: 12 }}
                  contentFit="cover"
                />
              )}

              <View className="mt-4">
                <View className="flex-row items-center mb-3">
                  <View
                    className="flex-row items-center px-2 py-1 rounded-full"
                    style={{ backgroundColor: `${EVENT_TYPE_COLORS[selectedEvent?.eventType || "tournament"]}20` }}
                  >
                    <Text
                      className="text-sm font-bold capitalize"
                      style={{ color: EVENT_TYPE_COLORS[selectedEvent?.eventType || "tournament"] }}
                    >
                      {selectedEvent?.eventType}
                    </Text>
                  </View>
                  {selectedEvent?.isFeatured && (
                    <View className="bg-purple-600/20 px-2 py-1 rounded-full ml-2">
                      <Text className="text-purple-400 text-sm font-bold">FEATURED</Text>
                    </View>
                  )}
                </View>

                <Text className="text-white text-xl font-bold mb-3">
                  {selectedEvent?.title}
                </Text>

                {/* Event Details */}
                <View className="bg-[#151520] p-4 rounded-xl mb-4">
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="calendar-outline" size={20} color="#F59E0B" />
                    <Text className="text-white ml-3">
                      {selectedEvent && formatEventDate(selectedEvent.startDate, selectedEvent.endDate)}
                    </Text>
                  </View>

                  {selectedEvent?.location && (
                    <View className="flex-row items-center mb-3">
                      <Ionicons
                        name={selectedEvent.isOnline ? "globe-outline" : "location-outline"}
                        size={20}
                        color="#3B82F6"
                      />
                      <Text className="text-white ml-3">
                        {selectedEvent.isOnline ? "Online Event" : selectedEvent.location}
                      </Text>
                    </View>
                  )}

                  {selectedEvent?.prizePool && (
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="trophy-outline" size={20} color="#10B981" />
                      <Text className="text-green-400 font-bold ml-3">
                        Prize Pool: {selectedEvent.prizePool}
                      </Text>
                    </View>
                  )}

                  {selectedEvent?.game && (
                    <View className="flex-row items-center">
                      <Ionicons name="game-controller-outline" size={20} color="#A855F7" />
                      <Text className="text-white ml-3">{selectedEvent.game}</Text>
                    </View>
                  )}
                </View>

                <Text className="text-gray-300 text-base leading-6">
                  {selectedEvent?.description}
                </Text>

                {/* Action Buttons */}
                <View className="flex-row mt-6">
                  {selectedEvent?.streamUrl && (
                    <Pressable
                      onPress={() => selectedEvent.streamUrl && Linking.openURL(selectedEvent.streamUrl)}
                      className="flex-1 bg-red-600 py-3 rounded-xl mr-2 flex-row items-center justify-center"
                    >
                      <Ionicons name="play" size={20} color="white" />
                      <Text className="text-white font-bold ml-2">Watch Stream</Text>
                    </Pressable>
                  )}
                  {selectedEvent?.registrationUrl && (
                    <Pressable
                      onPress={() => selectedEvent.registrationUrl && Linking.openURL(selectedEvent.registrationUrl)}
                      className="flex-1 bg-purple-600 py-3 rounded-xl flex-row items-center justify-center"
                    >
                      <Ionicons name="person-add" size={20} color="white" />
                      <Text className="text-white font-bold ml-2">Register</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default GamingNewsFeed;
