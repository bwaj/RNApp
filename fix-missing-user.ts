import { db } from './src/lib/db/config'
import { users, userProfiles } from './src/lib/db/schema'

async function createMissingUser() {
  try {
    console.log('🔧 Creating missing user record...')
    
    // Your user data from the session
    const userData = {
      id: '111739180054098891432', // Your Google ID
      email: 'bharatwaj@gmail.com',
      name: 'Bharathwaj Sampathkumar (Waj)',
      image: 'https://lh3.googleusercontent.com/a/ACg8ocIr8H29QNcmjbh_Mi0oPe6JknqKYRkzwiJameTA-2uoU61LtF3LuQ=s96-c',
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Create user record
    const [user] = await db.insert(users).values(userData).returning()
    console.log('✅ User created:', user.id)

    // Create user profile record  
    const profileData = {
      userId: user.id,
      googleId: '111739180054098891432',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const [profile] = await db.insert(userProfiles).values(profileData).returning()
    console.log('✅ User profile created:', profile.id)

    console.log('🎉 Missing user records created successfully!')
    console.log('You can now use Spotify sync without foreign key errors.')
    
  } catch (error) {
    console.error('❌ Error creating user:', error)
  } finally {
    process.exit()
  }
}

createMissingUser()
