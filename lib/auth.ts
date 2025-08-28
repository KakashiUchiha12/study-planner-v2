import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Check if user exists in database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (user) {
            // User exists - verify password
            const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash)
            
            if (isValidPassword) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image
              }
            } else {
              return null // Invalid password
            }
          } else {
            // User doesn't exist - create new user (auto-registration)
            const hashedPassword = await bcrypt.hash(credentials.password, 12)
            
            const newUser = await prisma.user.create({
              data: {
                name: credentials.email.split('@')[0], // Use email prefix as name
                email: credentials.email,
                passwordHash: hashedPassword,
                image: "/placeholder-user.jpg"
              }
            })

            return {
              id: newUser.id,
              name: newUser.name,
              email: newUser.email,
              image: newUser.image
            }
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user && token) {
        // Extend the user object with additional properties
        (session.user as any).id = token.id as string
        (session.user as any).email = token.email as string
        (session.user as any).name = token.name as string
        (session.user as any).image = token.image as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
