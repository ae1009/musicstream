// ngrok para desarrollo local — cambia por IP de EC2 en producción
export const API_BASE_URL = 'https://multiply-unscented-kilogram.ngrok-free.dev/api';

export const ENDPOINTS = {
  health: '/health',

  music: {
    featured: '/music/featured',
    trending: '/music/trending',
    newReleases: '/music/new',
    genres: '/music/genres',
    search: '/music/search',
    track: (id: string) => `/music/track/${id}`,
    radio: (genre: string) => `/music/radio/${genre}`,
  },

  podcasts: {
    trending: '/podcasts/trending',
    categories: '/podcasts/categories',
    search: '/podcasts/search',
    detail: (feedId: string) => `/podcasts/${feedId}`,
    episodes: (feedId: string) => `/podcasts/${feedId}/episodes`,
  },

  youtube: {
    search: '/youtube/search',
    stream: (videoId: string) => `/youtube/stream/${videoId}`,
    video: (videoId: string) => `/youtube/video/${videoId}`,
  },

  search: '/search',
  streamProxy: '/stream/proxy',
} as const;
