import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type NewsCategory = "gaming" | "esports" | "streaming" | "tech" | "announcement";
export type EventType = "tournament" | "livestream" | "release" | "community" | "sale";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content?: string;
  imageUrl?: string;
  category: NewsCategory;
  source?: string;
  sourceUrl?: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isActive: boolean;
  isPinned: boolean;
  viewCount: number;
  tags: string[];
}

export interface GamingEvent {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  eventType: EventType;
  startDate: string;
  endDate?: string;
  location?: string;
  isOnline: boolean;
  streamUrl?: string;
  registrationUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isActive: boolean;
  isFeatured: boolean;
  attendeeCount: number;
  game?: string;
  prizePool?: string;
  tags: string[];
}

interface NewsState {
  news: NewsItem[];
  events: GamingEvent[];
  lastFetch: number | null;

  // News actions
  addNews: (news: Omit<NewsItem, "id" | "createdAt" | "updatedAt" | "viewCount">) => void;
  updateNews: (id: string, updates: Partial<NewsItem>) => void;
  deleteNews: (id: string) => void;
  toggleNewsActive: (id: string) => void;
  toggleNewsPinned: (id: string) => void;
  incrementViewCount: (id: string) => void;

  // Event actions
  addEvent: (event: Omit<GamingEvent, "id" | "createdAt" | "updatedAt" | "attendeeCount">) => void;
  updateEvent: (id: string, updates: Partial<GamingEvent>) => void;
  deleteEvent: (id: string) => void;
  toggleEventActive: (id: string) => void;
  toggleEventFeatured: (id: string) => void;
  incrementAttendeeCount: (id: string) => void;

  // Getters
  getActiveNews: () => NewsItem[];
  getPinnedNews: () => NewsItem[];
  getNewsByCategory: (category: NewsCategory) => NewsItem[];
  getUpcomingEvents: () => GamingEvent[];
  getFeaturedEvents: () => GamingEvent[];
  getEventsByType: (type: EventType) => GamingEvent[];

  // Bulk actions
  clearAllNews: () => void;
  clearAllEvents: () => void;
}

export const useNewsStore = create<NewsState>()(
  persist(
    (set, get) => ({
      news: [],
      events: [],
      lastFetch: null,

      // News actions
      addNews: (newsData) => {
        const now = new Date().toISOString();
        const newNews: NewsItem = {
          ...newsData,
          id: `news-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: now,
          updatedAt: now,
          viewCount: 0,
        };
        set((state) => ({
          news: [newNews, ...state.news],
          lastFetch: Date.now(),
        }));
      },

      updateNews: (id, updates) => {
        set((state) => ({
          news: state.news.map((item) =>
            item.id === id
              ? { ...item, ...updates, updatedAt: new Date().toISOString() }
              : item
          ),
        }));
      },

      deleteNews: (id) => {
        set((state) => ({
          news: state.news.filter((item) => item.id !== id),
        }));
      },

      toggleNewsActive: (id) => {
        set((state) => ({
          news: state.news.map((item) =>
            item.id === id ? { ...item, isActive: !item.isActive } : item
          ),
        }));
      },

      toggleNewsPinned: (id) => {
        set((state) => ({
          news: state.news.map((item) =>
            item.id === id ? { ...item, isPinned: !item.isPinned } : item
          ),
        }));
      },

      incrementViewCount: (id) => {
        set((state) => ({
          news: state.news.map((item) =>
            item.id === id ? { ...item, viewCount: item.viewCount + 1 } : item
          ),
        }));
      },

      // Event actions
      addEvent: (eventData) => {
        const now = new Date().toISOString();
        const newEvent: GamingEvent = {
          ...eventData,
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: now,
          updatedAt: now,
          attendeeCount: 0,
        };
        set((state) => ({
          events: [newEvent, ...state.events],
        }));
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((item) =>
            item.id === id
              ? { ...item, ...updates, updatedAt: new Date().toISOString() }
              : item
          ),
        }));
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((item) => item.id !== id),
        }));
      },

      toggleEventActive: (id) => {
        set((state) => ({
          events: state.events.map((item) =>
            item.id === id ? { ...item, isActive: !item.isActive } : item
          ),
        }));
      },

      toggleEventFeatured: (id) => {
        set((state) => ({
          events: state.events.map((item) =>
            item.id === id ? { ...item, isFeatured: !item.isFeatured } : item
          ),
        }));
      },

      incrementAttendeeCount: (id) => {
        set((state) => ({
          events: state.events.map((item) =>
            item.id === id ? { ...item, attendeeCount: item.attendeeCount + 1 } : item
          ),
        }));
      },

      // Getters
      getActiveNews: () => {
        const { news } = get();
        return news
          .filter((item) => item.isActive)
          .sort((a, b) => {
            // Pinned items first, then by date
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
          });
      },

      getPinnedNews: () => {
        const { news } = get();
        return news.filter((item) => item.isActive && item.isPinned);
      },

      getNewsByCategory: (category) => {
        const { news } = get();
        return news
          .filter((item) => item.isActive && item.category === category)
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      },

      getUpcomingEvents: () => {
        const { events } = get();
        const now = new Date();
        return events
          .filter((item) => item.isActive && new Date(item.startDate) >= now)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      },

      getFeaturedEvents: () => {
        const { events } = get();
        return events.filter((item) => item.isActive && item.isFeatured);
      },

      getEventsByType: (type) => {
        const { events } = get();
        return events
          .filter((item) => item.isActive && item.eventType === type)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      },

      // Bulk actions
      clearAllNews: () => {
        set({ news: [] });
      },

      clearAllEvents: () => {
        set({ events: [] });
      },
    }),
    {
      name: "ddns-news-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
