import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('musicstream.db');
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await migrate(db);
  }
  return db;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS favorites (
      id          TEXT PRIMARY KEY,
      type        TEXT NOT NULL,
      title       TEXT NOT NULL,
      artist      TEXT,
      artwork_url TEXT,
      stream_url  TEXT,
      source      TEXT NOT NULL,
      added_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT,
      artwork_url TEXT,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id INTEGER NOT NULL,
      track_id    TEXT NOT NULL,
      position    INTEGER NOT NULL,
      added_at    INTEGER NOT NULL,
      PRIMARY KEY (playlist_id, track_id),
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      feed_id       TEXT PRIMARY KEY,
      title         TEXT NOT NULL,
      author        TEXT,
      artwork_url   TEXT,
      feed_url      TEXT NOT NULL,
      subscribed_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS downloads (
      episode_id    TEXT PRIMARY KEY,
      feed_id       TEXT NOT NULL,
      title         TEXT NOT NULL,
      local_path    TEXT NOT NULL,
      file_size     INTEGER,
      duration_s    INTEGER,
      downloaded_at INTEGER NOT NULL,
      FOREIGN KEY (feed_id) REFERENCES subscriptions(feed_id)
    );

    CREATE TABLE IF NOT EXISTS history (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id  TEXT NOT NULL,
      type        TEXT NOT NULL,
      title       TEXT NOT NULL,
      artist      TEXT,
      artwork_url TEXT,
      source      TEXT NOT NULL,
      played_at   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS resume_positions (
      episode_id  TEXT PRIMARY KEY,
      position_s  REAL NOT NULL,
      updated_at  INTEGER NOT NULL
    );
  `);
}

export async function addFavorite(item: {
  id: string; type: string; title: string; artist?: string;
  artwork_url?: string; stream_url?: string; source: string;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO favorites (id, type, title, artist, artwork_url, stream_url, source, added_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [item.id, item.type, item.title, item.artist ?? null, item.artwork_url ?? null,
     item.stream_url ?? null, item.source, Date.now()],
  );
}

export async function removeFavorite(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM favorites WHERE id = ?', [id]);
}

export async function isFavorite(id: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ id: string }>('SELECT id FROM favorites WHERE id = ?', [id]);
  return row !== null;
}

export async function getFavorites(): Promise<any[]> {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM favorites ORDER BY added_at DESC');
}

export async function addToHistory(item: {
  content_id: string; type: string; title: string; artist?: string;
  artwork_url?: string; source: string;
}): Promise<void> {
  const db = await getDb();
  // Eliminar entrada previa del mismo contenido para no duplicar
  await db.runAsync('DELETE FROM history WHERE content_id = ?', [item.content_id]);
  await db.runAsync(
    `INSERT INTO history (content_id, type, title, artist, artwork_url, source, played_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [item.content_id, item.type, item.title, item.artist ?? null,
     item.artwork_url ?? null, item.source, Date.now()],
  );
  // Mantener solo los últimos 100 elementos
  await db.runAsync(
    'DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY played_at DESC LIMIT 100)',
  );
}

export async function getHistory(limit = 30): Promise<any[]> {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM history ORDER BY played_at DESC LIMIT ?', [limit]);
}

export async function saveResumePosition(episodeId: string, positionS: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO resume_positions (episode_id, position_s, updated_at) VALUES (?, ?, ?)',
    [episodeId, positionS, Date.now()],
  );
}

export async function getResumePosition(episodeId: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ position_s: number }>(
    'SELECT position_s FROM resume_positions WHERE episode_id = ?',
    [episodeId],
  );
  return row?.position_s ?? 0;
}

export async function createPlaylist(name: string, description?: string): Promise<number> {
  const db = await getDb();
  const now = Date.now();
  const result = await db.runAsync(
    'INSERT INTO playlists (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)',
    [name, description ?? null, now, now],
  );
  return result.lastInsertRowId;
}

export async function getPlaylists(): Promise<any[]> {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM playlists ORDER BY updated_at DESC');
}

export async function deletePlaylist(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM playlists WHERE id = ?', [id]);
}

export async function addTrackToPlaylist(playlistId: number, trackId: string): Promise<void> {
  const db = await getDb();
  const pos = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM playlist_tracks WHERE playlist_id = ?', [playlistId],
  );
  await db.runAsync(
    'INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position, added_at) VALUES (?, ?, ?, ?)',
    [playlistId, trackId, (pos?.cnt ?? 0) + 1, Date.now()],
  );
  await db.runAsync('UPDATE playlists SET updated_at = ? WHERE id = ?', [Date.now(), playlistId]);
}

export async function subscribeToPodcast(podcast: {
  feed_id: string; title: string; author?: string; artwork_url?: string; feed_url: string;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO subscriptions (feed_id, title, author, artwork_url, feed_url, subscribed_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [podcast.feed_id, podcast.title, podcast.author ?? null,
     podcast.artwork_url ?? null, podcast.feed_url, Date.now()],
  );
}

export async function unsubscribeFromPodcast(feedId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM subscriptions WHERE feed_id = ?', [feedId]);
}

export async function isSubscribed(feedId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ feed_id: string }>(
    'SELECT feed_id FROM subscriptions WHERE feed_id = ?', [feedId],
  );
  return row !== null;
}

export async function getSubscriptions(): Promise<any[]> {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM subscriptions ORDER BY subscribed_at DESC');
}
