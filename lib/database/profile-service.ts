import { PrismaClient, UserProfile } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateProfileData {
  fullName: string
  university?: string
  program?: string
  currentYear?: string
  gpa?: string
  bio?: string
  profilePicture?: string
}

export interface UpdateProfileData extends Partial<CreateProfileData> {
  // All fields are optional for updates - extends from CreateProfileData
  // This interface allows partial updates of profile data
  id?: string // Allow updating the profile ID if needed
}

export class ProfileService {
  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      return await prisma.userProfile.findUnique({
        where: { userId }
      })
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw new Error('Failed to fetch user profile')
    }
  }

  /**
   * Create or update user profile
   */
  async upsertUserProfile(userId: string, data: CreateProfileData): Promise<UserProfile> {
    try {
      return await prisma.userProfile.upsert({
        where: { userId },
        update: data,
        create: {
          userId,
          ...data
        }
      })
    } catch (error) {
      console.error('Error upserting user profile:', error)
      throw new Error('Failed to save user profile')
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, data: UpdateProfileData): Promise<UserProfile> {
    try {
      console.log('ProfileService: Updating profile for user:', userId, 'with data:', data)
      
      // Use upsert to create profile if it doesn't exist
      const result = await prisma.userProfile.upsert({
        where: { userId },
        update: data,
        create: {
          userId,
          fullName: data.fullName || 'Student Name',
          ...data
        }
      })
      
      console.log('ProfileService: Profile updated successfully:', result)
      return result
    } catch (error) {
      console.error('ProfileService: Error updating user profile:', error)
      console.error('ProfileService: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      throw new Error(`Failed to update user profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update profile picture
   */
  async updateProfilePicture(userId: string, profilePicture: string): Promise<UserProfile> {
    try {
      return await prisma.userProfile.update({
        where: { userId },
        data: { profilePicture }
      })
    } catch (error) {
      console.error('Error updating profile picture:', error)
      throw new Error('Failed to update profile picture')
    }
  }

  /**
   * Delete user profile
   */
  async deleteUserProfile(userId: string): Promise<void> {
    try {
      await prisma.userProfile.delete({
        where: { userId }
      })
    } catch (error) {
      console.error('Error deleting user profile:', error)
      throw new Error('Failed to delete user profile')
    }
  }
}

export const profileService = new ProfileService()
