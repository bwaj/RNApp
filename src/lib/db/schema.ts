import { 
  pgTable, 
  text, 
  timestamp, 
  uuid, 
  integer, 
  boolean, 
  jsonb,
  index,
  unique 
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table - handles Google OAuth authentication
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  googleId: text('google_id').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  googleIdIdx: index('users_google_id_idx').on(table.googleId),
  emailIdx: index('users_email_idx').on(table.email),
}))

// Spotify connections - manages Spotify OAuth tokens and connection status
export const spotifyConnections = pgTable('spotify_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  spotifyUserId: text('spotify_user_id').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiresAt: timestamp('token_expires_at').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('spotify_connections_user_id_idx').on(table.userId),
  spotifyUserIdIdx: index('spotify_connections_spotify_user_id_idx').on(table.spotifyUserId),
  userSpotifyUnique: unique('user_spotify_unique').on(table.userId, table.spotifyUserId),
}))

// Artists - stores artist metadata from Spotify
export const artists = pgTable('artists', {
  id: uuid('id').primaryKey().defaultRandom(),
  spotifyId: text('spotify_id').notNull().unique(),
  name: text('name').notNull(),
  genres: text('genres').array(),
  popularity: integer('popularity'),
  imageUrl: text('image_url'),
  externalUrls: jsonb('external_urls'),
  followers: integer('followers'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  spotifyIdIdx: index('artists_spotify_id_idx').on(table.spotifyId),
  nameIdx: index('artists_name_idx').on(table.name),
}))

// Albums - stores album metadata from Spotify
export const albums = pgTable('albums', {
  id: uuid('id').primaryKey().defaultRandom(),
  spotifyId: text('spotify_id').notNull().unique(),
  name: text('name').notNull(),
  albumType: text('album_type'), // album, single, compilation
  releaseDate: text('release_date'),
  totalTracks: integer('total_tracks'),
  imageUrl: text('image_url'),
  externalUrls: jsonb('external_urls'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  spotifyIdIdx: index('albums_spotify_id_idx').on(table.spotifyId),
  nameIdx: index('albums_name_idx').on(table.name),
}))

// Tracks - stores track metadata from Spotify
export const tracks = pgTable('tracks', {
  id: uuid('id').primaryKey().defaultRandom(),
  spotifyId: text('spotify_id').notNull().unique(),
  name: text('name').notNull(),
  albumId: uuid('album_id').references(() => albums.id),
  durationMs: integer('duration_ms').notNull(),
  popularity: integer('popularity'),
  explicit: boolean('explicit').default(false),
  previewUrl: text('preview_url'),
  trackNumber: integer('track_number'),
  externalUrls: jsonb('external_urls'),
  audioFeatures: jsonb('audio_features'), // acousticness, danceability, energy, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  spotifyIdIdx: index('tracks_spotify_id_idx').on(table.spotifyId),
  nameIdx: index('tracks_name_idx').on(table.name),
  albumIdIdx: index('tracks_album_id_idx').on(table.albumId),
}))

// Track Artists - many-to-many relationship between tracks and artists
export const trackArtists = pgTable('track_artists', {
  trackId: uuid('track_id').references(() => tracks.id, { onDelete: 'cascade' }).notNull(),
  artistId: uuid('artist_id').references(() => artists.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  trackArtistIdx: index('track_artists_track_artist_idx').on(table.trackId, table.artistId),
  trackIdIdx: index('track_artists_track_id_idx').on(table.trackId),
  artistIdIdx: index('track_artists_artist_id_idx').on(table.artistId),
}))

// Album Artists - many-to-many relationship between albums and artists
export const albumArtists = pgTable('album_artists', {
  albumId: uuid('album_id').references(() => albums.id, { onDelete: 'cascade' }).notNull(),
  artistId: uuid('artist_id').references(() => artists.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  albumArtistIdx: index('album_artists_album_artist_idx').on(table.albumId, table.artistId),
  albumIdIdx: index('album_artists_album_id_idx').on(table.albumId),
  artistIdIdx: index('album_artists_artist_id_idx').on(table.artistId),
}))

// Listening History - core table storing individual play events
export const listeningHistory = pgTable('listening_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  trackId: uuid('track_id').references(() => tracks.id).notNull(),
  playedAt: timestamp('played_at').notNull(),
  context: jsonb('context'), // playlist, album, artist radio, etc.
  progressMs: integer('progress_ms'), // how far into the track they listened
  shuffle: boolean('shuffle'),
  repeat: text('repeat'), // off, track, context
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('listening_history_user_id_idx').on(table.userId),
  trackIdIdx: index('listening_history_track_id_idx').on(table.trackId),
  playedAtIdx: index('listening_history_played_at_idx').on(table.playedAt),
  userPlayedAtIdx: index('listening_history_user_played_at_idx').on(table.userId, table.playedAt),
}))

// User Stats Cache - pre-computed statistics for performance
export const userStats = pgTable('user_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  timeRange: text('time_range').notNull(), // short_term, medium_term, long_term
  statType: text('stat_type').notNull(), // top_artists, top_tracks, genres, listening_time
  data: jsonb('data').notNull(), // flexible JSON structure for different stat types
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_stats_user_id_idx').on(table.userId),
  userTimeRangeIdx: index('user_stats_user_time_range_idx').on(table.userId, table.timeRange),
  userStatTypeIdx: index('user_stats_user_stat_type_idx').on(table.userId, table.statType),
  lastUpdatedIdx: index('user_stats_last_updated_idx').on(table.lastUpdated),
  userTimeRangeStatUnique: unique('user_time_range_stat_unique').on(table.userId, table.timeRange, table.statType),
}))

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  spotifyConnections: many(spotifyConnections),
  listeningHistory: many(listeningHistory),
  userStats: many(userStats),
}))

export const spotifyConnectionsRelations = relations(spotifyConnections, ({ one }) => ({
  user: one(users, {
    fields: [spotifyConnections.userId],
    references: [users.id],
  }),
}))

export const artistsRelations = relations(artists, ({ many }) => ({
  trackArtists: many(trackArtists),
  albumArtists: many(albumArtists),
}))

export const albumsRelations = relations(albums, ({ many, one }) => ({
  tracks: many(tracks),
  albumArtists: many(albumArtists),
}))

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  album: one(albums, {
    fields: [tracks.albumId],
    references: [albums.id],
  }),
  trackArtists: many(trackArtists),
  listeningHistory: many(listeningHistory),
}))

export const trackArtistsRelations = relations(trackArtists, ({ one }) => ({
  track: one(tracks, {
    fields: [trackArtists.trackId],
    references: [tracks.id],
  }),
  artist: one(artists, {
    fields: [trackArtists.artistId],
    references: [artists.id],
  }),
}))

export const albumArtistsRelations = relations(albumArtists, ({ one }) => ({
  album: one(albums, {
    fields: [albumArtists.albumId],
    references: [albums.id],
  }),
  artist: one(artists, {
    fields: [albumArtists.artistId],
    references: [artists.id],
  }),
}))

export const listeningHistoryRelations = relations(listeningHistory, ({ one }) => ({
  user: one(users, {
    fields: [listeningHistory.userId],
    references: [users.id],
  }),
  track: one(tracks, {
    fields: [listeningHistory.trackId],
    references: [tracks.id],
  }),
}))

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}))

// Type exports for use throughout the application
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type SpotifyConnection = typeof spotifyConnections.$inferSelect
export type NewSpotifyConnection = typeof spotifyConnections.$inferInsert
export type Artist = typeof artists.$inferSelect
export type NewArtist = typeof artists.$inferInsert
export type Album = typeof albums.$inferSelect
export type NewAlbum = typeof albums.$inferInsert
export type Track = typeof tracks.$inferSelect
export type NewTrack = typeof tracks.$inferInsert
export type ListeningHistory = typeof listeningHistory.$inferSelect
export type NewListeningHistory = typeof listeningHistory.$inferInsert
export type UserStats = typeof userStats.$inferSelect
export type NewUserStats = typeof userStats.$inferInsert
