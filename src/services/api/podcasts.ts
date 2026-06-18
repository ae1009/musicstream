import client from './client';
import { ENDPOINTS } from '../../constants/api';
import { Podcast, Episode } from '../../types/podcast';

export const podcastsApi = {
  getTrending: async (limit = 20, category?: string): Promise<Podcast[]> => {
    const { data } = await client.get(ENDPOINTS.podcasts.trending, {
      params: { limit, ...(category ? { category } : {}) },
    });
    return data;
  },

  getCategories: async (): Promise<{ id: string; name: string }[]> => {
    const { data } = await client.get(ENDPOINTS.podcasts.categories);
    return data;
  },

  search: async (q: string, limit = 20): Promise<Podcast[]> => {
    const { data } = await client.get(ENDPOINTS.podcasts.search, { params: { q, limit } });
    return data;
  },

  getPodcast: async (feedId: string): Promise<Podcast> => {
    const { data } = await client.get(ENDPOINTS.podcasts.detail(feedId));
    return data;
  },

  getEpisodes: async (feedId: string, limit = 30, page = 0): Promise<Episode[]> => {
    const { data } = await client.get(ENDPOINTS.podcasts.episodes(feedId), {
      params: { limit, page },
    });
    return data;
  },
};
