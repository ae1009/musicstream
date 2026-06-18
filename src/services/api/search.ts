import client from './client';
import { ENDPOINTS } from '../../constants/api';
import { Track } from '../../types/track';
import { Podcast } from '../../types/podcast';
import { YouTubeVideo } from '../../types/youtube';

export interface UnifiedSearchResult {
  tracks: Track[];
  podcasts: Podcast[];
  youtube: YouTubeVideo[];
  total: number;
}

export const searchApi = {
  unified: async (
    q: string,
    sources: ('music' | 'podcasts' | 'youtube')[] = ['music', 'podcasts'],
    limit = 10,
  ): Promise<UnifiedSearchResult> => {
    const { data } = await client.get(ENDPOINTS.search, {
      params: { q, sources: sources.join(','), limit },
    });
    return data;
  },
};
