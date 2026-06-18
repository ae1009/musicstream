import client from './client';
import { ENDPOINTS } from '../../constants/api';
import { YouTubeVideo } from '../../types/youtube';

export const youtubeApi = {
  search: async (q: string, limit = 20): Promise<YouTubeVideo[]> => {
    const { data } = await client.get(ENDPOINTS.youtube.search, { params: { q, limit } });
    return data;
  },

  getVideoInfo: async (videoId: string): Promise<YouTubeVideo> => {
    const { data } = await client.get(ENDPOINTS.youtube.video(videoId));
    return data;
  },

  getStreamUrl: (videoId: string): string =>
    `${client.defaults.baseURL}${ENDPOINTS.youtube.stream(videoId)}`,
};
