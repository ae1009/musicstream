import axios from 'axios';
import { Track, Genre } from '../../types/track';

const JAMENDO_BASE = 'https://api.jamendo.com/v3.0';
const CLIENT_ID = 'b6747d04';

const jamendo = axios.create({ baseURL: JAMENDO_BASE, timeout: 15000 });

function toTrack(t: any): Track {
  return {
    id: `jamendo:${t.id}`,
    source: 'jamendo',
    title: t.name ?? t.title ?? 'Unknown',
    artist: t.artist_name ?? t.artistName ?? 'Unknown Artist',
    album: t.album_name ?? t.albumName,
    duration_s: t.duration ?? 0,
    artwork_url: t.image ?? t.album_image,
    stream_url: t.audiodownload ?? t.audio ?? '',
    license: t.license_ccurl,
  };
}

async function fetchTracks(params: Record<string, any>): Promise<Track[]> {
  const { data } = await jamendo.get('/tracks/', {
    params: {
      client_id: CLIENT_ID,
      format: 'json',
      audiodlformat: 'mp31',
      imagesize: 300,
      ...params,
    },
  });
  return (data.results ?? []).map(toTrack).filter((t: Track) => t.stream_url);
}

export const musicApi = {
  getFeatured: (limit = 20) =>
    fetchTracks({ limit, order: 'popularity_week', include: 'musicinfo' }),

  getTrending: (limit = 30, genre?: string) =>
    fetchTracks({ limit, order: 'popularity_month', ...(genre ? { tags: genre } : {}) }),

  getNewReleases: (limit = 20) =>
    fetchTracks({ limit, order: 'releasedate' }),

  search: (q: string, genre?: string, page = 0, limit = 20) =>
    fetchTracks({
      limit, offset: page * limit,
      namesearch: q,
      ...(genre ? { tags: genre } : {}),
    }),

  getGenres: async (): Promise<Genre[]> => {
    const { data } = await jamendo.get('/tags/', {
      params: { client_id: CLIENT_ID, format: 'json', limit: 30 },
    });
    return (data.results ?? []).map((t: any) => ({
      id: t.id ?? t.name,
      name: t.name,
      artwork_url: undefined,
    }));
  },

  getTrack: async (id: string): Promise<Track> => {
    const jamId = id.replace('jamendo:', '');
    const tracks = await fetchTracks({ id: jamId });
    if (!tracks.length) throw new Error('Track not found');
    return tracks[0];
  },

  getRadio: (genre: string, limit = 30) =>
    fetchTracks({ limit, tags: genre, order: 'popularity_month' }),
};
