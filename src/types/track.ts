export interface Track {
  id: string;           // "jamendo:12345" | "fma:6789"
  source: 'jamendo' | 'fma' | 'deezer';
  title: string;
  artist: string;
  album?: string;
  duration_s?: number;
  genre?: string;
  artwork_url?: string;
  stream_url: string;
  license?: string;
}

export interface Album {
  id: string;
  source: string;
  title: string;
  artist: string;
  artwork_url?: string;
  release_year?: number;
  tracks: Track[];
}

export interface Artist {
  id: string;
  source: string;
  name: string;
  bio?: string;
  image_url?: string;
  genres: string[];
}

export interface Genre {
  id: string;
  name: string;
  artwork_url?: string;
}
