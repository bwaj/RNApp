CREATE TABLE "album_artists" (
	"album_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "albums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spotify_id" text NOT NULL,
	"name" text NOT NULL,
	"album_type" text,
	"release_date" text,
	"total_tracks" integer,
	"image_url" text,
	"external_urls" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "albums_spotify_id_unique" UNIQUE("spotify_id")
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spotify_id" text NOT NULL,
	"name" text NOT NULL,
	"genres" text[],
	"popularity" integer,
	"image_url" text,
	"external_urls" jsonb,
	"followers" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artists_spotify_id_unique" UNIQUE("spotify_id")
);
--> statement-breakpoint
CREATE TABLE "listening_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"track_id" uuid NOT NULL,
	"played_at" timestamp NOT NULL,
	"context" jsonb,
	"progress_ms" integer,
	"shuffle" boolean,
	"repeat" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spotify_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"spotify_user_id" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"token_expires_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_spotify_unique" UNIQUE("user_id","spotify_user_id")
);
--> statement-breakpoint
CREATE TABLE "track_artists" (
	"track_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spotify_id" text NOT NULL,
	"name" text NOT NULL,
	"album_id" uuid,
	"duration_ms" integer NOT NULL,
	"popularity" integer,
	"explicit" boolean DEFAULT false,
	"preview_url" text,
	"track_number" integer,
	"external_urls" jsonb,
	"audio_features" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tracks_spotify_id_unique" UNIQUE("spotify_id")
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"time_range" text NOT NULL,
	"stat_type" text NOT NULL,
	"data" jsonb NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_time_range_stat_unique" UNIQUE("user_id","time_range","stat_type")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "album_artists" ADD CONSTRAINT "album_artists_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_artists" ADD CONSTRAINT "album_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listening_history" ADD CONSTRAINT "listening_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listening_history" ADD CONSTRAINT "listening_history_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotify_connections" ADD CONSTRAINT "spotify_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_artists" ADD CONSTRAINT "track_artists_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_artists" ADD CONSTRAINT "track_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "album_artists_album_artist_idx" ON "album_artists" USING btree ("album_id","artist_id");--> statement-breakpoint
CREATE INDEX "album_artists_album_id_idx" ON "album_artists" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "album_artists_artist_id_idx" ON "album_artists" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "albums_spotify_id_idx" ON "albums" USING btree ("spotify_id");--> statement-breakpoint
CREATE INDEX "albums_name_idx" ON "albums" USING btree ("name");--> statement-breakpoint
CREATE INDEX "artists_spotify_id_idx" ON "artists" USING btree ("spotify_id");--> statement-breakpoint
CREATE INDEX "artists_name_idx" ON "artists" USING btree ("name");--> statement-breakpoint
CREATE INDEX "listening_history_user_id_idx" ON "listening_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "listening_history_track_id_idx" ON "listening_history" USING btree ("track_id");--> statement-breakpoint
CREATE INDEX "listening_history_played_at_idx" ON "listening_history" USING btree ("played_at");--> statement-breakpoint
CREATE INDEX "listening_history_user_played_at_idx" ON "listening_history" USING btree ("user_id","played_at");--> statement-breakpoint
CREATE INDEX "spotify_connections_user_id_idx" ON "spotify_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "spotify_connections_spotify_user_id_idx" ON "spotify_connections" USING btree ("spotify_user_id");--> statement-breakpoint
CREATE INDEX "track_artists_track_artist_idx" ON "track_artists" USING btree ("track_id","artist_id");--> statement-breakpoint
CREATE INDEX "track_artists_track_id_idx" ON "track_artists" USING btree ("track_id");--> statement-breakpoint
CREATE INDEX "track_artists_artist_id_idx" ON "track_artists" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "tracks_spotify_id_idx" ON "tracks" USING btree ("spotify_id");--> statement-breakpoint
CREATE INDEX "tracks_name_idx" ON "tracks" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tracks_album_id_idx" ON "tracks" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "user_stats_user_id_idx" ON "user_stats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_stats_user_time_range_idx" ON "user_stats" USING btree ("user_id","time_range");--> statement-breakpoint
CREATE INDEX "user_stats_user_stat_type_idx" ON "user_stats" USING btree ("user_id","stat_type");--> statement-breakpoint
CREATE INDEX "user_stats_last_updated_idx" ON "user_stats" USING btree ("last_updated");--> statement-breakpoint
CREATE INDEX "users_google_id_idx" ON "users" USING btree ("google_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");