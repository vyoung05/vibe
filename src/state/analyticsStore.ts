import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StreamAnalytics, DailyStats, AnalyticsSummary } from "../types";
import { streamerAchievements } from "../data/streamerAchievements";

interface AnalyticsState {
  streamAnalytics: StreamAnalytics[];
  dailyStats: DailyStats[];

  // Start a new stream session
  startStream: (streamerId: string, streamTitle: string, platform?: string) => StreamAnalytics;

  // End a stream session
  endStream: (streamId: string, peakViewers: number, averageViewers: number, totalMessages: number, newFollowers: number) => void;

  // Update stream metrics in real-time
  updateStreamMetrics: (streamId: string, peakViewers: number, averageViewers: number, totalMessages: number) => void;

  // Get analytics for a specific streamer
  getStreamerAnalytics: (streamerId: string) => StreamAnalytics[];

  // Get summary analytics for a streamer
  getAnalyticsSummary: (streamerId: string) => AnalyticsSummary;

  // Get daily stats for a date range
  getDailyStats: (streamerId: string, days: number) => DailyStats[];

  // Record daily stats
  recordDailyStats: (streamerId: string, date: string, data: Partial<DailyStats>) => void;

  // Check for new achievements and return newly unlocked ones
  checkAchievements: (streamerId: string, currentAchievements: string[]) => string[];

  // Clear all analytics for a streamer
  clearStreamerAnalytics: (streamerId: string) => void;

  // Generate mock analytics data for testing
  generateMockAnalytics: (streamerId: string) => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      streamAnalytics: [],
      dailyStats: [],

      startStream: (streamerId, streamTitle, platform) => {
        const newStream: StreamAnalytics = {
          id: `stream_${Date.now()}_${streamerId}`,
          streamerId,
          streamTitle,
          startTime: new Date().toISOString(),
          peakViewers: 0,
          averageViewers: 0,
          totalMessages: 0,
          newFollowers: 0,
          platform,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          streamAnalytics: [...state.streamAnalytics, newStream],
        }));

        return newStream;
      },

      endStream: (streamId, peakViewers, averageViewers, totalMessages, newFollowers) => {
        const now = new Date().toISOString();

        set((state) => ({
          streamAnalytics: state.streamAnalytics.map((stream) => {
            if (stream.id === streamId) {
              const startTime = new Date(stream.startTime);
              const endTime = new Date(now);
              const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000); // minutes

              return {
                ...stream,
                endTime: now,
                duration,
                peakViewers,
                averageViewers,
                totalMessages,
                newFollowers,
              };
            }
            return stream;
          }),
        }));
      },

      updateStreamMetrics: (streamId, peakViewers, averageViewers, totalMessages) => {
        set((state) => ({
          streamAnalytics: state.streamAnalytics.map((stream) => {
            if (stream.id === streamId) {
              return {
                ...stream,
                peakViewers: Math.max(stream.peakViewers, peakViewers),
                averageViewers,
                totalMessages,
              };
            }
            return stream;
          }),
        }));
      },

      getStreamerAnalytics: (streamerId) => {
        return get().streamAnalytics.filter((s) => s.streamerId === streamerId);
      },

      getAnalyticsSummary: (streamerId) => {
        const streams = get().streamAnalytics.filter((s) => s.streamerId === streamerId && s.endTime);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentStreams = streams.filter(
          (s) => new Date(s.startTime) >= thirtyDaysAgo
        );

        const totalStreams = streams.length;
        const totalStreamTime = streams.reduce((acc, s) => acc + (s.duration || 0), 0);
        const averageStreamDuration = totalStreams > 0 ? totalStreamTime / totalStreams : 0;
        const totalMessages = streams.reduce((acc, s) => acc + s.totalMessages, 0);
        const peakViewers = Math.max(...streams.map((s) => s.peakViewers), 0);
        const averageViewers = totalStreams > 0
          ? streams.reduce((acc, s) => acc + s.averageViewers, 0) / totalStreams
          : 0;
        const totalViews = streams.reduce((acc, s) => acc + s.peakViewers, 0);
        const followerGrowth = recentStreams.reduce((acc, s) => acc + s.newFollowers, 0);
        const engagementRate = totalViews > 0 ? totalMessages / totalViews : 0;

        // Get total followers from daily stats
        const dailyStats = get().dailyStats.filter((s) => s.date.includes(streamerId));
        const latestStats = dailyStats[dailyStats.length - 1];
        const totalFollowers = latestStats?.followers || 0;

        return {
          streamerId,
          totalStreams,
          totalStreamTime,
          averageStreamDuration,
          totalFollowers,
          followerGrowth,
          totalViews,
          averageViewers: Math.round(averageViewers),
          peakViewers,
          totalMessages,
          engagementRate: Math.round(engagementRate * 100) / 100,
          lastUpdated: new Date().toISOString(),
        };
      },

      getDailyStats: (streamerId, days) => {
        const stats = get().dailyStats.filter((s) => s.date.includes(streamerId));
        return stats.slice(-days);
      },

      recordDailyStats: (streamerId, date, data) => {
        const statsId = `${streamerId}_${date}`;

        set((state) => {
          const existingIndex = state.dailyStats.findIndex((s) => s.date === statsId);

          if (existingIndex >= 0) {
            // Update existing stats
            const updated = [...state.dailyStats];
            updated[existingIndex] = {
              ...updated[existingIndex],
              ...data,
            };
            return { dailyStats: updated };
          } else {
            // Create new stats
            const newStats: DailyStats = {
              date: statsId,
              followers: data.followers || 0,
              views: data.views || 0,
              messages: data.messages || 0,
              streamDuration: data.streamDuration || 0,
              streamCount: data.streamCount || 0,
            };
            return { dailyStats: [...state.dailyStats, newStats] };
          }
        });
      },

      checkAchievements: (streamerId, currentAchievements) => {
        const summary = get().getAnalyticsSummary(streamerId);
        const newlyUnlocked: string[] = [];

        // Check each achievement
        streamerAchievements.forEach((achievement) => {
          // Skip if already unlocked
          if (currentAchievements.includes(achievement.id)) {
            return;
          }

          // Check if requirement is met based on metric
          let metricValue = 0;
          switch (achievement.metric) {
            case "totalStreams":
              metricValue = summary.totalStreams;
              break;
            case "totalFollowers":
              metricValue = summary.totalFollowers;
              break;
            case "peakViewers":
              metricValue = summary.peakViewers;
              break;
            case "totalMessages":
              metricValue = summary.totalMessages;
              break;
            case "totalStreamTime":
              metricValue = summary.totalStreamTime;
              break;
            case "averageViewers":
              metricValue = summary.averageViewers;
              break;
          }

          // If requirement met, add to newly unlocked
          if (metricValue >= achievement.requirement) {
            newlyUnlocked.push(achievement.id);
          }
        });

        return newlyUnlocked;
      },

      clearStreamerAnalytics: (streamerId) => {
        set((state) => ({
          streamAnalytics: state.streamAnalytics.filter((s) => s.streamerId !== streamerId),
          dailyStats: state.dailyStats.filter((s) => !s.date.includes(streamerId)),
        }));
      },

      generateMockAnalytics: (streamerId) => {
        const mockStreams: StreamAnalytics[] = [];
        const mockDailyStats: DailyStats[] = [];
        const today = new Date();

        // Generate 30 days of mock data
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];

          // Random streams per day (0-2)
          const streamsPerDay = Math.floor(Math.random() * 3);
          let dailyViews = 0;
          let dailyMessages = 0;
          let dailyDuration = 0;

          for (let j = 0; j < streamsPerDay; j++) {
            const streamDate = new Date(date);
            streamDate.setHours(12 + j * 4, 0, 0, 0);
            const duration = 60 + Math.floor(Math.random() * 180); // 1-4 hours
            const peakViewers = 50 + Math.floor(Math.random() * 200);
            const averageViewers = Math.floor(peakViewers * 0.7);
            const totalMessages = Math.floor(peakViewers * (2 + Math.random() * 3));
            const newFollowers = Math.floor(Math.random() * 15);

            const stream: StreamAnalytics = {
              id: `stream_${streamDate.getTime()}_${streamerId}`,
              streamerId,
              streamTitle: `Stream ${j + 1} - ${dateStr}`,
              startTime: streamDate.toISOString(),
              endTime: new Date(streamDate.getTime() + duration * 60000).toISOString(),
              duration,
              peakViewers,
              averageViewers,
              totalMessages,
              newFollowers,
              platform: ["Twitch", "YouTube", "TikTok"][Math.floor(Math.random() * 3)],
              createdAt: streamDate.toISOString(),
            };

            mockStreams.push(stream);
            dailyViews += peakViewers;
            dailyMessages += totalMessages;
            dailyDuration += duration;
          }

          // Create daily stats
          const dailyStat: DailyStats = {
            date: `${streamerId}_${dateStr}`,
            followers: 1000 + i * 5 + Math.floor(Math.random() * 20),
            views: dailyViews,
            messages: dailyMessages,
            streamDuration: dailyDuration,
            streamCount: streamsPerDay,
          };

          mockDailyStats.push(dailyStat);
        }

        set((state) => ({
          streamAnalytics: [
            ...state.streamAnalytics.filter((s) => s.streamerId !== streamerId),
            ...mockStreams,
          ],
          dailyStats: [
            ...state.dailyStats.filter((s) => !s.date.includes(streamerId)),
            ...mockDailyStats,
          ],
        }));
      },
    }),
    {
      name: "analytics-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
