import { create } from "zustand";
import { Audio, AVPlaybackStatus } from "expo-av";
import type { Track } from "../types";

interface MusicState {
  // Playback state
  currentTrack: Track | null;
  sound: Audio.Sound | null;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  duration: number;

  // Queue
  queue: Track[];
  currentIndex: number;

  // Player controls
  playTrack: (track: Track) => Promise<void>;
  pauseTrack: () => Promise<void>;
  resumeTrack: () => Promise<void>;
  stopTrack: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  setQueue: (tracks: Track[], startIndex?: number) => void;

  // Internal state updates
  updatePlaybackStatus: (status: AVPlaybackStatus) => void;
  cleanup: () => Promise<void>;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentTrack: null,
  sound: null,
  isPlaying: false,
  isLoading: false,
  position: 0,
  duration: 0,
  queue: [],
  currentIndex: -1,

  playTrack: async (track: Track) => {
    console.log("[MusicStore] Playing track:", track.title);
    const { sound: currentSound } = get();

    // Stop and unload current sound if exists
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    }

    try {
      set({ isLoading: true, currentTrack: track });

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Create and load sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.audioUrl },
        { shouldPlay: true },
        (status) => get().updatePlaybackStatus(status)
      );

      set({
        sound: newSound,
        isPlaying: true,
        isLoading: false,
      });

      console.log("[MusicStore] Track loaded and playing");
    } catch (error) {
      console.error("[MusicStore] Error playing track:", error);
      set({ isLoading: false, isPlaying: false });
    }
  },

  pauseTrack: async () => {
    const { sound } = get();
    if (sound) {
      await sound.pauseAsync();
      set({ isPlaying: false });
      console.log("[MusicStore] Track paused");
    }
  },

  resumeTrack: async () => {
    const { sound } = get();
    if (sound) {
      await sound.playAsync();
      set({ isPlaying: true });
      console.log("[MusicStore] Track resumed");
    }
  },

  stopTrack: async () => {
    const { sound } = get();
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      set({
        sound: null,
        isPlaying: false,
        position: 0,
        currentTrack: null
      });
      console.log("[MusicStore] Track stopped");
    }
  },

  seekTo: async (position: number) => {
    const { sound } = get();
    if (sound) {
      await sound.setPositionAsync(position);
      console.log("[MusicStore] Seeked to:", position);
    }
  },

  skipNext: async () => {
    const { queue, currentIndex, playTrack } = get();
    if (currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1;
      set({ currentIndex: nextIndex });
      await playTrack(queue[nextIndex]);
      console.log("[MusicStore] Skipped to next track");
    }
  },

  skipPrevious: async () => {
    const { queue, currentIndex, playTrack } = get();
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      set({ currentIndex: prevIndex });
      await playTrack(queue[prevIndex]);
      console.log("[MusicStore] Skipped to previous track");
    }
  },

  setQueue: (tracks: Track[], startIndex: number = 0) => {
    set({ queue: tracks, currentIndex: startIndex });
    console.log("[MusicStore] Queue set with", tracks.length, "tracks");
  },

  updatePlaybackStatus: (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      set({
        position: status.positionMillis,
        duration: status.durationMillis || 0,
        isPlaying: status.isPlaying,
      });

      // Auto-play next track when current finishes
      if (status.didJustFinish && !status.isLooping) {
        const { skipNext, queue, currentIndex } = get();
        if (currentIndex < queue.length - 1) {
          skipNext();
        }
      }
    }
  },

  cleanup: async () => {
    const { sound } = get();
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
    set({
      sound: null,
      currentTrack: null,
      isPlaying: false,
      position: 0,
      duration: 0,
    });
    console.log("[MusicStore] Cleanup complete");
  },
}));
