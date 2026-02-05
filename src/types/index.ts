// Core type definitions for DDNS app

export type UserTier = "free" | "superfan";
export type UserRole = "user" | "admin" | "moderator" | "support";
export type VerificationStatus = "none" | "pending" | "verified";
export type AccountStatus = "active" | "suspended" | "deleted";

// Admin Permission Types
export interface AdminPermissions {
  // User Management
  viewUsers?: boolean;
  editUsers?: boolean;
  suspendUsers?: boolean;
  deleteUsers?: boolean;
  verifyUsers?: boolean;

  // Streamer Management
  viewStreamers?: boolean;
  createStreamers?: boolean;
  editStreamers?: boolean;
  deleteStreamers?: boolean;

  // Artist Management
  viewArtists?: boolean;
  createArtists?: boolean;
  editArtists?: boolean;
  deleteArtists?: boolean;
  manageTracks?: boolean;

  // Content Management
  viewContent?: boolean;
  deleteContent?: boolean;
  moderateContent?: boolean;

  // Reports & Moderation
  viewReports?: boolean;
  reviewReports?: boolean;
  takeAction?: boolean;

  // System Management
  createAnnouncements?: boolean;
  manageAdmins?: boolean; // Create/edit other admins
  viewAnalytics?: boolean;
  systemSettings?: boolean;

  // Merchant Management
  viewMerchants?: boolean;
  manageMerchants?: boolean;
  viewOrders?: boolean;
  manageOrders?: boolean;
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: AdminPermissions;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  bio?: string; // User's bio/about text
  tier: UserTier;
  role?: UserRole; // Admin role for super access
  permissions?: AdminPermissions; // Granular permissions for admins/moderators
  accountType?: "user" | "streamer" | "artist"; // Account type
  accountStatus?: AccountStatus; // Account status
  suspensionReason?: string; // Reason for suspension
  suspendedAt?: string; // When account was suspended
  suspendedBy?: string; // Admin who suspended
  referralCode: string;
  referredBy?: string; // User or Streamer ID who referred this user
  referrals?: string[]; // Array of user IDs who used this user's referral code
  followedStreamers: string[]; // Array of streamer IDs
  followedArtists?: string[]; // Array of artist IDs
  followingUsers?: string[]; // Array of user IDs the user follows
  followers?: string[]; // Array of user IDs who follow this user
  bookmarkedStreamers?: string[]; // Array of bookmarked streamer IDs
  achievements?: string[]; // Array of achievement IDs
  socialLinks?: SocialLinks; // User's social media links
  isVerified?: boolean; // Purple verification badge (admin granted)
  verificationStatus?: VerificationStatus; // Verification request status
  isInfluencer?: boolean; // Influencer badge (earned by inviting friends)
  invitedFriends?: string[]; // Array of user IDs invited by this user
  hasCompletedOnboarding?: boolean; // Whether user has completed onboarding
  createdAt: string;
}

// Report system types
export type ReportReason = "inappropriate" | "spam" | "harassment" | "fraud" | "hacking" | "hate_speech" | "violence" | "other";
export type ReportStatus = "pending" | "reviewed" | "action_taken" | "dismissed";
export type ReportTargetType = "post" | "user" | "comment";

export interface Report {
  id: string;
  reporterId: string; // User who reported
  reporterUsername: string;
  targetType: ReportTargetType;
  targetId: string; // Post ID, User ID, or Comment ID
  targetUserId?: string; // Owner of the reported content
  targetUsername?: string;
  reason: ReportReason;
  details?: string; // Additional details
  status: ReportStatus;
  actionTaken?: string; // Description of action taken
  reviewedBy?: string; // Admin who reviewed
  reviewedAt?: string;
  createdAt: string;
}

// Artist types
export interface Artist {
  id: string;
  name: string;
  stageName: string;
  email?: string;
  avatar: string;
  headerImages: string[];
  bio: string;
  genre?: string;
  socialLinks: SocialLinks;
  followerCount: number;
  referralCode: string;
  isVerified?: boolean;
  bookingSettings?: BookingSettings;
  events?: ArtistEvent[];
  tracks: Track[];
  albums: Album[];
  totalPlays: number;
  totalSales: number;
  hotStatus?: boolean; // Whether artist has achieved hot status
  hotStatusDate?: string; // When they achieved hot status
}

export interface Track {
  id: string;
  artistId: string;
  title: string;
  albumId?: string;
  coverArt: string;
  audioUrl: string;
  duration: number; // Duration in seconds
  price?: number; // Price to purchase (undefined = free)
  isSnippetOnly: boolean; // Only allow snippet playback
  snippetDuration?: number; // Snippet duration in seconds (default 30)
  playCount: number;
  hotVotes: number; // Number of "hot" votes
  notVotes: number; // Number of "not" votes
  purchaseCount: number;
  isHot?: boolean; // Whether track has achieved hot status
  createdAt: string;
}

export interface Album {
  id: string;
  artistId: string;
  title: string;
  coverArt: string;
  trackIds: string[];
  price?: number;
  releaseDate: string;
  description?: string;
}

export interface ArtistEvent {
  id: string;
  artistId: string;
  title: string;
  description: string;
  eventType: "concert" | "album_release" | "livestream" | "meet_greet" | "other";
  startDate: string;
  endDate?: string;
  location?: string;
  isOnline: boolean;
  ticketUrl?: string;
  price?: number;
  imageUrl?: string;
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  reason: string;
  socialProof?: string; // Links to social media profiles
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string; // Admin who reviewed
  rejectionReason?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Ionicons name
  color: string; // Hex color
  requirement: number; // Number needed to unlock
  type: "referrals" | "followers" | "bookings" | "special";
}

export interface Notification {
  id: string;
  userId: string;
  type: "referral" | "follower" | "achievement" | "booking" | "general" | "live";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: any; // Additional data for the notification
}

export type StreamPlatform = "twitch" | "youtube" | "kick";

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  twitch?: string;
  youtube?: string;
  kick?: string;
  spotify?: string;
  appleMusic?: string;
  soundcloud?: string;
}

export interface StreamSchedule {
  day: string; // e.g., "Monday", "Tuesday"
  startTime: string; // e.g., "18:00"
  endTime: string; // e.g., "22:00"
  timezone: string; // e.g., "EST"
}

export interface Streamer {
  id: string;
  name: string;
  gamertag: string;
  email?: string; // For admin-created streamers
  avatar: string;
  headerImages: string[]; // Carousel images
  bio: string;
  isLive: boolean;
  isVerified?: boolean; // Purple checkmark verification status
  liveStreamUrl?: string;
  liveTitle?: string;
  lastLiveDate?: string;
  socialLinks: SocialLinks;
  schedule: StreamSchedule[];
  followerCount: number;
  referralCode: string;
  streamerAchievements?: string[]; // Array of streamer achievement IDs
  bookingSettings?: BookingSettings; // Booking configuration
  events?: StreamerEvent[]; // Upcoming events
  streamPlatforms?: {
    twitch?: string; // Channel URL or embed ID
    youtube?: string; // Live stream URL or embed ID
    tiktok?: string; // Live stream URL
    instagram?: string; // Live stream URL
    kick?: string; // Live stream URL
  };
}

export type ContentVisibility = "public" | "free" | "superfan";

export interface Announcement {
  id: string;
  message: string;
  createdBy: string; // User ID (admin or streamer)
  createdByName: string;
  duration: number; // Duration in hours
  expiresAt: string; // ISO timestamp
  createdAt: string;
  isActive: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface VideoContent {
  id: string;
  streamerId: string;
  streamerName: string;
  streamerAvatar?: string; // Creator's avatar at time of posting
  title: string;
  description?: string;
  videoUrl: string; // URL to video
  thumbnailUrl?: string;
  likes: string[]; // Array of user IDs who liked
  comments: Comment[];
  createdAt: string;
  visibility: ContentVisibility;
}

export interface Content {
  id: string;
  streamerId: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  contentUrl: string; // YouTube, Twitch VOD, TikTok link, etc.
  visibility: ContentVisibility;
  likes: string[]; // Changed from number to array of user IDs
  comments: Comment[]; // Added comments
  createdAt: string;
}

export type BookingType = "shoutout" | "collab" | "private-game" | "event" | "meet-greet" | "coaching" | "custom";
export type BookingStatus = "pending" | "approved" | "declined" | "completed" | "cancelled";

export interface BookingService {
  id: string;
  type: BookingType;
  name: string;
  description: string;
  price: number;
  duration: number; // Duration in minutes
  isActive: boolean;
}

export interface BookingSettings {
  isBookable: boolean;
  services: BookingService[];
  minNotice: number; // Minimum hours notice required
  maxBookingsPerDay: number;
  bookingMessage?: string; // Custom message shown to users
  autoApprove: boolean;
}

export interface StreamerEvent {
  id: string;
  streamerId: string;
  title: string;
  description: string;
  eventType: "stream" | "tournament" | "collab" | "meet-greet" | "special" | "other";
  startDate: string; // ISO timestamp
  endDate?: string; // ISO timestamp
  location?: string; // Can be URL or physical location
  isOnline: boolean;
  maxAttendees?: number;
  currentAttendees: number;
  price?: number; // 0 or undefined for free events
  imageUrl?: string;
  isPublic: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  streamerIds: string[];
  serviceId?: string; // Reference to BookingService
  type: BookingType;
  preferredDate: string;
  preferredTime?: string;
  budget: number;
  notes?: string;
  status: BookingStatus;
  streamerResponse?: string; // Response message from streamer
  createdAt: string;
  updatedAt?: string;
}

export interface MerchItem {
  id: string;
  name: string;
  description: string;
  price: number;
  superFanPrice?: number; // Discounted price for Super Fans
  images: string[];
  sizes?: string[];
  stock: number;
}

export interface Post {
  id: string;
  streamerId?: string; // Optional, for team posts
  content: string;
  mediaUrl?: string;
  visibility: ContentVisibility;
  likes: number;
  createdAt: string;
}

// Chat types
export type MessageType = "text" | "emote" | "system";

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  userId: string;
  username: string;
  userAvatar?: string;
  userTier: UserTier;
  message: string;
  type: MessageType;
  emote?: string; // Emote identifier if type is "emote"
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  streamerId: string;
  streamerName: string;
  isActive: boolean; // Only active when streamer is live
  participantCount: number;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: string[]; // Array of user IDs
  participantNames: string[]; // Array of usernames
  participantAvatars: (string | undefined)[];
  lastMessage?: DirectMessage;
  unreadCount: number;
  updatedAt: string;
}

// Analytics types
export interface StreamAnalytics {
  id: string;
  streamerId: string;
  streamTitle: string;
  startTime: string;
  endTime?: string;
  duration?: number; // Duration in minutes
  peakViewers: number;
  averageViewers: number;
  totalMessages: number;
  newFollowers: number;
  platform?: string;
  createdAt: string;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  followers: number;
  views: number;
  messages: number;
  streamDuration: number; // minutes
  streamCount: number;
}

export interface AnalyticsSummary {
  streamerId: string;
  totalStreams: number;
  totalStreamTime: number; // minutes
  averageStreamDuration: number;
  totalFollowers: number;
  followerGrowth: number; // Followers gained in last 30 days
  totalViews: number;
  averageViewers: number;
  peakViewers: number;
  totalMessages: number;
  engagementRate: number; // messages per viewer
  lastUpdated: string;
}
