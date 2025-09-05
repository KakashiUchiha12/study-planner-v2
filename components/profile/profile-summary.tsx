"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit3, Camera, Save, X } from "lucide-react"

export interface ProfileData {
  fullName: string
  email: string
  university: string
  program: string
  currentYear?: string
  gpa: string
  bio: string
  profilePicture?: string
}

interface ProfileSummaryProps {
  profileData: ProfileData
  activeGoalsCount: number
  editingProfile: boolean
  onEditProfile: () => void
  onCloseEditProfile: () => void
  onProfilePictureUpload: (file: File) => Promise<void>
  onUpdateProfile: (data: ProfileData) => Promise<void>
}

export function ProfileSummary({ 
  profileData, 
  activeGoalsCount, 
  editingProfile,
  onEditProfile,
  onCloseEditProfile,
  onProfilePictureUpload, 
  onUpdateProfile 
}: ProfileSummaryProps) {
  const [editData, setEditData] = useState<ProfileData>(profileData)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update editData when profileData changes
  useEffect(() => {
    setEditData(profileData)
  }, [profileData])

  const handleSave = async () => {
    try {
      await onUpdateProfile(editData)
      onCloseEditProfile() // Close the modal
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    }
  }

  const handleCancel = () => {
    setEditData(profileData)
    onCloseEditProfile() // Close the modal
  }

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      
      await onProfilePictureUpload(file)
      
      // Update local state with new profile picture
      // Note: We don't need to update local state here since the parent will refresh
      // and pass the updated data through props
      alert('Profile picture uploaded successfully!')
    } catch (error) {
      console.error('Failed to upload profile picture:', error)
      alert('Failed to upload profile picture. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const getProfilePictureUrl = (profilePicture?: string) => {
    if (!profilePicture) {
      return undefined
    }
    
    // If it's already a full URL, return as is
    if (profilePicture.startsWith('http')) {
      return profilePicture
    }
    
    // If it's a relative path, construct the API URL
    if (profilePicture.startsWith('/uploads/')) {
      // Extract the filename from the path
      // Path format: /uploads/{userId}/profile/{filename}
      const pathParts = profilePicture.split('/')
      
      if (pathParts.length >= 5) {
        const userId = pathParts[2]
        const filename = pathParts[4]
        const apiUrl = `/api/profile/picture/${userId}/${filename}`
        return apiUrl
      }
    }
    
    return profilePicture
  }

  const getInitials = (name: string | undefined) => {
    if (!name || typeof name !== 'string') {
      return 'U'
    }
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800">Profile Summary</CardTitle>
            <Button
              onClick={onEditProfile}
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs sm:text-sm"
            >
              <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center sm:items-start space-y-3">
              <div className="relative">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                  <AvatarImage src={getProfilePictureUrl(profileData.profilePicture)} alt={profileData.fullName} />
                  <AvatarFallback className="text-lg sm:text-xl bg-slate-100 text-slate-600">
                    {getInitials(profileData.fullName)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-2 -right-2 h-6 w-6 p-0 rounded-full shadow-md"
                >
                  <Camera className="h-3 w-3" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Profile Details */}
            <div className="flex-1 space-y-3 sm:space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">{profileData.fullName}</h2>
                <p className="text-sm sm:text-base text-slate-600 break-all">{profileData.email}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <span className="text-xs sm:text-sm text-slate-500">University</span>
                  <p className="text-sm sm:text-base font-medium text-slate-800 break-words">{profileData.university || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-slate-500">Program</span>
                  <p className="text-sm sm:text-base font-medium text-slate-800 break-words">{profileData.program || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-slate-500">GPA</span>
                  <p className="text-sm sm:text-base font-medium text-slate-800">{profileData.gpa || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-slate-500">Active Goals</span>
                  <p className="text-sm sm:text-base font-medium text-slate-800">{activeGoalsCount}</p>
                </div>
              </div>

              {profileData.bio && (
                <div>
                  <span className="text-xs sm:text-sm text-slate-500">Bio</span>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed break-words">{profileData.bio}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      {editingProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800">Edit Profile</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Profile Picture Upload */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                  <AvatarImage src={getProfilePictureUrl(editData.profilePicture)} alt={editData.fullName} />
                  <AvatarFallback className="text-lg sm:text-xl bg-slate-100 text-slate-600">
                    {getInitials(editData.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <Label htmlFor="profile-picture" className="text-sm font-medium text-slate-700">
                    Profile Picture
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="mt-2 w-full sm:w-auto"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Change Picture'}
                  </Button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={editData.fullName}
                    onChange={(e) => setEditData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="mt-1"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="university" className="text-sm font-medium text-slate-700">
                    University
                  </Label>
                  <Input
                    id="university"
                    value={editData.university || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, university: e.target.value }))}
                    className="mt-1"
                    placeholder="Enter your university"
                  />
                </div>
                
                <div>
                  <Label htmlFor="program" className="text-sm font-medium text-slate-700">
                    Program
                  </Label>
                  <Input
                    id="program"
                    value={editData.program || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, program: e.target.value }))}
                    className="mt-1"
                    placeholder="Enter your program"
                  />
                </div>
                
                <div>
                  <Label htmlFor="currentYear" className="text-sm font-medium text-slate-700">
                    Current Year
                  </Label>
                  <Input
                    id="currentYear"
                    value={editData.currentYear || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, currentYear: e.target.value }))}
                    className="mt-1"
                    placeholder="e.g., 3rd Year"
                  />
                </div>
                
                <div>
                  <Label htmlFor="gpa" className="text-sm font-medium text-slate-700">
                    GPA
                  </Label>
                  <Input
                    id="gpa"
                    value={editData.gpa || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, gpa: e.target.value }))}
                    className="mt-1"
                    placeholder="e.g., 3.8"
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <Label htmlFor="bio" className="text-sm font-medium text-slate-700">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={editData.bio || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                    className="mt-1"
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  className="flex-1 sm:flex-none"
                  disabled={uploading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
