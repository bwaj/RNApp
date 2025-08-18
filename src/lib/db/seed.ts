import { db } from './config'
import { users, artists, albums, tracks, trackArtists, albumArtists } from './schema'

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...')

  try {
    // Create test user
    const [testUser] = await db.insert(users).values({
      googleId: 'test_google_id_123',
      email: 'test@example.com',
      name: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
    }).returning()

    console.log('✅ Created test user:', testUser.name)

    // Create test artists
    const [artist1] = await db.insert(artists).values({
      spotifyId: 'spotify_artist_1',
      name: 'The Test Artist',
      genres: ['rock', 'indie'],
      popularity: 75,
      imageUrl: 'https://example.com/artist1.jpg',
      followers: 50000,
    }).returning()

    const [artist2] = await db.insert(artists).values({
      spotifyId: 'spotify_artist_2',
      name: 'Another Artist',
      genres: ['pop', 'electronic'],
      popularity: 85,
      imageUrl: 'https://example.com/artist2.jpg',
      followers: 100000,
    }).returning()

    console.log('✅ Created test artists:', artist1.name, 'and', artist2.name)

    // Create test album
    const [album1] = await db.insert(albums).values({
      spotifyId: 'spotify_album_1',
      name: 'Test Album',
      albumType: 'album',
      releaseDate: '2024-01-01',
      totalTracks: 10,
      imageUrl: 'https://example.com/album1.jpg',
    }).returning()

    console.log('✅ Created test album:', album1.name)

    // Create test tracks
    const [track1] = await db.insert(tracks).values({
      spotifyId: 'spotify_track_1',
      name: 'Test Song One',
      albumId: album1.id,
      durationMs: 210000, // 3.5 minutes
      popularity: 70,
      explicit: false,
      trackNumber: 1,
    }).returning()

    const [track2] = await db.insert(tracks).values({
      spotifyId: 'spotify_track_2',
      name: 'Test Song Two',
      albumId: album1.id,
      durationMs: 180000, // 3 minutes
      popularity: 65,
      explicit: false,
      trackNumber: 2,
    }).returning()

    console.log('✅ Created test tracks:', track1.name, 'and', track2.name)

    // Link artists to album
    await db.insert(albumArtists).values([
      { albumId: album1.id, artistId: artist1.id },
      { albumId: album1.id, artistId: artist2.id },
    ])

    // Link artists to tracks
    await db.insert(trackArtists).values([
      { trackId: track1.id, artistId: artist1.id },
      { trackId: track2.id, artistId: artist1.id },
      { trackId: track2.id, artistId: artist2.id }, // collaboration
    ])

    console.log('✅ Created artist-track and artist-album relationships')

    console.log('🎉 Database seeding completed successfully!')

    return {
      user: testUser,
      artists: [artist1, artist2],
      album: album1,
      tracks: [track1, track2],
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Seeding failed:', error)
      process.exit(1)
    })
}
