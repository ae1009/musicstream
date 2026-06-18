export interface Chapter {
  start_time: number;
  title: string;
  img?: string;
  url?: string;
}

export interface Episode {
  id: string;
  feed_id: string;
  title: string;
  description?: string;
  audio_url: string;
  duration_s?: number;
  pub_date?: number;
  season?: number;
  episode_num?: number;
  artwork_url?: string;
  chapters_url?: string;
}

export interface Podcast {
  feed_id: string;
  title: string;
  author?: string;
  description?: string;
  artwork_url?: string;
  feed_url: string;
  category?: string;
  episode_count?: number;
  last_updated?: number;
}
