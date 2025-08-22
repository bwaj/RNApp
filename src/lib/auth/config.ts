import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { userOperations } from '@/lib/db/operations'

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Google OAuth credentials are required')
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required')
}

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.googleId = profile?.sub
      }
      return token
    },
    
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.sub as string
        session.user.googleId = token.googleId as string
        session.accessToken = token.accessToken as string
      }
      return session
    },
    
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile) {
        try {
          // Check if user exists in our database
          let existingUser = await userOperations.findByGoogleId(profile.sub)
          
          if (!existingUser) {
            // Create new user with NextAuth.js compatible format
            const newUser = await userOperations.create({
              id: profile.sub, // Use Google ID as primary key
              name: profile.name!,
              email: profile.email!,
              image: profile.picture,
              emailVerified: profile.email_verified ? new Date() : null
            })
            
            // Also create user profile entry
            await userOperations.createProfile({
              userId: newUser.id,
              googleId: profile.sub
            })
          }
          
          return true
        } catch (error) {
          console.error('Error during sign in:', error)
          return false
        }
      }
      
      return true
    },
  },
  
  events: {
    async signIn({ user, account }) {
      console.log(`User ${user.email} signed in with ${account?.provider}`)
    },
    
    async signOut() {
      console.log(`User signed out`)
    },
  },
  
  debug: process.env.NODE_ENV === 'development',
}
