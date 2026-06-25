import { Track } from '../../types/track';
import { Podcast } from '../../types/podcast';
import { YouTubeVideo } from '../../types/youtube';
import { musicApi } from './music';

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
    limit = 20,
  ): Promise<UnifiedSearchResult> => {
    const tracks = sources.includes('music')
      ? await musicApi.search(q, undefined, 0, limit).catch(() => [])
      : [];
    return { tracks, podcasts: [], youtube: [], total: tracks.length };
  },
};
