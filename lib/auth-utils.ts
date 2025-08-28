import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return null
    }
    
    return session.user.id
  } catch (error) {
    console.error('Error getting current user ID:', error)
    return null
  }
}

export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId()
  
  if (!userId) {
    throw new Error('Authentication required')
  }
  
  return userId
}
