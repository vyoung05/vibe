import { supabase } from "../lib/supabase";
import type { Artist, Track, Album } from "../types";

// Fetch all artists with their tracks and albums
export async function fetchArtists(): Promise<Artist[]> {
  try {
    const { data: artists, error } = await supabase
      .from("artists")
      .select(`
        *,
        artist_header_images(image_url, sort_order),
        artist_social_links(*),
        tracks(*),
        albums(*)
      `)
      .order("follower_count", { ascending: false });

    if (error) {
      console.error("[MusicService] Fetch artists error:", error);
      return [];
    }

    if (!artists || artists.length === 0) {
      console.log("[MusicService] No artists found in database");
      return [];
    }

    // Transform to app Artist type
    return artists.map((a) => mapDatabaseArtistToArtist(a));
  } catch (err) {
    console.error("[MusicService] Fetch artists exception:", err);
    return [];
  }
}

// Fetch a single artist by ID
export async function fetchArtist(artistId: string): Promise<Artist | null> {
  try {
    const { data: artist, error } = await supabase
      .from("artists")
      .select(`
        *,
        artist_header_images(image_url, sort_order),
        artist_social_links(*),
        tracks(*),
        albums(*)
      `)
      .eq("id", artistId)
      .single();

    if (error || !artist) {
      console.error("[MusicService] Fetch artist error:", error);
      return null;
    }

    return mapDatabaseArtistToArtist(artist);
  } catch (err) {
    console.error("[MusicService] Fetch artist exception:", err);
    return null;
  }
}

// Fetch all tracks (for discovery/feed)
export async function fetchAllTracks(): Promise<(Track & { artistName: string; artistAvatar: string })[]> {
  try {
    const { data: tracks, error } = await supabase
      .from("tracks")
      .select(`
        *,
        artists!inner(name, avatar)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[MusicService] Fetch tracks error:", error);
      return [];
    }

    if (!tracks || tracks.length === 0) {
      return [];
    }

    return tracks.map((t) => ({
      id: t.id,
      artistId: t.artist_id,
      title: t.title,
      albumId: t.album_id || undefined,
      coverArt: t.cover_art,
      audioUrl: t.audio_url,
      duration: t.duration_seconds,
      price: t.price ? parseFloat(t.price) : undefined,
      isSnippetOnly: t.is_snippet_only,
      snippetDuration: t.snippet_duration_seconds,
      playCount: t.play_count || 0,
      hotVotes: t.hot_votes || 0,
      notVotes: t.not_votes || 0,
      purchaseCount: t.purchase_count || 0,
      isHot: t.is_hot,
      createdAt: t.created_at,
      artistName: t.artists?.name || "Unknown Artist",
      artistAvatar: t.artists?.avatar || "",
    }));
  } catch (err) {
    console.error("[MusicService] Fetch tracks exception:", err);
    return [];
  }
}

// Fetch hot/trending tracks
export async function fetchHotTracks(): Promise<Track[]> {
  try {
    const { data: tracks, error } = await supabase
      .from("tracks")
      .select("*")
      .eq("is_hot", true)
      .order("hot_votes", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[MusicService] Fetch hot tracks error:", error);
      return [];
    }

    return (tracks || []).map(mapDatabaseTrackToTrack);
  } catch (err) {
    console.error("[MusicService] Fetch hot tracks exception:", err);
    return [];
  }
}

// Increment play count
export async function incrementPlayCount(trackId: string): Promise<void> {
  try {
    await supabase.rpc("increment_track_plays", { track_uuid: trackId });
    console.log("[MusicService] Play count incremented for track:", trackId);
  } catch (err) {
    console.error("[MusicService] Increment play count error:", err);
  }
}

// Vote on a track (hot or not)
export async function voteOnTrack(
  trackId: string,
  userId: string,
  voteType: "hot" | "not"
): Promise<boolean> {
  try {
    // Check for existing vote
    const { data: existing } = await supabase
      .from("track_votes")
      .select("id, vote_type")
      .eq("track_id", trackId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      if (existing.vote_type === voteType) {
        // Remove vote (toggle off)
        await supabase
          .from("track_votes")
          .delete()
          .eq("track_id", trackId)
          .eq("user_id", userId);
        return false;
      } else {
        // Change vote
        await supabase
          .from("track_votes")
          .update({ vote_type: voteType })
          .eq("track_id", trackId)
          .eq("user_id", userId);
        return true;
      }
    } else {
      // New vote
      await supabase.from("track_votes").insert({
        track_id: trackId,
        user_id: userId,
        vote_type: voteType,
      });
      return true;
    }
  } catch (err) {
    console.error("[MusicService] Vote on track error:", err);
    return false;
  }
}

// Follow an artist
export async function followArtist(userId: string, artistId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("artist_followers").insert({
      follower_id: userId,
      artist_id: artistId,
    });

    if (error) {
      if (error.code === "23505") {
        // Already following
        return true;
      }
      console.error("[MusicService] Follow artist error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[MusicService] Follow artist exception:", err);
    return false;
  }
}

// Unfollow an artist
export async function unfollowArtist(userId: string, artistId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("artist_followers")
      .delete()
      .eq("follower_id", userId)
      .eq("artist_id", artistId);

    if (error) {
      console.error("[MusicService] Unfollow artist error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[MusicService] Unfollow artist exception:", err);
    return false;
  }
}

// Check if user follows an artist
export async function isFollowingArtist(userId: string, artistId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("artist_followers")
      .select("id")
      .eq("follower_id", userId)
      .eq("artist_id", artistId)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

// Helper: Map database artist to app Artist type
function mapDatabaseArtistToArtist(dbArtist: any): Artist {
  const headerImages = (dbArtist.artist_header_images || [])
    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((h: any) => h.image_url);

  const socialLinks = dbArtist.artist_social_links?.[0] || {};

  const tracks: Track[] = (dbArtist.tracks || []).map(mapDatabaseTrackToTrack);
  
  const albums: Album[] = (dbArtist.albums || []).map((a: any) => ({
    id: a.id,
    artistId: a.artist_id,
    title: a.title,
    coverArt: a.cover_art,
    trackIds: [], // Would need separate query for album_tracks
    price: a.price ? parseFloat(a.price) : undefined,
    releaseDate: a.release_date,
    description: a.description,
  }));

  return {
    id: dbArtist.id,
    name: dbArtist.name,
    stageName: dbArtist.stage_name,
    email: dbArtist.email,
    avatar: dbArtist.avatar,
    headerImages,
    bio: dbArtist.bio,
    genre: dbArtist.genre,
    socialLinks: {
      instagram: socialLinks.instagram || "",
      twitter: socialLinks.twitter || "",
      tiktok: socialLinks.tiktok || "",
      twitch: socialLinks.twitch || "",
      youtube: socialLinks.youtube || "",
      kick: socialLinks.kick || "",
      spotify: socialLinks.spotify || "",
    },
    followerCount: dbArtist.follower_count || 0,
    referralCode: dbArtist.referral_code || "",
    isVerified: dbArtist.is_verified,
    tracks,
    albums,
    totalPlays: dbArtist.total_plays || 0,
    totalSales: dbArtist.total_sales || 0,
    hotStatus: dbArtist.hot_status,
    hotStatusDate: dbArtist.hot_status_date,
  };
}

// Get all tracks for sale (with price > 0)
export async function fetchTracksForSale(): Promise<(Track & { artistName: string; artistAvatar: string })[]> {
  try {
    const { data: tracks, error } = await supabase
      .from("tracks")
      .select(`
        *,
        artists!inner(name, stage_name, avatar)
      `)
      .not("price", "is", null)
      .gt("price", 0)
      .order("hot_votes", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[MusicService] Fetch tracks for sale error:", error);
      return [];
    }

    return (tracks || []).map((t) => ({
      id: t.id,
      artistId: t.artist_id,
      title: t.title,
      albumId: t.album_id || undefined,
      coverArt: t.cover_art,
      audioUrl: t.audio_url,
      duration: t.duration_seconds,
      price: t.price ? parseFloat(t.price) : undefined,
      isSnippetOnly: t.is_snippet_only,
      snippetDuration: t.snippet_duration_seconds,
      playCount: t.play_count || 0,
      hotVotes: t.hot_votes || 0,
      notVotes: t.not_votes || 0,
      purchaseCount: t.purchase_count || 0,
      isHot: t.is_hot,
      createdAt: t.created_at,
      artistName: t.artists?.stage_name || t.artists?.name || "Unknown Artist",
      artistAvatar: t.artists?.avatar || "",
    }));
  } catch (err) {
    console.error("[MusicService] Fetch tracks for sale exception:", err);
    return [];
  }
}

// Check if user has purchased a track
export async function hasUserPurchasedTrack(userId: string, trackId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("track_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("track_id", trackId)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

// Get user's purchased tracks
export async function fetchUserPurchasedTracks(userId: string): Promise<Track[]> {
  try {
    const { data: purchases, error } = await supabase
      .from("track_purchases")
      .select(`
        track_id,
        tracks(*)
      `)
      .eq("user_id", userId);

    if (error || !purchases) {
      console.error("[MusicService] Fetch purchased tracks error:", error);
      return [];
    }

    return purchases
      .filter((p) => p.tracks)
      .map((p) => mapDatabaseTrackToTrack(p.tracks));
  } catch (err) {
    console.error("[MusicService] Fetch purchased tracks exception:", err);
    return [];
  }
}

// Record a track purchase
export async function recordTrackPurchase(
  userId: string,
  trackId: string,
  pricePaid: number
): Promise<boolean> {
  try {
    // Insert purchase record
    const { error: purchaseError } = await supabase
      .from("track_purchases")
      .insert({
        user_id: userId,
        track_id: trackId,
        price_paid: pricePaid,
      });

    if (purchaseError) {
      if (purchaseError.code === "23505") {
        // Already purchased
        return true;
      }
      console.error("[MusicService] Record purchase error:", purchaseError);
      return false;
    }

    // Increment purchase count on track
    await supabase.rpc("increment_track_purchase_count", { track_uuid: trackId });

    console.log("[MusicService] Track purchase recorded:", trackId);
    return true;
  } catch (err) {
    console.error("[MusicService] Record purchase exception:", err);
    return false;
  }
}

// Helper: Map database track to app Track type
function mapDatabaseTrackToTrack(dbTrack: any): Track {
  return {
    id: dbTrack.id,
    artistId: dbTrack.artist_id,
    title: dbTrack.title,
    albumId: dbTrack.album_id || undefined,
    coverArt: dbTrack.cover_art,
    audioUrl: dbTrack.audio_url,
    duration: dbTrack.duration_seconds,
    price: dbTrack.price ? parseFloat(dbTrack.price) : undefined,
    isSnippetOnly: dbTrack.is_snippet_only,
    snippetDuration: dbTrack.snippet_duration_seconds,
    playCount: dbTrack.play_count || 0,
    hotVotes: dbTrack.hot_votes || 0,
    notVotes: dbTrack.not_votes || 0,
    purchaseCount: dbTrack.purchase_count || 0,
    isHot: dbTrack.is_hot,
    createdAt: dbTrack.created_at,
  };
}
