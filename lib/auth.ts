// Mock authentication configuration (NextAuth removed)
console.log('🔧 Auth: Loading mock authentication configuration');

export const authOptions = {
  // Mock configuration for compatibility
  providers: [],
  callbacks: {
    session: ({ session }: { session: any }) => {
      console.log('🔧 Auth: Mock session callback called');
      return {
        ...session,
        user: {
          ...session?.user,
          id: 'mock-user-id'
        }
      };
    },
    jwt: ({ token }: { token: any }) => {
      console.log('🔧 Auth: Mock JWT callback called');
      return {
        ...token,
        id: 'mock-user-id'
      };
    }
  }
};

// Mock getServerSession function
export async function getServerSession(options: any) {
  console.log('🔧 Auth: Mock getServerSession called');
  return {
    user: {
      id: 'mock-user-id',
      email: 'mock@example.com',
      name: 'Mock User'
    }
  };
}
