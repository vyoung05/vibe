// Instagram-style post types

export interface Comment {
  id: string;
  username: string;
  avatarUrl?: string;
  text: string;
  createdAt: string;
}

export interface PostUser {
  id: string;
  username: string;
  avatarUrl: string;
  isVerified?: boolean;
  isArtist?: boolean;
}

export interface Post {
  id: string;
  user: PostUser;
  imageUrl: string;
  videoUrl?: string;
  audioUrl?: string; // Audio file URL for audio posts
  thumbnailUrl?: string; // Custom thumbnail for videos (optional)
  mediaType?: "image" | "video" | "audio"; // Added audio type
  videoSource?: "local" | "youtube" | "url"; // Source type for videos
  caption: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
  comments: Comment[];
  likedBy?: string[]; // Array of user IDs who liked the post
  savedBy?: string[]; // Array of user IDs who saved the post
  // Music post specific fields
  isAudioPost?: boolean; // Is this a music/audio post
  trackId?: string; // Reference to Track if music post
  artistId?: string; // Reference to Artist if music post
  hotVotes?: number; // Hot votes for music posts
  notVotes?: number; // Not votes for music posts
  isSnippet?: boolean; // Is this a snippet or full track
}
