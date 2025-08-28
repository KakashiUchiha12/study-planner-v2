"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface ProfileHeaderProps {
  onBackToDashboard: () => void
}

export function ProfileHeader({ onBackToDashboard }: ProfileHeaderProps) {
  return (
    <div className="mb-5 md:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 mb-3 md:mb-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-4xl font-bold text-slate-800 mb-2">Student Profile</h1>
          <p className="text-sm md:text-base text-slate-600">Your personal space for goals, growth, and resources</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white/80 backdrop-blur-sm border-slate-300 hover:bg-slate-50 hover:border-slate-400 w-full sm:w-auto h-7 md:h-10 text-xs md:text-sm px-2 md:px-4"
          onClick={onBackToDashboard}
        >
          <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
