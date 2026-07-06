import axios from 'axios';
import { Podcast, Episode } from '../../types/podcast';

const itunes = axios.create({ baseURL: 'https://itunes.apple.com', timeout: 15000 });

function toPodcast(item: any): Podcast {
  return {
    feed_id: String(item.collectionId ?? item.trackId ?? ''),
    title: item.collectionName ?? item.trackName ?? 'Unknown',
    author: item.artistName,
    description: item.description ?? item.shortDescription,
    artwork_url: item.artworkUrl600 ?? item.artworkUrl100,
    feed_url: item.feedUrl ?? '',
    category: item.primaryGenreName,
    episode_count: item.trackCount,
  };
}

function parseDuration(d: string | number | undefined): number {
  if (!d) return 0;
  if (typeof d === 'number') return d;
  const parts = String(d).split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(d) || 0;
}

function toEpisode(item: any, feed_id: string): Episode {
  const audio = item.enclosure?.link ?? item.enclosure?.url ?? '';
  return {
    id: item.guid ?? item.link ?? `${feed_id}_${Date.now()}_${Math.random()}`,
    feed_id,
    title: item.title ?? 'Unknown',
    description: item.description?.replace(/<[^>]*>/g, '') ?? '',
    audio_url: audio,
    duration_s: parseDuration(item.itunes_duration),
    pub_date: item.pubDate ? Math.floor(new Date(item.pubDate).getTime() / 1000) : undefined,
    artwork_url: item.thumbnail ?? undefined,
  };
}

const TRENDING_TERMS = ['tecnologia', 'noticias', 'true crime', 'historia', 'ciencia', 'negocios', 'deportes'];

const CATEGORIES = [
  { id: 'tecnologia', name: 'Tecnología' },
  { id: 'noticias', name: 'Noticias' },
  { id: 'true crime', name: 'True Crime' },
  { id: 'historia', name: 'Historia' },
  { id: 'ciencia', name: 'Ciencia' },
  { id: 'comedia', name: 'Comedia' },
  { id: 'negocios', name: 'Negocios' },
  { id: 'deportes', name: 'Deportes' },
  { id: 'educacion', name: 'Educación' },
  { id: 'salud', name: 'Salud' },
];

export const podcastsApi = {
  getTrending: async (limit = 20): Promise<Podcast[]> => {
    const term = TRENDING_TERMS[new Date().getHours() % TRENDING_TERMS.length];
    const { data } = await itunes.get('/search', {
      params: { term, entity: 'podcast', limit: Math.min(limit, 50), media: 'podcast', country: 'MX' },
    });
    return (data.results ?? [])
      .map(toPodcast)
      .filter((p: Podcast) => p.feed_url && p.feed_id);
  },

  getCategories: async (): Promise<{ id: string; name: string }[]> => CATEGORIES,

  search: async (q: string, limit = 20): Promise<Podcast[]> => {
    const { data } = await itunes.get('/search', {
      params: { term: q, entity: 'podcast', limit: Math.min(limit, 50), media: 'podcast' },
    });
    return (data.results ?? [])
      .map(toPodcast)
      .filter((p: Podcast) => p.feed_url && p.feed_id);
  },

  getPodcast: async (feedId: string): Promise<Podcast> => {
    const { data } = await itunes.get('/lookup', { params: { id: feedId, entity: 'podcast' } });
    const r = (data.results ?? [])[0];
    if (!r) throw new Error('Podcast not found');
    return toPodcast(r);
  },

  getEpisodes: async (feedId: string, limit = 30, _page = 0): Promise<Episode[]> => {
    // Get feed URL from iTunes
    const { data: lookup } = await itunes.get('/lookup', {
      params: { id: feedId, entity: 'podcast' },
    });
    const feedUrl = (lookup.results ?? [])[0]?.feedUrl;
    if (!feedUrl) return [];

    // Parse RSS feed via rss2json (free, no auth needed)
    const { data: rss } = await axios.get('https://api.rss2json.com/v1/api.json', {
      params: { rss_url: feedUrl, count: limit },
      timeout: 20000,
    });
    if (rss.status !== 'ok') return [];

    return (rss.items ?? [])
      .map((item: any) => toEpisode(item, feedId))
      .filter((e: Episode) => e.audio_url);
  },
};
