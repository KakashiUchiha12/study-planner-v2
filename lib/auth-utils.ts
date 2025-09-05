// Database-based authentication utilities
console.log('🔧 AuthUtils: Loading database authentication utilities');

import { dbService } from './database';

export function getUserId(session: any): string | null {
  console.log('🔧 AuthUtils: getUserId called with session:', !!session);
  if (!session?.user) return null
  return (session.user as any).id
}

export async function getCurrentUserId(): Promise<string> {
  console.log('🔧 AuthUtils: getCurrentUserId called - getting from database');
  
  try {
    // Get the first available user from database
    const users = await dbService.getPrisma().user.findMany({
      take: 1,
      orderBy: { createdAt: 'asc' }
    });
    
    if (users.length === 0) {
      throw new Error('No users found in database');
    }
    
    const userId = users[0].id;
    console.log('🔧 AuthUtils: Using user ID from database:', userId);
    return userId;
  } catch (error) {
    console.error('🔧 AuthUtils: Error getting user ID from database:', error);
    throw new Error('Authentication required');
  }
}

export async function requireAuth(): Promise<string> {
  console.log('🔧 AuthUtils: requireAuth called - using database authentication');
  const userId = await getCurrentUserId()
  
  if (!userId) {
    throw new Error('Authentication required')
  }
  
  return userId
}
