import { supabase } from "../lib/supabase";
import type { NewsItem, GamingEvent, NewsCategory, EventType } from "../state/newsStore";

// Transform Supabase row to NewsItem
const transformNewsRow = (row: any): NewsItem => ({
  id: row.id,
  title: row.title,
  summary: row.summary,
  content: row.content,
  imageUrl: row.image_url,
  category: row.category as NewsCategory,
  source: row.source,
  sourceUrl: row.source_url,
  publishedAt: row.published_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  isActive: row.is_active,
  isPinned: row.is_pinned,
  viewCount: row.view_count,
  tags: row.tags || [],
});

// Transform Supabase row to GamingEvent
const transformEventRow = (row: any): GamingEvent => ({
  id: row.id,
  title: row.title,
  description: row.description,
  imageUrl: row.image_url,
  eventType: row.event_type as EventType,
  startDate: row.start_date,
  endDate: row.end_date,
  location: row.location,
  isOnline: row.is_online,
  streamUrl: row.stream_url,
  registrationUrl: row.registration_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  isActive: row.is_active,
  isFeatured: row.is_featured,
  attendeeCount: row.attendee_count,
  game: row.game,
  prizePool: row.prize_pool,
  tags: row.tags || [],
});

// ==================== NEWS FUNCTIONS ====================

export async function fetchAllNews(): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from("gaming_news")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching news:", error);
    return [];
  }

  return (data || []).map(transformNewsRow);
}

export async function fetchActiveNews(): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from("gaming_news")
    .select("*")
    .eq("is_active", true)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching active news:", error);
    return [];
  }

  return (data || []).map(transformNewsRow);
}

export async function createNews(
  news: Omit<NewsItem, "id" | "createdAt" | "updatedAt" | "viewCount">
): Promise<NewsItem | null> {
  const { data, error } = await supabase
    .from("gaming_news")
    .insert({
      title: news.title,
      summary: news.summary,
      content: news.content,
      image_url: news.imageUrl,
      category: news.category,
      source: news.source,
      source_url: news.sourceUrl,
      published_at: news.publishedAt,
      created_by: news.createdBy,
      is_active: news.isActive,
      is_pinned: news.isPinned,
      tags: news.tags,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating news:", error);
    return null;
  }

  return transformNewsRow(data);
}

export async function updateNews(
  id: string,
  updates: Partial<NewsItem>
): Promise<boolean> {
  const supabaseUpdates: any = {};

  if (updates.title !== undefined) supabaseUpdates.title = updates.title;
  if (updates.summary !== undefined) supabaseUpdates.summary = updates.summary;
  if (updates.content !== undefined) supabaseUpdates.content = updates.content;
  if (updates.imageUrl !== undefined) supabaseUpdates.image_url = updates.imageUrl;
  if (updates.category !== undefined) supabaseUpdates.category = updates.category;
  if (updates.source !== undefined) supabaseUpdates.source = updates.source;
  if (updates.sourceUrl !== undefined) supabaseUpdates.source_url = updates.sourceUrl;
  if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive;
  if (updates.isPinned !== undefined) supabaseUpdates.is_pinned = updates.isPinned;
  if (updates.tags !== undefined) supabaseUpdates.tags = updates.tags;
  
  supabaseUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("gaming_news")
    .update(supabaseUpdates)
    .eq("id", id);

  if (error) {
    console.error("Error updating news:", error);
    return false;
  }

  return true;
}

export async function deleteNews(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("gaming_news")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting news:", error);
    return false;
  }

  return true;
}

export async function incrementNewsViews(id: string): Promise<void> {
  const { error } = await supabase.rpc("increment_news_views", { news_id: id });
  
  if (error) {
    // Fallback: manual update if RPC doesn't exist
    await supabase
      .from("gaming_news")
      .update({ view_count: supabase.rpc("increment", { x: 1 }) })
      .eq("id", id);
  }
}

// ==================== EVENTS FUNCTIONS ====================

export async function fetchAllEvents(): Promise<GamingEvent[]> {
  const { data, error } = await supabase
    .from("gaming_events")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Error fetching events:", error);
    return [];
  }

  return (data || []).map(transformEventRow);
}

export async function fetchUpcomingEvents(): Promise<GamingEvent[]> {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from("gaming_events")
    .select("*")
    .eq("is_active", true)
    .gte("start_date", now)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Error fetching upcoming events:", error);
    return [];
  }

  return (data || []).map(transformEventRow);
}

export async function fetchFeaturedEvents(): Promise<GamingEvent[]> {
  const { data, error } = await supabase
    .from("gaming_events")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Error fetching featured events:", error);
    return [];
  }

  return (data || []).map(transformEventRow);
}

export async function createEvent(
  event: Omit<GamingEvent, "id" | "createdAt" | "updatedAt" | "attendeeCount">
): Promise<GamingEvent | null> {
  const { data, error } = await supabase
    .from("gaming_events")
    .insert({
      title: event.title,
      description: event.description,
      image_url: event.imageUrl,
      event_type: event.eventType,
      start_date: event.startDate,
      end_date: event.endDate,
      location: event.location,
      is_online: event.isOnline,
      stream_url: event.streamUrl,
      registration_url: event.registrationUrl,
      created_by: event.createdBy,
      is_active: event.isActive,
      is_featured: event.isFeatured,
      game: event.game,
      prize_pool: event.prizePool,
      tags: event.tags,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating event:", error);
    return null;
  }

  return transformEventRow(data);
}

export async function updateEvent(
  id: string,
  updates: Partial<GamingEvent>
): Promise<boolean> {
  const supabaseUpdates: any = {};

  if (updates.title !== undefined) supabaseUpdates.title = updates.title;
  if (updates.description !== undefined) supabaseUpdates.description = updates.description;
  if (updates.imageUrl !== undefined) supabaseUpdates.image_url = updates.imageUrl;
  if (updates.eventType !== undefined) supabaseUpdates.event_type = updates.eventType;
  if (updates.startDate !== undefined) supabaseUpdates.start_date = updates.startDate;
  if (updates.endDate !== undefined) supabaseUpdates.end_date = updates.endDate;
  if (updates.location !== undefined) supabaseUpdates.location = updates.location;
  if (updates.isOnline !== undefined) supabaseUpdates.is_online = updates.isOnline;
  if (updates.streamUrl !== undefined) supabaseUpdates.stream_url = updates.streamUrl;
  if (updates.registrationUrl !== undefined) supabaseUpdates.registration_url = updates.registrationUrl;
  if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive;
  if (updates.isFeatured !== undefined) supabaseUpdates.is_featured = updates.isFeatured;
  if (updates.game !== undefined) supabaseUpdates.game = updates.game;
  if (updates.prizePool !== undefined) supabaseUpdates.prize_pool = updates.prizePool;
  if (updates.tags !== undefined) supabaseUpdates.tags = updates.tags;
  
  supabaseUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("gaming_events")
    .update(supabaseUpdates)
    .eq("id", id);

  if (error) {
    console.error("Error updating event:", error);
    return false;
  }

  return true;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("gaming_events")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting event:", error);
    return false;
  }

  return true;
}
