import { getServerSession } from 'next-auth/next'
import { authOptions } from './config'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user ?? null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  return user
}

export async function getSession() {
  return await getServerSession(authOptions)
}
