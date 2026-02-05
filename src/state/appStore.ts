import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Streamer, Content, Booking, MerchItem, User, Notification, VideoContent, Announcement, VerificationRequest, Report, ReportReason, Artist, Track, Album } from "../types";
import type { Post } from "../types/post";
import { syncFollowStreamer, syncUnfollowStreamer, syncFollowUser, syncUnfollowUser, syncFollowArtist, syncUnfollowArtist } from "../utils/followerSync";
interface UserAccount {
  user: User;
  password: string;
}

interface StreamerAccount {
  streamer: Streamer;
  password: string;
}

interface ArtistAccount {
  artist: Artist;
  password: string;
}

// Threshold for becoming an influencer (number of invited friends)
const INFLUENCER_THRESHOLD = 10;
// Threshold for hot status (number of hot votes needed)
const HOT_THRESHOLD = 50;

interface AppState {
  streamers: Streamer[];
  artists: Artist[];
  content: Content[];
  videoContent: VideoContent[];
  bookings: Booking[];
  merch: MerchItem[];
  userAccounts: UserAccount[];
  streamerAccounts: StreamerAccount[];
  artistAccounts: ArtistAccount[];
  notifications: Notification[];
  announcements: Announcement[];
  posts: Post[];
  verificationRequests: VerificationRequest[];
  reports: Report[];

  // Streamer Actions
  setStreamers: (streamers: Streamer[]) => void;
  addStreamer: (streamer: Streamer) => void;
  updateStreamer: (id: string, data: Partial<Streamer>) => void;
  deleteStreamer: (id: string) => void;

  // Streamer Account Management
  addStreamerAccount: (account: StreamerAccount) => void;
  getStreamerAccount: (emailOrId: string) => StreamerAccount | undefined;
  updateStreamerAccount: (streamerId: string, data: Partial<StreamerAccount>) => void;

  // Content Actions
  setContent: (content: Content[]) => void;
  addContent: (content: Content) => void;
  likeContent: (contentId: string, userId: string) => void;
  addContentComment: (contentId: string, comment: any) => void;

  // Video Content Actions
  addVideoContent: (video: VideoContent) => void;
  updateVideoContent: (id: string, data: Partial<VideoContent>) => void;
  deleteVideoContent: (id: string) => void;
  likeVideoContent: (videoId: string, userId: string) => void;
  addVideoComment: (videoId: string, comment: any) => void;

  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, data: Partial<Booking>) => void;

  setMerch: (merch: MerchItem[]) => void;

  // User management
  addUserAccount: (account: UserAccount) => void;
  updateUserAccount: (userId: string, data: Partial<UserAccount>) => void;
  deleteUserAccount: (userId: string) => void;
  getUserAccount: (emailOrId: string) => UserAccount | undefined;
  getAllUsers: () => User[];

  // Post management
  addPost: (post: any) => void;
  getPosts: (currentUserId?: string) => Post[];
  getPost: (postId: string, currentUserId?: string) => Post | undefined;
  likePost: (postId: string, userId: string) => void;
  savePost: (postId: string, userId: string) => void;
  addPostComment: (postId: string, comment: any) => void;
  updatePost: (postId: string, userId: string, data: { caption?: string; imageUrl?: string; videoUrl?: string }) => boolean;
  deletePost: (postId: string, userId: string) => boolean;

  // Notification management
  addNotification: (notification: Notification) => void;
  markNotificationRead: (notificationId: string) => void;
  getUserNotifications: (userId: string) => Notification[];
  getUnreadCount: (userId: string) => number;

  // Follower management
  followStreamer: (userId: string, streamerId: string) => void;
  unfollowStreamer: (userId: string, streamerId: string) => void;
  notifyFollowersGoLive: (streamerId: string, streamerName: string, liveTitle: string) => void;

  // Announcement management
  addAnnouncement: (announcement: Announcement) => void;
  updateAnnouncement: (id: string, data: Partial<Announcement>) => void;
  dismissAnnouncement: (id: string) => void;
  deleteAnnouncement: (id: string) => void;

  // Verification request management
  submitVerificationRequest: (request: VerificationRequest) => void;
  approveVerification: (requestId: string, adminId: string) => void;
  rejectVerification: (requestId: string, adminId: string, reason: string) => void;
  getVerificationRequests: () => VerificationRequest[];
  getPendingVerificationRequests: () => VerificationRequest[];

  // User follow management (user-to-user)
  followUser: (followerId: string, targetUserId: string) => void;
  unfollowUser: (followerId: string, targetUserId: string) => void;

  // Invite friends / Influencer system
  recordInvitedFriend: (inviterId: string, invitedUserId: string) => void;
  checkInfluencerStatus: (userId: string) => void;

  // Discovery
  getSuggestedUsers: (currentUserId: string, followingUsers?: string[]) => User[];

  // Report management
  submitReport: (report: Report) => void;
  reviewReport: (reportId: string, adminId: string, action: string) => void;
  dismissReport: (reportId: string, adminId: string) => void;
  getReports: () => Report[];
  getPendingReports: () => Report[];

  // User suspension
  suspendUser: (userId: string, adminId: string, reason: string) => void;
  unsuspendUser: (userId: string, adminId: string) => void;
  deleteUserAccountPermanently: (userId: string) => void;

  // Artist management
  addArtist: (artist: Artist) => void;
  updateArtist: (id: string, data: Partial<Artist>) => void;
  deleteArtist: (id: string) => void;
  getArtist: (id: string) => Artist | undefined;
  addArtistAccount: (account: ArtistAccount) => void;
  updateArtistAccount: (artistId: string, data: { artist?: Artist; password?: string }) => void;
  getArtistAccount: (emailOrId: string) => ArtistAccount | undefined;
  followArtist: (userId: string, artistId: string) => void;
  unfollowArtist: (userId: string, artistId: string) => void;

  // Track management
  addTrack: (artistId: string, track: Track) => void;
  updateTrack: (artistId: string, trackId: string, data: Partial<Track>) => void;
  deleteTrack: (artistId: string, trackId: string) => void;
  incrementPlayCount: (artistId: string, trackId: string) => void;
  voteHot: (postId: string, userId: string) => void;
  voteNot: (postId: string, userId: string) => void;
  checkHotStatus: (artistId: string, trackId: string) => void;
  pushTrackToHot: (artistId: string, trackId: string) => void;
  getHotArtists: () => Artist[];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      streamers: [],
      artists: [],
      content: [],
      videoContent: [],
      bookings: [],
      merch: [],
      userAccounts: [],
      streamerAccounts: [],
      artistAccounts: [],
      notifications: [],
      announcements: [],
      posts: [],
      verificationRequests: [],
      reports: [],

      setStreamers: (streamers) => set({ streamers }),

      addStreamer: (streamer) =>
        set((state) => ({ streamers: [...state.streamers, streamer] })),

      updateStreamer: (id, data) =>
        set((state) => ({
          streamers: state.streamers.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        })),

      deleteStreamer: (id) =>
        set((state) => ({
          streamers: state.streamers.filter((s) => s.id !== id),
        })),

      // Streamer Account Management
      addStreamerAccount: (account) =>
        set((state) => {
          const exists = state.streamerAccounts.some(
            (acc) => acc.streamer.email === account.streamer.email || acc.streamer.id === account.streamer.id
          );
          if (exists) return state;
          return { streamerAccounts: [...state.streamerAccounts, account] };
        }),

      getStreamerAccount: (emailOrId) => {
        return get().streamerAccounts.find(
          (acc) => acc.streamer.id === emailOrId || acc.streamer.email === emailOrId
        );
      },

      updateStreamerAccount: (streamerId, data) =>
        set((state) => ({
          streamerAccounts: state.streamerAccounts.map((acc) =>
            acc.streamer.id === streamerId ? { ...acc, ...data } : acc
          ),
        })),

      setContent: (content) => set({ content }),

      addContent: (content) =>
        set((state) => ({ content: [...state.content, content] })),

      likeContent: (contentId, userId) =>
        set((state) => ({
          content: state.content.map((c) =>
            c.id === contentId
              ? {
                  ...c,
                  likes: c.likes.includes(userId)
                    ? c.likes.filter((id) => id !== userId)
                    : [...c.likes, userId],
                }
              : c
          ),
        })),

      addContentComment: (contentId, comment) =>
        set((state) => ({
          content: state.content.map((c) =>
            c.id === contentId ? { ...c, comments: [...c.comments, comment] } : c
          ),
        })),

      // Video Content Methods
      addVideoContent: (video) =>
        set((state) => ({ videoContent: [...state.videoContent, video] })),

      updateVideoContent: (id, data) =>
        set((state) => ({
          videoContent: state.videoContent.map((v) => (v.id === id ? { ...v, ...data } : v)),
        })),

      deleteVideoContent: (id) =>
        set((state) => ({
          videoContent: state.videoContent.filter((v) => v.id !== id),
        })),

      likeVideoContent: (videoId, userId) =>
        set((state) => ({
          videoContent: state.videoContent.map((v) =>
            v.id === videoId
              ? {
                  ...v,
                  likes: v.likes.includes(userId)
                    ? v.likes.filter((id) => id !== userId)
                    : [...v.likes, userId],
                }
              : v
          ),
        })),

      addVideoComment: (videoId, comment) =>
        set((state) => ({
          videoContent: state.videoContent.map((v) =>
            v.id === videoId ? { ...v, comments: [...v.comments, comment] } : v
          ),
        })),

      addBooking: (booking) =>
        set((state) => ({ bookings: [...state.bookings, booking] })),

      updateBooking: (id, data) =>
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, ...data } : b
          ),
        })),

      setMerch: (merch) => set({ merch }),

      addUserAccount: (account) =>
        set((state) => {
          const exists = state.userAccounts.some(
            (acc) => acc.user.email === account.user.email || acc.user.id === account.user.id
          );
          if (exists) return state;
          return { userAccounts: [...state.userAccounts, account] };
        }),

      updateUserAccount: (userId, data) =>
        set((state) => ({
          userAccounts: state.userAccounts.map((acc) =>
            acc.user.id === userId ? { ...acc, ...data } : acc
          ),
        })),

      deleteUserAccount: (userId) =>
        set((state) => ({
          userAccounts: state.userAccounts.filter((acc) => acc.user.id !== userId),
        })),

      getUserAccount: (emailOrId) => {
        return get().userAccounts.find((acc) => acc.user.id === emailOrId || acc.user.email === emailOrId);
      },

      getAllUsers: () => {
        return get().userAccounts.map((acc) => acc.user);
      },

      // Post management
      addPost: (post) =>
        set((state) => ({ posts: [post, ...state.posts] })),

      getPosts: (currentUserId) => {
        const posts = get().posts;
        return posts.map((post) => ({
          ...post,
          isLiked: currentUserId ? (post.likedBy || []).includes(currentUserId) : false,
          isSaved: currentUserId ? (post.savedBy || []).includes(currentUserId) : false,
        }));
      },

      getPost: (postId, currentUserId) => {
        const post = get().posts.find((p) => p.id === postId);
        if (!post) return undefined;
        return {
          ...post,
          isLiked: currentUserId ? (post.likedBy || []).includes(currentUserId) : false,
          isSaved: currentUserId ? (post.savedBy || []).includes(currentUserId) : false,
        };
      },

      likePost: (postId, userId) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  likedBy: (post.likedBy || []).includes(userId)
                    ? (post.likedBy || []).filter((id) => id !== userId)
                    : [...(post.likedBy || []), userId],
                  likeCount: (post.likedBy || []).includes(userId)
                    ? post.likeCount - 1
                    : post.likeCount + 1,
                }
              : post
          ),
        })),

      savePost: (postId, userId) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  savedBy: (post.savedBy || []).includes(userId)
                    ? (post.savedBy || []).filter((id) => id !== userId)
                    : [...(post.savedBy || []), userId],
                }
              : post
          ),
        })),

      addPostComment: (postId, comment) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comments: [...post.comments, comment],
                  commentCount: post.commentCount + 1,
                }
              : post
          ),
        })),

      updatePost: (postId, userId, data) => {
        const post = get().posts.find((p) => p.id === postId);
        if (!post || post.user.id !== userId) return false;

        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  caption: data.caption !== undefined ? data.caption : p.caption,
                  imageUrl: data.imageUrl !== undefined ? data.imageUrl : p.imageUrl,
                  videoUrl: data.videoUrl !== undefined ? data.videoUrl : p.videoUrl,
                }
              : p
          ),
        }));
        return true;
      },

      deletePost: (postId, userId) => {
        const post = get().posts.find((p) => p.id === postId);
        if (!post) return false;

        // Allow deletion if user owns the post OR if user is admin
        const isOwner = post.user.id === userId;
        const isAdmin = userId === "admin-001";

        if (!isOwner && !isAdmin) return false;

        set((state) => ({
          posts: state.posts.filter((p) => p.id !== postId),
        }));
        return true;
      },

      // Notification methods
      addNotification: (notification) =>
        set((state) => ({ notifications: [...state.notifications, notification] })),

      markNotificationRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        })),

      getUserNotifications: (userId) => {
        return get()
          .notifications.filter((n) => n.userId === userId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getUnreadCount: (userId) => {
        return get().notifications.filter((n) => n.userId === userId && !n.read).length;
      },

      // Follower management
      followStreamer: (userId, streamerId) => {
        set((state) => {
          // Check if already following
          const existingUserAccount = state.userAccounts.find((acc) => acc.user.id === userId);
          if (existingUserAccount && existingUserAccount.user.followedStreamers.includes(streamerId)) {
            // Already following, don't do anything
            return state;
          }

          // Sync to Supabase
          syncFollowStreamer(userId, streamerId);

          // Update user's followed streamers
          const updatedUserAccounts = state.userAccounts.map((acc) =>
            acc.user.id === userId
              ? {
                  ...acc,
                  user: {
                    ...acc.user,
                    followedStreamers: [...acc.user.followedStreamers, streamerId],
                  },
                }
              : acc
          );

          // Update streamer's follower count
          const updatedStreamers = state.streamers.map((s) =>
            s.id === streamerId ? { ...s, followerCount: s.followerCount + 1 } : s
          );

          // Get user info for notification
          const userAccount = updatedUserAccounts.find((acc) => acc.user.id === userId);
          if (userAccount) {
            // Create notification for streamer (if they have an account)
            const streamerAccount = state.streamerAccounts.find(
              (acc) => acc.streamer.id === streamerId
            );

            if (streamerAccount) {
              const notification: Notification = {
                id: "notif-" + Date.now(),
                userId: streamerId, // Notify streamer
                type: "follower",
                title: "New Follower!",
                message: `${userAccount.user.username} started following you`,
                read: false,
                createdAt: new Date().toISOString(),
                data: { followerId: userId, followerName: userAccount.user.username },
              };

              return {
                userAccounts: updatedUserAccounts,
                streamers: updatedStreamers,
                notifications: [...state.notifications, notification],
              };
            }
          }

          return {
            userAccounts: updatedUserAccounts,
            streamers: updatedStreamers,
          };
        });
      },

      unfollowStreamer: (userId, streamerId) => {
        set((state) => {
          // Check if not following
          const existingUserAccount = state.userAccounts.find((acc) => acc.user.id === userId);
          if (existingUserAccount && !existingUserAccount.user.followedStreamers.includes(streamerId)) {
            // Not following, don't do anything
            return state;
          }

          // Sync to Supabase
          syncUnfollowStreamer(userId, streamerId);

          // Update user's followed streamers
          const updatedUserAccounts = state.userAccounts.map((acc) =>
            acc.user.id === userId
              ? {
                  ...acc,
                  user: {
                    ...acc.user,
                    followedStreamers: acc.user.followedStreamers.filter((id) => id !== streamerId),
                  },
                }
              : acc
          );

          // Update streamer's follower count
          const updatedStreamers = state.streamers.map((s) =>
            s.id === streamerId
              ? { ...s, followerCount: Math.max(0, s.followerCount - 1) }
              : s
          );

          return {
            userAccounts: updatedUserAccounts,
            streamers: updatedStreamers,
          };
        });
      },

      // Announcement management
      addAnnouncement: (announcement) =>
        set((state) => ({ announcements: [...state.announcements, announcement] })),

      updateAnnouncement: (id, data) =>
        set((state) => ({
          announcements: state.announcements.map((a) =>
            a.id === id ? { ...a, ...data } : a
          ),
        })),

      dismissAnnouncement: (id) =>
        set((state) => ({
          announcements: state.announcements.map((a) =>
            a.id === id ? { ...a, isActive: false } : a
          ),
        })),

      deleteAnnouncement: (id) =>
        set((state) => ({
          announcements: state.announcements.filter((a) => a.id !== id),
        })),

      notifyFollowersGoLive: (streamerId, streamerName, liveTitle) => {
        set((state) => {
          // Find all users who follow this streamer
          const followerAccounts = state.userAccounts.filter((acc) =>
            acc.user.followedStreamers.includes(streamerId)
          );

          // Create notifications for all followers
          const newNotifications: Notification[] = followerAccounts.map((acc) => ({
            id: "notif-" + Date.now() + "-" + acc.user.id,
            userId: acc.user.id,
            type: "live",
            title: `${streamerName} is Live!`,
            message: liveTitle,
            read: false,
            createdAt: new Date().toISOString(),
            data: { streamerId, streamerName, liveTitle },
          }));

          return {
            notifications: [...state.notifications, ...newNotifications],
          };
        });
      },

      // Verification request management
      submitVerificationRequest: (request) =>
        set((state) => {
          // Check if user already has a pending request
          const existingRequest = state.verificationRequests.find(
            (r) => r.userId === request.userId && r.status === "pending"
          );
          if (existingRequest) return state;

          // Update user's verification status
          const updatedUserAccounts = state.userAccounts.map((acc) =>
            acc.user.id === request.userId
              ? { ...acc, user: { ...acc.user, verificationStatus: "pending" as const } }
              : acc
          );

          return {
            verificationRequests: [...state.verificationRequests, request],
            userAccounts: updatedUserAccounts,
          };
        }),

      approveVerification: (requestId, adminId) =>
        set((state) => {
          const request = state.verificationRequests.find((r) => r.id === requestId);
          if (!request) return state;

          // Update request status
          const updatedRequests = state.verificationRequests.map((r) =>
            r.id === requestId
              ? { ...r, status: "approved" as const, reviewedAt: new Date().toISOString(), reviewedBy: adminId }
              : r
          );

          // Update user's verification status
          const updatedUserAccounts = state.userAccounts.map((acc) =>
            acc.user.id === request.userId
              ? { ...acc, user: { ...acc.user, isVerified: true, verificationStatus: "verified" as const } }
              : acc
          );

          // Create notification for user
          const notification: Notification = {
            id: "notif-" + Date.now(),
            userId: request.userId,
            type: "achievement",
            title: "Verification Approved!",
            message: "Congratulations! Your account has been verified. You now have the purple checkmark.",
            read: false,
            createdAt: new Date().toISOString(),
          };

          return {
            verificationRequests: updatedRequests,
            userAccounts: updatedUserAccounts,
            notifications: [...state.notifications, notification],
          };
        }),

      rejectVerification: (requestId, adminId, reason) =>
        set((state) => {
          const request = state.verificationRequests.find((r) => r.id === requestId);
          if (!request) return state;

          // Update request status
          const updatedRequests = state.verificationRequests.map((r) =>
            r.id === requestId
              ? { ...r, status: "rejected" as const, reviewedAt: new Date().toISOString(), reviewedBy: adminId, rejectionReason: reason }
              : r
          );

          // Update user's verification status back to none
          const updatedUserAccounts = state.userAccounts.map((acc) =>
            acc.user.id === request.userId
              ? { ...acc, user: { ...acc.user, verificationStatus: "none" as const } }
              : acc
          );

          // Create notification for user
          const notification: Notification = {
            id: "notif-" + Date.now(),
            userId: request.userId,
            type: "general",
            title: "Verification Request Update",
            message: `Your verification request was not approved. Reason: ${reason}`,
            read: false,
            createdAt: new Date().toISOString(),
          };

          return {
            verificationRequests: updatedRequests,
            userAccounts: updatedUserAccounts,
            notifications: [...state.notifications, notification],
          };
        }),

      getVerificationRequests: () => {
        return get().verificationRequests;
      },

      getPendingVerificationRequests: () => {
        return get().verificationRequests.filter((r) => r.status === "pending");
      },

      // User follow management (user-to-user)
      followUser: (followerId, targetUserId) =>
        set((state) => {
          // Sync to Supabase
          syncFollowUser(followerId, targetUserId);

          // Update follower's followingUsers
          const updatedUserAccounts = state.userAccounts.map((acc) => {
            if (acc.user.id === followerId) {
              const followingUsers = acc.user.followingUsers || [];
              if (followingUsers.includes(targetUserId)) return acc;
              return {
                ...acc,
                user: { ...acc.user, followingUsers: [...followingUsers, targetUserId] },
              };
            }
            if (acc.user.id === targetUserId) {
              const followers = acc.user.followers || [];
              if (followers.includes(followerId)) return acc;
              return {
                ...acc,
                user: { ...acc.user, followers: [...followers, followerId] },
              };
            }
            return acc;
          });

          // Create notification for target user
          const followerAccount = state.userAccounts.find((acc) => acc.user.id === followerId);
          const notification: Notification = {
            id: "notif-" + Date.now(),
            userId: targetUserId,
            type: "follower",
            title: "New Follower!",
            message: `${followerAccount?.user.username || "Someone"} started following you`,
            read: false,
            createdAt: new Date().toISOString(),
            data: { followerId, followerName: followerAccount?.user.username },
          };

          return {
            userAccounts: updatedUserAccounts,
            notifications: [...state.notifications, notification],
          };
        }),

      unfollowUser: (followerId, targetUserId) =>
        set((state) => {
          // Sync to Supabase
          syncUnfollowUser(followerId, targetUserId);

          const updatedUserAccounts = state.userAccounts.map((acc) => {
            if (acc.user.id === followerId) {
              const followingUsers = acc.user.followingUsers || [];
              return {
                ...acc,
                user: { ...acc.user, followingUsers: followingUsers.filter((id) => id !== targetUserId) },
              };
            }
            if (acc.user.id === targetUserId) {
              const followers = acc.user.followers || [];
              return {
                ...acc,
                user: { ...acc.user, followers: followers.filter((id) => id !== followerId) },
              };
            }
            return acc;
          });

          return { userAccounts: updatedUserAccounts };
        }),

      // Invite friends / Influencer system
      recordInvitedFriend: (inviterId, invitedUserId) =>
        set((state) => {
          const updatedUserAccounts = state.userAccounts.map((acc) => {
            if (acc.user.id === inviterId) {
              const invitedFriends = acc.user.invitedFriends || [];
              if (invitedFriends.includes(invitedUserId)) return acc;

              const newInvitedFriends = [...invitedFriends, invitedUserId];
              const isInfluencer = newInvitedFriends.length >= INFLUENCER_THRESHOLD;

              return {
                ...acc,
                user: {
                  ...acc.user,
                  invitedFriends: newInvitedFriends,
                  isInfluencer,
                },
              };
            }
            return acc;
          });

          // Check if user just became an influencer
          const inviterAccount = updatedUserAccounts.find((acc) => acc.user.id === inviterId);
          const wasInfluencer = state.userAccounts.find((acc) => acc.user.id === inviterId)?.user.isInfluencer;
          const isNowInfluencer = inviterAccount?.user.isInfluencer;

          let notifications = state.notifications;
          if (!wasInfluencer && isNowInfluencer) {
            const notification: Notification = {
              id: "notif-" + Date.now(),
              userId: inviterId,
              type: "achievement",
              title: "Influencer Badge Earned!",
              message: `Congratulations! You have invited ${INFLUENCER_THRESHOLD} friends and earned the Influencer badge!`,
              read: false,
              createdAt: new Date().toISOString(),
            };
            notifications = [...notifications, notification];
          }

          return { userAccounts: updatedUserAccounts, notifications };
        }),

      checkInfluencerStatus: (userId) =>
        set((state) => {
          const updatedUserAccounts = state.userAccounts.map((acc) => {
            if (acc.user.id === userId) {
              const invitedFriends = acc.user.invitedFriends || [];
              const isInfluencer = invitedFriends.length >= INFLUENCER_THRESHOLD;
              return {
                ...acc,
                user: { ...acc.user, isInfluencer },
              };
            }
            return acc;
          });

          return { userAccounts: updatedUserAccounts };
        }),

      // Discovery - get suggested users to follow
      getSuggestedUsers: (currentUserId, followingUsers?: string[]) => {
        const state = get();
        
        // Try to find current user in userAccounts, but don't require it
        const currentUser = state.userAccounts.find((acc) => acc.user.id === currentUserId)?.user;
        
        // Use provided followingUsers or get from currentUser if found
        const alreadyFollowing = followingUsers || currentUser?.followingUsers || [];

        // Get all users except current user and already following
        return state.userAccounts
          .filter((acc) => acc.user.id !== currentUserId && !alreadyFollowing.includes(acc.user.id))
          .map((acc) => acc.user)
          .sort((a, b) => {
            // Prioritize verified users and influencers
            const aScore = (a.isVerified ? 2 : 0) + (a.isInfluencer ? 1 : 0);
            const bScore = (b.isVerified ? 2 : 0) + (b.isInfluencer ? 1 : 0);
            return bScore - aScore;
          })
          .slice(0, 20);
      },

      // Report management
      submitReport: (report) =>
        set((state) => ({
          reports: [...state.reports, report],
        })),

      reviewReport: (reportId, adminId, action) =>
        set((state) => {
          const updatedReports = state.reports.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  status: "action_taken" as const,
                  actionTaken: action,
                  reviewedBy: adminId,
                  reviewedAt: new Date().toISOString(),
                }
              : r
          );
          return { reports: updatedReports };
        }),

      dismissReport: (reportId, adminId) =>
        set((state) => {
          const updatedReports = state.reports.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  status: "dismissed" as const,
                  reviewedBy: adminId,
                  reviewedAt: new Date().toISOString(),
                }
              : r
          );
          return { reports: updatedReports };
        }),

      getReports: () => get().reports,

      getPendingReports: () => get().reports.filter((r) => r.status === "pending"),

      // User suspension
      suspendUser: (userId, adminId, reason) =>
        set((state) => {
          const updatedUserAccounts = state.userAccounts.map((acc) =>
            acc.user.id === userId
              ? {
                  ...acc,
                  user: {
                    ...acc.user,
                    accountStatus: "suspended" as const,
                    suspensionReason: reason,
                    suspendedAt: new Date().toISOString(),
                    suspendedBy: adminId,
                  },
                }
              : acc
          );

          // Create notification for suspended user
          const notification: Notification = {
            id: "notif-" + Date.now(),
            userId,
            type: "general",
            title: "Account Suspended",
            message: `Your account has been suspended. Reason: ${reason}. You cannot post until the investigation is complete.`,
            read: false,
            createdAt: new Date().toISOString(),
          };

          return {
            userAccounts: updatedUserAccounts,
            notifications: [...state.notifications, notification],
          };
        }),

      unsuspendUser: (userId, adminId) =>
        set((state) => {
          const updatedUserAccounts = state.userAccounts.map((acc) =>
            acc.user.id === userId
              ? {
                  ...acc,
                  user: {
                    ...acc.user,
                    accountStatus: "active" as const,
                    suspensionReason: undefined,
                    suspendedAt: undefined,
                    suspendedBy: undefined,
                  },
                }
              : acc
          );

          // Create notification for user
          const notification: Notification = {
            id: "notif-" + Date.now(),
            userId,
            type: "general",
            title: "Account Reinstated",
            message: "Your account suspension has been lifted. You can now post again.",
            read: false,
            createdAt: new Date().toISOString(),
          };

          return {
            userAccounts: updatedUserAccounts,
            notifications: [...state.notifications, notification],
          };
        }),

      deleteUserAccountPermanently: (userId) =>
        set((state) => ({
          userAccounts: state.userAccounts.filter((acc) => acc.user.id !== userId),
          posts: state.posts.filter((p) => p.user.id !== userId),
        })),

      // Artist management
      addArtist: (artist) =>
        set((state) => {
          const artistExists = state.artists.some((a) => a.id === artist.id);
          return artistExists ? state : { artists: [...state.artists, artist] };
        }),

      updateArtist: (id, data) =>
        set((state) => ({
          artists: state.artists.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),

      deleteArtist: (id) =>
        set((state) => ({
          artists: state.artists.filter((a) => a.id !== id),
          artistAccounts: state.artistAccounts.filter((acc) => acc.artist.id !== id),
        })),

      getArtist: (id) => get().artists.find((a) => a.id === id),

      addArtistAccount: (account) =>
        set((state) => {
          const artistExists = state.artists.some((a) => a.id === account.artist.id);
          return {
            artistAccounts: [...state.artistAccounts, account],
            artists: artistExists ? state.artists : [...state.artists, account.artist],
          };
        }),

      updateArtistAccount: (artistId, data) =>
        set((state) => ({
          artistAccounts: state.artistAccounts.map((acc) =>
            acc.artist.id === artistId
              ? {
                  ...acc,
                  artist: data.artist || acc.artist,
                  password: data.password || acc.password,
                }
              : acc
          ),
        })),

      getArtistAccount: (emailOrId) => {
        const state = get();
        return state.artistAccounts.find(
          (acc) => acc.artist.email === emailOrId || acc.artist.id === emailOrId
        );
      },

      followArtist: (userId, artistId) =>
        set((state) => {
          // Sync to Supabase
          syncFollowArtist(userId, artistId);

          // Update user's followedArtists
          const updatedUserAccounts = state.userAccounts.map((acc) =>
            acc.user.id === userId
              ? {
                  ...acc,
                  user: {
                    ...acc.user,
                    followedArtists: [...(acc.user.followedArtists || []), artistId],
                  },
                }
              : acc
          );

          // Update artist's follower count
          const updatedArtists = state.artists.map((a) =>
            a.id === artistId ? { ...a, followerCount: a.followerCount + 1 } : a
          );

          return { userAccounts: updatedUserAccounts, artists: updatedArtists };
        }),

      unfollowArtist: (userId, artistId) =>
        set((state) => {
          // Sync to Supabase
          syncUnfollowArtist(userId, artistId);

          // Update user's followedArtists
          const updatedUserAccounts = state.userAccounts.map((acc) =>
            acc.user.id === userId
              ? {
                  ...acc,
                  user: {
                    ...acc.user,
                    followedArtists: (acc.user.followedArtists || []).filter((id) => id !== artistId),
                  },
                }
              : acc
          );

          // Update artist's follower count
          const updatedArtists = state.artists.map((a) =>
            a.id === artistId ? { ...a, followerCount: Math.max(0, a.followerCount - 1) } : a
          );

          return { userAccounts: updatedUserAccounts, artists: updatedArtists };
        }),

      // Track management
      addTrack: (artistId, track) =>
        set((state) => ({
          artists: state.artists.map((a) =>
            a.id === artistId ? { ...a, tracks: [...a.tracks, track] } : a
          ),
        })),

      updateTrack: (artistId, trackId, data) =>
        set((state) => ({
          artists: state.artists.map((a) =>
            a.id === artistId
              ? {
                  ...a,
                  tracks: a.tracks.map((t) => (t.id === trackId ? { ...t, ...data } : t)),
                }
              : a
          ),
        })),

      deleteTrack: (artistId, trackId) =>
        set((state) => ({
          artists: state.artists.map((a) =>
            a.id === artistId
              ? { ...a, tracks: a.tracks.filter((t) => t.id !== trackId) }
              : a
          ),
        })),

      incrementPlayCount: (artistId, trackId) =>
        set((state) => ({
          artists: state.artists.map((a) =>
            a.id === artistId
              ? {
                  ...a,
                  totalPlays: a.totalPlays + 1,
                  tracks: a.tracks.map((t) =>
                    t.id === trackId ? { ...t, playCount: t.playCount + 1 } : t
                  ),
                }
              : a
          ),
        })),

      voteHot: (postId, userId) =>
        set((state) => {
          const updatedPosts = state.posts.map((p) =>
            p.id === postId ? { ...p, hotVotes: (p.hotVotes || 0) + 1 } : p
          );

          // Check if track reaches hot status
          const post = updatedPosts.find((p) => p.id === postId);
          if (post?.artistId && post?.trackId && (post.hotVotes || 0) >= HOT_THRESHOLD) {
            const hotPercentage = ((post.hotVotes || 0) / ((post.hotVotes || 0) + (post.notVotes || 0))) * 100;
            if (hotPercentage > 50) {
              // Update track to hot status
              const updatedArtists = state.artists.map((a) =>
                a.id === post.artistId
                  ? {
                      ...a,
                      tracks: a.tracks.map((t) =>
                        t.id === post.trackId ? { ...t, isHot: true } : t
                      ),
                    }
                  : a
              );

              // Create announcement
              const artist = state.artists.find((a) => a.id === post.artistId);
              if (artist) {
                const announcement: Announcement = {
                  id: "announce-" + Date.now(),
                  message: `${artist.stageName} just hit HOT status with their track!`,
                  createdBy: "system",
                  createdByName: "DDNS",
                  duration: 24,
                  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  createdAt: new Date().toISOString(),
                  isActive: true,
                };

                return {
                  posts: updatedPosts,
                  artists: updatedArtists,
                  announcements: [...state.announcements, announcement],
                };
              }

              return { posts: updatedPosts, artists: updatedArtists };
            }
          }

          return { posts: updatedPosts };
        }),

      voteNot: (postId, userId) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, notVotes: (p.notVotes || 0) + 1 } : p
          ),
        })),

      checkHotStatus: (artistId, trackId) =>
        set((state) => {
          const artist = state.artists.find((a) => a.id === artistId);
          const track = artist?.tracks.find((t) => t.id === trackId);

          if (track && track.hotVotes >= HOT_THRESHOLD) {
            const hotPercentage = (track.hotVotes / (track.hotVotes + track.notVotes)) * 100;
            if (hotPercentage > 50) {
              return {
                artists: state.artists.map((a) =>
                  a.id === artistId
                    ? {
                        ...a,
                        tracks: a.tracks.map((t) =>
                          t.id === trackId ? { ...t, isHot: true } : t
                        ),
                        hotStatus: true,
                        hotStatusDate: new Date().toISOString(),
                      }
                    : a
                ),
              };
            }
          }
          return state;
        }),

      pushTrackToHot: (artistId, trackId) =>
        set((state) => ({
          artists: state.artists.map((a) =>
            a.id === artistId
              ? {
                  ...a,
                  tracks: a.tracks.map((t) =>
                    t.id === trackId ? { ...t, isHot: true } : t
                  ),
                  hotStatus: true,
                  hotStatusDate: new Date().toISOString(),
                }
              : a
          ),
        })),

      getHotArtists: () => {
        return get().artists.filter((a) => a.hotStatus || a.tracks.some((t) => t.isHot));
      },
    }),
    {
      name: "app-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Deduplicate artists by ID
          const uniqueArtists = state.artists.filter(
            (artist, index, self) => index === self.findIndex((a) => a.id === artist.id)
          );
          if (uniqueArtists.length !== state.artists.length) {
            useAppStore.setState({ artists: uniqueArtists });
          }
        }
      },
    }
  )
);
