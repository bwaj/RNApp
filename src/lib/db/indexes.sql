-- Database performance optimization indexes
-- Run these after the initial migration to improve query performance

-- Listening History Indexes
CREATE INDEX IF NOT EXISTS idx_listening_history_user_id ON listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_played_at ON listening_history(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_listening_history_user_played_at ON listening_history(user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_listening_history_track_id ON listening_history(track_id);

-- Track Indexes
CREATE INDEX IF NOT EXISTS idx_tracks_spotify_id ON tracks(spotify_id);
CREATE INDEX IF NOT EXISTS idx_tracks_album_id ON tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_tracks_name ON tracks(name);
CREATE INDEX IF NOT EXISTS idx_tracks_popularity ON tracks(popularity DESC);

-- Artist Indexes
CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists(spotify_id);
CREATE INDEX IF NOT EXISTS idx_artists_name ON artists(name);
CREATE INDEX IF NOT EXISTS idx_artists_genres ON artists USING GIN(genres);

-- Album Indexes
CREATE INDEX IF NOT EXISTS idx_albums_spotify_id ON albums(spotify_id);
CREATE INDEX IF NOT EXISTS idx_albums_name ON albums(name);
CREATE INDEX IF NOT EXISTS idx_albums_release_date ON albums(release_date DESC);

-- Track Artists Junction Table Indexes
CREATE INDEX IF NOT EXISTS idx_track_artists_track_id ON track_artists(track_id);
CREATE INDEX IF NOT EXISTS idx_track_artists_artist_id ON track_artists(artist_id);

-- Spotify Connections Indexes
CREATE INDEX IF NOT EXISTS idx_spotify_connections_user_id ON spotify_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_connections_spotify_user_id ON spotify_connections(spotify_user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_connections_active ON spotify_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_spotify_connections_token_expires ON spotify_connections(token_expires_at);

-- User Stats Indexes
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_date ON user_stats(stats_date DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_listening_history_user_track ON listening_history(user_id, track_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_user_date_range ON listening_history(user_id, played_at) WHERE played_at >= CURRENT_DATE - INTERVAL '30 days';

-- Partial indexes for active connections and recent data
CREATE INDEX IF NOT EXISTS idx_spotify_connections_active_users ON spotify_connections(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_recent_listening_history ON listening_history(user_id, played_at DESC) WHERE played_at >= CURRENT_DATE - INTERVAL '7 days';

-- Optimize for genre queries
CREATE INDEX IF NOT EXISTS idx_artists_genres_gin ON artists USING GIN(genres) WHERE array_length(genres, 1) > 0;

-- Text search indexes for search functionality
CREATE INDEX IF NOT EXISTS idx_tracks_name_trgm ON tracks USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_artists_name_trgm ON artists USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_albums_name_trgm ON albums USING GIN(name gin_trgm_ops);

-- Note: To enable trigram search, you may need to enable the pg_trgm extension:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
