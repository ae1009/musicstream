import { Podcast, Episode } from '../../types/podcast';

// Podcast Index / EC2 backend not yet deployed — stubs return empty arrays
export const podcastsApi = {
  getTrending: async (_limit = 20, _category?: string): Promise<Podcast[]> => [],
  getCategories: async (): Promise<{ id: string; name: string }[]> => [],
  search: async (_q: string, _limit = 20): Promise<Podcast[]> => [],
  getPodcast: async (_feedId: string): Promise<Podcast> => { throw new Error('Backend not available yet'); },
  getEpisodes: async (_feedId: string, _limit = 30, _page = 0): Promise<Episode[]> => [],
};
