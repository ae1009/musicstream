export interface YouTubeVideo {
  id: string;
  source: 'youtube';
  title: string;
  artist: string;
  duration_s?: number;
  artwork_url?: string;
  stream_url: string;    // apunta al proxy /api/youtube/stream/:id
  view_count?: number;
  published_at?: number;
}
