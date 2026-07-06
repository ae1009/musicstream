import axios from 'axios';
import { YouTubeVideo } from '../../types/youtube';

// Public Invidious instances — open-source YouTube frontend, no auth
const INSTANCES = [
  'https://vid.puffyan.us',
  'https://yt.artemislena.eu',
  'https://invidious.nerdvpn.de',
];

async function invidiousGet(path: string, params?: object): Promise<any> {
  for (const base of INSTANCES) {
    try {
      const { data } = await axios.get(`${base}${path}`, { params, timeout: 10000 });
      return data;
    } catch {
      // try next instance
    }
  }
  throw new Error('All Invidious instances failed');
}

function toVideo(v: any): YouTubeVideo {
  const thumb = (v.videoThumbnails ?? []).find((t: any) => t.quality === 'medium') ?? v.videoThumbnails?.[0];
  return {
    id: v.videoId,
    source: 'youtube',
    title: v.title ?? 'Unknown',
    artist: v.author ?? 'Unknown Channel',
    duration_s: v.lengthSeconds ?? 0,
    artwork_url: thumb?.url ?? `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
    stream_url: `https://www.youtube.com/watch?v=${v.videoId}`, // placeholder; use getAudioUrl to get actual stream
    view_count: v.viewCount,
    published_at: v.published,
  };
}

export const youtubeApi = {
  search: async (q: string, limit = 20): Promise<YouTubeVideo[]> => {
    const data = await invidiousGet('/api/v1/search', {
      q,
      type: 'video',
      fields: 'videoId,title,author,viewCount,published,lengthSeconds,videoThumbnails',
    });
    return (Array.isArray(data) ? data : []).slice(0, limit).map(toVideo);
  },

  // Returns a direct MP4 audio-only URL from YouTube via Invidious
  // itag 140 = M4A 128kbps audio-only (best Android compatibility)
  getAudioUrl: async (videoId: string): Promise<string> => {
    const data = await invidiousGet(`/api/v1/videos/${videoId}`, {
      fields: 'adaptiveFormats',
    });
    const formats: any[] = data.adaptiveFormats ?? [];
    const audio =
      formats.find((f) => f.itag === 140) ??      // M4A 128k
      formats.find((f) => f.itag === 139) ??      // M4A 48k (fallback)
      formats.find((f) => f.type?.startsWith('audio/'));
    if (!audio?.url) throw new Error('No audio stream found');
    return audio.url;
  },
};
