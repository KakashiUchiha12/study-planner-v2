// Database-based authentication configuration
console.log('🔧 Auth: Loading database authentication configuration');

import { dbService } from './database';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-here',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        username: { label: 'Username', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        try {
          // Check if user exists
          let user = await dbService.getPrisma().user.findUnique({
            where: { email: credentials.email }
          });

          // If user doesn't exist, create a new one
          if (!user) {
            if (!credentials.name || !credentials.username) {
              return null;
            }
            
            user = await dbService.getPrisma().user.create({
              data: {
                email: credentials.email,
                name: credentials.name,
                username: credentials.username,
                passwordHash: 'dummy_hash_for_credentials_auth',
                image: null
              }
            });
            console.log('🔧 Auth: Created new user:', user.id, user.name, user.username);
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            image: user.image
          };
        } catch (error) {
          console.error('🔧 Auth: Error in authorize:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    session: ({ session, token }: { session: any; token: any }) => {
      console.log('🔧 Auth: Database session callback called');
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.username = token.username;
        session.user.image = token.image;
      }
      return session;
    },
    jwt: ({ token, user }: { token: any; user: any }) => {
      console.log('🔧 Auth: Database JWT callback called');
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.username = user.username;
        token.image = user.image;
      }
      return token;
    }
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/signup'
  }
};

// Get server session with NextAuth
export async function getServerSession(options: any) {
  try {
    console.log('🔧 Auth: Getting session from NextAuth');
    
    // Import NextAuth's getServerSession
    const { getServerSession: nextAuthGetServerSession } = await import('next-auth');
    
    const session = await nextAuthGetServerSession(authOptions);
    
    if (session?.user) {
      console.log('🔧 Auth: Using user from NextAuth session:', session.user.id, session.user.name);
      return session;
    }
    
    // Fallback: use the first available user from the database for development
    console.log('🔧 Auth: No NextAuth session, using fallback user');
    const users = await dbService.getPrisma().user.findMany({
      take: 1,
      orderBy: { createdAt: 'asc' }
    });
    
    if (users.length === 0) {
      console.log('🔧 Auth: No users found in database');
      return null;
    }
    
    const user = users[0];
    console.log('🔧 Auth: Using fallback user from database:', user.id, user.name);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        image: user.image
      }
    };
  } catch (error) {
    console.error('🔧 Auth: Error getting session:', error);
    return null;
  }
}
