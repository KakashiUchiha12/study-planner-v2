"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Camera, Edit3 } from "lucide-react"

interface ProfileData {
  fullName: string
  university?: string
  program?: string
  currentYear?: string
  gpa?: string
  bio?: string
  profilePicture?: string
}

interface ProfileSummaryProps {
  profileData: ProfileData
  activeGoalsCount: number
  onEditProfile: () => void
  onProfilePictureUpload: (file: File) => void
}

export function ProfileSummary({ 
  profileData, 
  activeGoalsCount, 
  onEditProfile, 
  onProfilePictureUpload 
}: ProfileSummaryProps) {
  const profilePicRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onProfilePictureUpload(file)
    }
  }

  return (
    <Card className="mb-6 md:mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-4">
          {/* Profile Picture */}
          <div className="relative group">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
              {profileData.profilePicture ? (
                <img 
                  src={profileData.profilePicture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
              )}
            </div>
            
            {/* Upload Overlay */}
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                 onClick={() => profilePicRef.current?.click()}>
              <Camera className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            
            <input
              ref={profilePicRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-3 mb-3 md:mb-2">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">{profileData.fullName}</h2>
              <Button 
                size="sm" 
                variant="outline"
                className="w-full sm:w-auto h-7 md:h-10 text-xs md:text-sm px-2 md:px-4"
                onClick={onEditProfile}
              >
                <Edit3 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Edit Profile
              </Button>
            </div>
            <p className="text-sm md:text-base text-slate-600 mb-2 md:mb-1">{profileData.program} • {profileData.currentYear}</p>
            <p className="text-xs md:text-slate-500 mb-3 md:mb-3">{profileData.university}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 md:gap-2 mb-3 md:mb-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-2 py-1">
                GPA: {profileData.gpa}
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-2 py-1">
                Active Goals: {activeGoalsCount}
              </Badge>
            </div>
            {profileData.bio && (
              <p className="text-xs md:text-slate-600 italic">"{profileData.bio}"</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
