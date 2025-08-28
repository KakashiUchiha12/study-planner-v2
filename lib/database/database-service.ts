import { PrismaClient } from '@prisma/client'

// Database service base class
export class DatabaseService {
  private prisma: PrismaClient
  private static instance: DatabaseService

  private constructor() {
    try {
      this.prisma = new PrismaClient()
      console.log('🔍 Database: Prisma client initialized successfully')
    } catch (error) {
      console.error('🔍 Database: Failed to initialize Prisma client:', error)
      throw error
    }
  }

  // Singleton pattern to ensure single database connection
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  // Get Prisma client instance
  public getPrisma(): PrismaClient {
    return this.prisma
  }

  // Close database connection
  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      console.log('🔍 Database: Testing connection...')
      await this.prisma.$queryRaw`SELECT 1`
      console.log('🔍 Database: Connection test successful')
      return true
    } catch (error) {
      console.error('🔍 Database: Health check failed:', error)
      return false
    }
  }

  // Test database connection with detailed error
  public async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔍 Database: Testing connection...')
      await this.prisma.$queryRaw`SELECT 1`
      console.log('🔍 Database: Connection test successful')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('🔍 Database: Connection test failed:', {
        error: error,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      return { success: false, error: errorMessage }
    }
  }

  // Initialize database with sample data if empty
  public async initializeDatabase(): Promise<void> {
    try {
      // Only create database structure, don't create sample data for users
      // Users will create their own subjects as needed
      console.log('Database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize database:', error)
    }
  }


}

// Export singleton instance
export const dbService = DatabaseService.getInstance()
