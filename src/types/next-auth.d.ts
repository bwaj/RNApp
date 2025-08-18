declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      googleId: string
      email: string
      name: string
      image?: string
    }
    accessToken: string
  }

  interface User {
    id: string
    googleId: string
    email: string
    name: string
    image?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    googleId?: string
  }
}
