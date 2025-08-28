"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Pause, Square, Timer } from "lucide-react"

interface Subject {
  id: string
  name: string
  color: string
}

interface StudyTimerProps {
  subjects: Subject[]
  onSessionComplete: (session: any) => void
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  defaultDuration?: number // in minutes
  breakDuration?: number // in minutes
  showBreakReminders?: boolean
}

export function StudyTimer({ 
  subjects, 
  onSessionComplete, 
  isOpen: externalIsOpen, 
  onOpenChange,
  defaultDuration = 240, // Default to 4 hours
  breakDuration = 15, // Default to 15 minutes
  showBreakReminders = true
}: StudyTimerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  
  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open)
    } else {
      setInternalIsOpen(open)
    }
  }
  const [isRunning, setIsRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [selectedSubject, setSelectedSubject] = useState("")
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [notes, setNotes] = useState("")
  const [showBreakAlert, setShowBreakAlert] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          const newSeconds = prev + 1
          
          // Check for break reminders
          if (showBreakReminders && breakDuration > 0) {
            const minutes = Math.floor(newSeconds / 60)
            if (minutes > 0 && minutes % breakDuration === 0) {
              setShowBreakAlert(true)
              // Auto-hide break alert after 10 seconds
              setTimeout(() => setShowBreakAlert(false), 10000)
            }
          }
          
          return newSeconds
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, showBreakReminders, breakDuration])

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const formatTimeCompact = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStart = () => {
    if (!selectedSubject) return
    setIsRunning(true)
    setStartTime(new Date())
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleStop = () => {
    if (startTime && seconds > 0 && selectedSubject) {
      const endTime = new Date()
      const subject = subjects.find((s) => s.id === selectedSubject)

      if (subject) {
        const session = {
          subjectId: selectedSubject,
          subjectName: subject.name,
          date: startTime.toISOString().split("T")[0],
          startTime: startTime.toTimeString().slice(0, 5),
          endTime: endTime.toTimeString().slice(0, 5),
          duration: Math.floor(seconds / 60),
          topicsCovered: [],
          materialsUsed: [],
          sessionType: "Focused Study" as const,
          productivity: 3 as const,
          notes: notes.trim() || undefined,
        }

        onSessionComplete(session)
      }
    }

    // Reset timer
    setIsRunning(false)
    setSeconds(0)
    setSelectedSubject("")
    setStartTime(null)
    setNotes("")
    setIsOpen(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setSeconds(0)
    setStartTime(null)
    setNotes("")
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Timer className="h-4 w-4 mr-2" />
        Timer
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Study Timer</DialogTitle>
            <DialogDescription>Track your study time in real-time</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Break Alert */}
            {showBreakAlert && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <div className="text-yellow-800 font-medium">⏰ Break Time!</div>
                <div className="text-yellow-600 text-sm">
                  You've been studying for {Math.floor(seconds / 60)} minutes. 
                  Consider taking a {breakDuration}-minute break!
                </div>
              </div>
            )}

            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-primary mb-2">{formatTime(seconds)}</div>
              <div className="text-lg font-mono text-muted-foreground mb-2">{formatTimeCompact(seconds)}</div>
              <div className="text-sm text-muted-foreground">
                {isRunning ? "Timer running..." : seconds > 0 ? "Timer paused" : "Ready to start"}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={isRunning}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject to study" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isRunning && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Session Notes</label>
                <textarea
                  className="w-full p-2 border rounded-md text-sm resize-none"
                  placeholder="What are you studying? Any insights or questions?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={!isRunning}
                />
              </div>
            )}

            <div className="flex justify-center space-x-2">
              {!isRunning ? (
                <Button onClick={handleStart} disabled={!selectedSubject} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
              ) : (
                <Button onClick={handlePause} variant="outline" className="flex-1 bg-transparent">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}

              <Button onClick={handleReset} variant="outline" disabled={seconds === 0}>
                Reset
              </Button>

              <Button onClick={handleStop} variant="destructive" disabled={seconds === 0}>
                <Square className="h-4 w-4 mr-2" />
                Stop & Save
              </Button>
            </div>

            {seconds > 0 && (
              <div className="text-xs text-muted-foreground text-center">
                Session will be automatically saved when you stop the timer
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
