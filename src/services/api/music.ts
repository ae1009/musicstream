import axios from 'axios';
import { Track, Genre } from '../../types/track';

const CLIENT_ID = '556e8660';
const jamendo = axios.create({ baseURL: 'https://api.jamendo.com/v3.0', timeout: 15000 });

const BASE_PARAMS = {
  client_id: CLIENT_ID,
  format: 'json',
  audioformat: 'mp32',
  imagesize: 300,
};

function toTrack(t: any): Track {
  return {
    id: `jamendo:${t.id}`,
    source: 'jamendo',
    title: t.name ?? 'Unknown',
    artist: t.artist_name ?? 'Unknown Artist',
    album: t.album_name,
    duration_s: t.duration ?? 0,
    artwork_url: t.album_image ?? t.image ?? '',
    stream_url: t.audio ?? '',
  };
}

function dateRange(days: number): string {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  return `${start.toISOString().slice(0, 10)}_${end.toISOString().slice(0, 10)}`;
}

async function getTracks(extra: object, limit = 20, offset = 0): Promise<Track[]> {
  const { data } = await jamendo.get('/tracks/', {
    params: { ...BASE_PARAMS, limit, offset, ...extra },
  });
  return (data.results ?? []).map(toTrack).filter((t: Track) => t.stream_url);
}

export const musicApi = {
  getFeatured: (limit = 20) =>
    getTracks({ orderby: 'popularity_week' }, limit),

  getTrending: (limit = 30, genre?: string) =>
    getTracks(genre ? { tags: genre, orderby: 'popularity_total' } : { orderby: 'popularity_total' }, limit),

  getNewReleases: (limit = 20) =>
    getTracks({ datebetween: dateRange(90), orderby: 'releasedate_desc' }, limit),

  search: (q: string, genre?: string, page = 0, limit = 20): Promise<Track[]> =>
    getTracks({ search: q, ...(genre ? { tags: genre } : {}) }, limit, page * limit),

  getGenres: async (): Promise<Genre[]> => {
    const { data } = await jamendo.get('/tags/music/', {
      params: { client_id: CLIENT_ID, format: 'json', limit: 50, orderby: 'weight_desc' },
    });
    return (data.results ?? []).map((g: any) => ({
      id: String(g.id ?? g.name),
      name: g.name,
      artwork_url: '',
    }));
  },

  getTrack: async (id: string): Promise<Track> => {
    const jId = id.replace('jamendo:', '');
    const { data } = await jamendo.get('/tracks/', { params: { ...BASE_PARAMS, id: jId } });
    return toTrack((data.results ?? [])[0] ?? {});
  },

  getRadio: (genre: string, limit = 30) =>
    getTracks({ tags: genre, orderby: 'popularity_total' }, limit),
};
