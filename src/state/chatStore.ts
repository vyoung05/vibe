import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ChatMessage, ChatRoom, DirectMessage, Conversation } from "../types";

interface ChatState {
  chatRooms: ChatRoom[];
  chatMessages: ChatMessage[];
  directMessages: DirectMessage[];
  conversations: Conversation[];

  // Chat Room Actions
  createChatRoom: (streamerId: string, streamerName: string) => ChatRoom;
  getChatRoom: (streamerId: string) => ChatRoom | undefined;
  closeChatRoom: (streamerId: string) => void;
  incrementParticipantCount: (chatRoomId: string) => void;
  decrementParticipantCount: (chatRoomId: string) => void;

  // Chat Message Actions
  sendChatMessage: (
    chatRoomId: string,
    userId: string,
    username: string,
    userAvatar: string | undefined,
    userTier: "free" | "superfan",
    message: string,
    type?: "text" | "emote" | "system",
    emote?: string
  ) => void;
  getChatMessages: (chatRoomId: string) => ChatMessage[];
  clearChatMessages: (chatRoomId: string) => void;

  // Direct Message Actions
  sendDirectMessage: (
    senderId: string,
    receiverId: string,
    senderName: string,
    senderAvatar: string | undefined,
    message: string
  ) => void;
  getConversation: (userId: string, otherUserId: string) => Conversation | undefined;
  getConversations: (userId: string) => Conversation[];
  getDirectMessages: (conversationId: string) => DirectMessage[];
  markConversationRead: (conversationId: string, userId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chatRooms: [],
      chatMessages: [],
      directMessages: [],
      conversations: [],

      createChatRoom: (streamerId, streamerName) => {
        const existing = get().chatRooms.find((r) => r.streamerId === streamerId);
        if (existing) {
          set((state) => ({
            chatRooms: state.chatRooms.map((r) =>
              r.streamerId === streamerId ? { ...r, isActive: true } : r
            ),
          }));
          return existing;
        }

        const newRoom: ChatRoom = {
          id: "chatroom-" + streamerId,
          streamerId,
          streamerName,
          isActive: true,
          participantCount: 0,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ chatRooms: [...state.chatRooms, newRoom] }));
        return newRoom;
      },

      getChatRoom: (streamerId) => {
        return get().chatRooms.find((r) => r.streamerId === streamerId);
      },

      closeChatRoom: (streamerId) => {
        set((state) => ({
          chatRooms: state.chatRooms.map((r) =>
            r.streamerId === streamerId ? { ...r, isActive: false, participantCount: 0 } : r
          ),
        }));
      },

      incrementParticipantCount: (chatRoomId) => {
        set((state) => ({
          chatRooms: state.chatRooms.map((r) =>
            r.id === chatRoomId ? { ...r, participantCount: r.participantCount + 1 } : r
          ),
        }));
      },

      decrementParticipantCount: (chatRoomId) => {
        set((state) => ({
          chatRooms: state.chatRooms.map((r) =>
            r.id === chatRoomId
              ? { ...r, participantCount: Math.max(0, r.participantCount - 1) }
              : r
          ),
        }));
      },

      sendChatMessage: (chatRoomId, userId, username, userAvatar, userTier, message, type = "text", emote) => {
        const newMessage: ChatMessage = {
          id: "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9),
          chatRoomId,
          userId,
          username,
          userAvatar,
          userTier,
          message,
          type,
          emote,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          chatMessages: [...state.chatMessages, newMessage],
        }));
      },

      getChatMessages: (chatRoomId) => {
        return get().chatMessages.filter((m) => m.chatRoomId === chatRoomId);
      },

      clearChatMessages: (chatRoomId) => {
        set((state) => ({
          chatMessages: state.chatMessages.filter((m) => m.chatRoomId !== chatRoomId),
        }));
      },

      sendDirectMessage: (senderId, receiverId, senderName, senderAvatar, message) => {
        const state = get();
        const conversationId = [senderId, receiverId].sort().join("-");

        const newMessage: DirectMessage = {
          id: "dm-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9),
          senderId,
          receiverId,
          senderName,
          senderAvatar,
          message,
          read: false,
          createdAt: new Date().toISOString(),
        };

        // Check if conversation exists
        const existingConversation = state.conversations.find((c) => c.id === conversationId);

        if (existingConversation) {
          // Update existing conversation
          set((state) => ({
            directMessages: [...state.directMessages, newMessage],
            conversations: state.conversations.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    lastMessage: newMessage,
                    unreadCount: c.unreadCount + 1,
                    updatedAt: new Date().toISOString(),
                  }
                : c
            ),
          }));
        } else {
          // Create new conversation
          const newConversation: Conversation = {
            id: conversationId,
            participants: [senderId, receiverId],
            participantNames: [senderName, ""],
            participantAvatars: [senderAvatar, undefined],
            lastMessage: newMessage,
            unreadCount: 1,
            updatedAt: new Date().toISOString(),
          };

          set((state) => ({
            directMessages: [...state.directMessages, newMessage],
            conversations: [...state.conversations, newConversation],
          }));
        }
      },

      getConversation: (userId, otherUserId) => {
        const conversationId = [userId, otherUserId].sort().join("-");
        return get().conversations.find((c) => c.id === conversationId);
      },

      getConversations: (userId) => {
        return get()
          .conversations.filter((c) => c.participants.includes(userId))
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      },

      getDirectMessages: (conversationId) => {
        return get().directMessages.filter(
          (m) => [m.senderId, m.receiverId].sort().join("-") === conversationId
        );
      },

      markConversationRead: (conversationId, userId) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c
          ),
          directMessages: state.directMessages.map((m) => {
            const msgConvId = [m.senderId, m.receiverId].sort().join("-");
            if (msgConvId === conversationId && m.receiverId === userId) {
              return { ...m, read: true };
            }
            return m;
          }),
        }));
      },
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
