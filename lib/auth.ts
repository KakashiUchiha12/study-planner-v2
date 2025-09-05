// Database-based authentication configuration
console.log('🔧 Auth: Loading database authentication configuration');

import { dbService } from './database';

export const authOptions = {
  // Database-based configuration
  providers: [],
  callbacks: {
    session: ({ session }: { session: any }) => {
      console.log('🔧 Auth: Database session callback called');
      return session;
    },
    jwt: ({ token }: { token: any }) => {
      console.log('🔧 Auth: Database JWT callback called');
      return token;
    }
  }
};

// Get server session with database user lookup
export async function getServerSession(options: any) {
  try {
    console.log('🔧 Auth: Getting session from database');
    
    // For now, let's use the first available user from the database
    // In a real app, this would come from the actual session/JWT
    const users = await dbService.getPrisma().user.findMany({
      take: 1,
      orderBy: { createdAt: 'asc' }
    });
    
    if (users.length === 0) {
      console.log('🔧 Auth: No users found in database');
      return null;
    }
    
    const user = users[0];
    console.log('🔧 Auth: Using user from database:', user.id, user.name);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image
      }
    };
  } catch (error) {
    console.error('🔧 Auth: Error getting session from database:', error);
    return null;
  }
}
