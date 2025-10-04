"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageDialog } from "@/components/ui/message-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageCropper } from "@/components/ui/ImageCropper"
import { Edit3, Camera, Save, X, Globe, Lock } from "lucide-react"

export interface ProfileData {
  fullName: string
  email: string
  university: string
  program: string
  currentYear?: string
  gpa: string
  bio: string
  profilePicture?: string
  banner?: string
  visibility?: 'public' | 'private'
}

interface ProfileSummaryProps {
  profileData: ProfileData
  activeGoalsCount: number
  editingProfile: boolean
  onEditProfile: () => void
  onCloseEditProfile: () => void
  onProfilePictureUpload: (file: File) => Promise<void>
  onBannerUpload: (file: File) => Promise<void>
  onUpdateProfile: (data: ProfileData) => Promise<void>
}

export function ProfileSummary({ 
  profileData, 
  activeGoalsCount, 
  editingProfile,
  onEditProfile,
  onCloseEditProfile,
  onProfilePictureUpload,
  onBannerUpload,
  onUpdateProfile 
}: ProfileSummaryProps) {
  const [editData, setEditData] = useState<ProfileData>(profileData)
  const [uploading, setUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [messageDialog, setMessageDialog] = useState<{
    open: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    open: false,
    type: 'info',
    title: '',
    message: ''
  })
  const [showCropper, setShowCropper] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string>('')
  const [showBannerCropper, setShowBannerCropper] = useState(false)
  const [bannerImageSrc, setBannerImageSrc] = useState<string>('')

  // Update editData when profileData changes
  useEffect(() => {
    setEditData(profileData)
  }, [profileData])

  const handleSave = async () => {
    try {
      await onUpdateProfile(editData)
      onCloseEditProfile() // Close the modal
      setMessageDialog({
        open: true,
        type: 'success',
        title: 'Success',
        message: 'Profile updated successfully!'
      })
    } catch (error) {
      console.error('Failed to update profile:', error)
      setMessageDialog({
        open: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to update profile. Please try again.'
      })
    }
  }

  const handleCancel = () => {
    setEditData(profileData)
    onCloseEditProfile() // Close the modal
  }

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessageDialog({
        open: true,
        type: 'error',
        title: 'Invalid File',
        message: 'Please select an image file.'
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessageDialog({
        open: true,
        type: 'error',
        title: 'File Too Large',
        message: 'Please select an image smaller than 5MB.'
      })
      return
    }

    // Create preview URL and show cropper
    const previewUrl = URL.createObjectURL(file)
    setImageToCrop(previewUrl)
    setShowCropper(true)
  }

  const handleCropComplete = async (croppedImageUrl: string) => {
    try {
      setUploading(true)
      setShowCropper(false)
      
      // Convert cropped image to file
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      const file = new File([blob], 'profile-picture.jpg', { type: 'image/jpeg' })
      
      await onProfilePictureUpload(file)
      
      // Clean up preview URL
      URL.revokeObjectURL(imageToCrop)
      setImageToCrop('')
      
      setMessageDialog({
        open: true,
        type: 'success',
        title: 'Success',
        message: 'Profile picture uploaded successfully!'
      })
    } catch (error) {
      console.error('Failed to upload profile picture:', error)
      setMessageDialog({
        open: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to upload profile picture. Please try again.'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop)
      setImageToCrop('')
    }
  }

  const handleBannerFileSelect = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setBannerImageSrc(e.target?.result as string)
      setShowBannerCropper(true)
    }
    reader.readAsDataURL(file)
  }

  const handleBannerChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessageDialog({
        open: true,
        type: 'error',
        title: 'Invalid File',
        message: 'Please select an image file.'
      })
      return
    }

    // Validate file size (max 10MB for banners)
    if (file.size > 10 * 1024 * 1024) {
      setMessageDialog({
        open: true,
        type: 'error',
        title: 'File Too Large',
        message: 'Please select an image smaller than 10MB.'
      })
      return
    }

    // Use the file selection handler
    handleBannerFileSelect(file)
  }

  const uploadBanner = async (croppedImageBlob: Blob) => {
    setBannerUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', croppedImageBlob, 'banner.jpg')

      const response = await fetch('/api/profile/banner', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setEditData(prev => ({ ...prev, banner: data.banner }))
        setMessageDialog({
          open: true,
          type: 'success',
          title: 'Success',
          message: 'Banner uploaded successfully!'
        })
      } else {
        const error = await response.json()
        setMessageDialog({
          open: true,
          type: 'error',
          title: 'Error',
          message: `Failed to upload banner: ${error.error}`
        })
      }
    } catch (error) {
      console.error('Error uploading banner:', error)
      setMessageDialog({
        open: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to upload banner. Please try again.'
      })
    } finally {
      setBannerUploading(false)
    }
  }

  const handleBannerCropCancel = () => {
    setShowBannerCropper(false)
    setBannerImageSrc('')
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

  const getBannerUrl = (banner?: string) => {
    if (!banner) {
      return undefined
    }
    
    // If it's already a full URL, return as is
    if (banner.startsWith('http')) {
      return banner
    }
    
    // If it's a relative path, construct the API URL
    if (banner.startsWith('/uploads/')) {
      // Extract the filename from the path
      // Path format: /uploads/{userId}/banner/{filename}
      const pathParts = banner.split('/')
      
      if (pathParts.length >= 5) {
        const userId = pathParts[2]
        const filename = pathParts[4]
        const apiUrl = `/api/profile/banner/${userId}/${filename}`
        return apiUrl
      }
    }
    
    return banner
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
              {/* Banner Upload */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Profile Banner
                </Label>
                <div className="relative">
          {editData.banner ? (
            <div className="relative w-full rounded-lg overflow-hidden border border-gray-200" style={{ aspectRatio: '4/1' }}>
              <img
                src={getBannerUrl(editData.banner)}
                alt="Profile banner"
                className="w-full h-full object-cover"
                style={{ aspectRatio: '4/1' }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => bannerInputRef.current?.click()}
                disabled={bannerUploading}
                className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              >
                <Camera className="h-4 w-4 mr-2" />
                {bannerUploading ? 'Uploading...' : 'Change Banner'}
              </Button>
            </div>
          ) : (
            <div className="w-full rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center" style={{ aspectRatio: '4/1' }}>
              <div className="text-center">
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={bannerUploading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {bannerUploading ? 'Uploading...' : 'Upload Banner'}
                </Button>
              </div>
            </div>
          )}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                  />
                </div>
              </div>

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
                    value={editData.fullName || ''}
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
                    value={editData.email || ''}
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

                {/* Profile Visibility */}
                <div className="sm:col-span-2">
                  <Label htmlFor="visibility" className="text-sm font-medium text-slate-700">
                    Profile Visibility
                  </Label>
                  <Select
                    value={editData.visibility || 'public'}
                    onValueChange={(value: 'public' | 'private') => 
                      setEditData(prev => ({ ...prev, visibility: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <span>Public - Anyone can see your profile</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          <span>Private - Only you can see your profile</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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

      {/* Message Dialog */}
      <MessageDialog
        open={messageDialog.open}
        onClose={() => setMessageDialog(prev => ({ ...prev, open: false }))}
        type={messageDialog.type}
        title={messageDialog.title}
        message={messageDialog.message}
      />

      {/* Image Cropper */}
      {showCropper && (
        <ImageCropper
          imageUrl={imageToCrop}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}

      {/* Banner Cropper */}
      <ImageCropper
        open={showBannerCropper}
        onOpenChange={setShowBannerCropper}
        imageSrc={bannerImageSrc}
        onCropComplete={uploadBanner}
        aspectRatio={4 / 1}
        title="Crop Banner Image"
      />
    </>
  )
}
