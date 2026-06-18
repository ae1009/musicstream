import client from './client';
import { ENDPOINTS } from '../../constants/api';
import { Track, Genre } from '../../types/track';

export const musicApi = {
  getFeatured: async (limit = 20): Promise<Track[]> => {
    const { data } = await client.get(ENDPOINTS.music.featured, { params: { limit } });
    return data;
  },

  getTrending: async (limit = 30, genre?: string): Promise<Track[]> => {
    const { data } = await client.get(ENDPOINTS.music.trending, {
      params: { limit, ...(genre ? { genre } : {}) },
    });
    return data;
  },

  getNewReleases: async (limit = 20): Promise<Track[]> => {
    const { data } = await client.get(ENDPOINTS.music.newReleases, { params: { limit } });
    return data;
  },

  getGenres: async (): Promise<Genre[]> => {
    const { data } = await client.get(ENDPOINTS.music.genres);
    return data;
  },

  search: async (q: string, genre?: string, page = 0, limit = 20): Promise<Track[]> => {
    const { data } = await client.get(ENDPOINTS.music.search, {
      params: { q, page, limit, ...(genre ? { genre } : {}) },
    });
    return data;
  },

  getTrack: async (id: string): Promise<Track> => {
    const { data } = await client.get(ENDPOINTS.music.track(id));
    return data;
  },

  getRadio: async (genre: string, limit = 30): Promise<Track[]> => {
    const { data } = await client.get(ENDPOINTS.music.radio(genre), { params: { limit } });
    return data;
  },
};
