// Video utility functions

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  // Match various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Get YouTube thumbnail URL from video ID or URL
 * Returns high-quality thumbnail (maxresdefault, hqdefault, or mqdefault)
 */
export function getYouTubeThumbnail(urlOrId: string, quality: "max" | "hq" | "mq" | "default" = "hq"): string | null {
  const videoId = extractYouTubeId(urlOrId) || urlOrId;

  if (!videoId || videoId.length !== 11) return null;

  const qualityMap = {
    max: "maxresdefault",
    hq: "hqdefault",
    mq: "mqdefault",
    default: "default",
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Check if a URL is a YouTube video
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return url.includes("youtube.com") || url.includes("youtu.be");
}

/**
 * Check if a URL is a direct video file
 */
export function isDirectVideoUrl(url: string): boolean {
  if (!url) return false;
  const videoExtensions = [".mp4", ".m4v", ".webm", ".mov", ".avi", ".mkv"];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some((ext) => lowerUrl.includes(ext));
}

/**
 * Determine the video source type from a URL
 */
export function getVideoSourceType(url: string): "youtube" | "local" | "url" | null {
  if (!url) return null;

  if (isYouTubeUrl(url)) {
    return "youtube";
  }

  if (url.startsWith("file://") || url.startsWith("ph://")) {
    return "local";
  }

  return "url";
}

/**
 * Get the best available thumbnail for a post
 * Priority: thumbnailUrl > YouTube auto-thumbnail > imageUrl > null
 */
export function getPostThumbnail(post: {
  thumbnailUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaType?: string;
}): string | null {
  // If there's a custom thumbnail, use it
  if (post.thumbnailUrl) {
    return post.thumbnailUrl;
  }

  // If it's a YouTube video, generate thumbnail
  if (post.videoUrl && isYouTubeUrl(post.videoUrl)) {
    return getYouTubeThumbnail(post.videoUrl, "hq");
  }

  // Fall back to imageUrl
  if (post.imageUrl) {
    return post.imageUrl;
  }

  return null;
}

/**
 * Get YouTube embed URL for WebView playback
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  return `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`;
}
