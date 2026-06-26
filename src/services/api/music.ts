import axios from 'axios';
import { Track, Genre } from '../../types/track';

const deezer = axios.create({ baseURL: 'https://api.deezer.com', timeout: 15000 });

function toTrack(t: any): Track {
  return {
    id: `deezer:${t.id}`,
    source: 'deezer',
    title: t.title ?? 'Unknown',
    artist: t.artist?.name ?? 'Unknown Artist',
    album: t.album?.title,
    duration_s: t.duration ?? 30,
    artwork_url: t.album?.cover_medium ?? t.artist?.picture_medium,
    stream_url: t.preview ?? '',
  };
}

async function getChartTracks(limit: number): Promise<Track[]> {
  const { data } = await deezer.get('/chart/0/tracks', { params: { limit } });
  return (data.data ?? []).map(toTrack).filter((t: Track) => t.stream_url);
}

export const musicApi = {
  getFeatured: (limit = 20) => getChartTracks(limit),

  getTrending: (limit = 30, _genre?: string) => getChartTracks(limit),

  getNewReleases: (limit = 20) => getChartTracks(limit),

  search: async (q: string, _genre?: string, page = 0, limit = 20): Promise<Track[]> => {
    const { data } = await deezer.get('/search', {
      params: { q, limit, index: page * limit },
    });
    return (data.data ?? []).map(toTrack).filter((t: Track) => t.stream_url);
  },

  getGenres: async (): Promise<Genre[]> => {
    const { data } = await deezer.get('/genre');
    return (data.data ?? [])
      .filter((g: any) => g.id !== 0)
      .map((g: any) => ({ id: String(g.id), name: g.name, artwork_url: g.picture_medium }));
  },

  getTrack: async (id: string): Promise<Track> => {
    const dzId = id.replace('deezer:', '');
    const { data } = await deezer.get(`/track/${dzId}`);
    return toTrack(data);
  },

  getRadio: (genre: string, limit = 30) => getChartTracks(limit),
};
