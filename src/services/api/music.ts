import axios from 'axios';
import { Track, Genre } from '../../types/track';

// Jamendo: 600k+ Creative Commons songs, full MP3 streams, no auth required
const CLIENT_ID = 'b6747d04';
const jamendo = axios.create({ baseURL: 'https://api.jamendo.com/v3.0', timeout: 15000 });

const BASE = { client_id: CLIENT_ID, format: 'json', audioformat: 'mp31', include: 'musicinfo' };

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

export const musicApi = {
  getFeatured: async (limit = 20): Promise<Track[]> => {
    const { data } = await jamendo.get('/tracks/', {
      params: { ...BASE, limit, order: 'popularity_month' },
    });
    return (data.results ?? []).map(toTrack).filter((t: Track) => t.stream_url);
  },

  getTrending: async (limit = 30, genre?: string): Promise<Track[]> => {
    const params: any = { ...BASE, limit, order: 'popularity_total' };
    if (genre) params.tags = genre.toLowerCase();
    const { data } = await jamendo.get('/tracks/', { params });
    return (data.results ?? []).map(toTrack).filter((t: Track) => t.stream_url);
  },

  getNewReleases: async (limit = 20): Promise<Track[]> => {
    const { data } = await jamendo.get('/tracks/', {
      params: { ...BASE, limit, order: 'releasedate' },
    });
    return (data.results ?? []).map(toTrack).filter((t: Track) => t.stream_url);
  },

  search: async (q: string, genre?: string, page = 0, limit = 20): Promise<Track[]> => {
    const params: any = { ...BASE, limit, offset: page * limit, search: q };
    if (genre) params.tags = genre.toLowerCase();
    const { data } = await jamendo.get('/tracks/', { params });
    return (data.results ?? []).map(toTrack).filter((t: Track) => t.stream_url);
  },

  getGenres: async (): Promise<Genre[]> => [
    { id: 'pop',        name: 'Pop',        artwork_url: '' },
    { id: 'rock',       name: 'Rock',       artwork_url: '' },
    { id: 'electronic', name: 'Electronic', artwork_url: '' },
    { id: 'jazz',       name: 'Jazz',       artwork_url: '' },
    { id: 'classical',  name: 'Clásica',    artwork_url: '' },
    { id: 'hiphop',     name: 'Hip Hop',    artwork_url: '' },
    { id: 'reggae',     name: 'Reggae',     artwork_url: '' },
    { id: 'folk',       name: 'Folk',       artwork_url: '' },
    { id: 'metal',      name: 'Metal',      artwork_url: '' },
    { id: 'ambient',    name: 'Ambient',    artwork_url: '' },
  ],

  getTrack: async (id: string): Promise<Track> => {
    const jId = id.replace('jamendo:', '');
    const { data } = await jamendo.get('/tracks/', { params: { ...BASE, id: jId } });
    return toTrack(data.results?.[0] ?? {});
  },

  getRadio: (genre: string, limit = 30) => musicApi.getTrending(limit, genre),
};
