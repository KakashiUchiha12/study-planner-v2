"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Clock, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  className,
  disabled = false
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [hours, setHours] = React.useState(12)
  const [minutes, setMinutes] = React.useState(0)
  const [period, setPeriod] = React.useState<'AM' | 'PM'>('AM')
  const [currentView, setCurrentView] = React.useState<'hours' | 'minutes'>('hours')

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number)
      if (h !== undefined && m !== undefined) {
        let displayHours = h
        let displayPeriod: 'AM' | 'PM' = 'AM'
        
        if (h === 0) {
          displayHours = 12
        } else if (h > 12) {
          displayHours = h - 12
          displayPeriod = 'PM'
        } else if (h === 12) {
          displayPeriod = 'PM'
        }
        
        setHours(displayHours)
        setMinutes(m)
        setPeriod(displayPeriod)
      }
    }
  }, [value])

  const handleTimeChange = (newHours: number, newMinutes: number, newPeriod: 'AM' | 'PM') => {
    setHours(newHours)
    setMinutes(newMinutes)
    setPeriod(newPeriod)
    
    // Convert to 24-hour format for the value
    let adjustedHours = newHours
    if (newPeriod === 'PM' && newHours !== 12) adjustedHours += 12
    if (newPeriod === 'AM' && newHours === 12) adjustedHours = 0
    
    const timeString = `${adjustedHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`
    onChange(timeString)
  }

  const handleHourClick = (hour: number) => {
    setHours(hour)
    setCurrentView('minutes')
  }

  const handleMinuteClick = (minute: number) => {
    setMinutes(minute)
    setIsOpen(false)
    handleTimeChange(hours, minute, period)
  }

  const togglePeriod = () => {
    const newPeriod = period === 'AM' ? 'PM' : 'AM'
    setPeriod(newPeriod)
    handleTimeChange(hours, minutes, newPeriod)
  }

  const formatDisplayTime = () => {
    if (!value) return placeholder
    const [h, m] = value.split(':').map(Number)
    if (h === undefined || m === undefined) return placeholder
    
    let displayHours = h
    let displayPeriod = 'AM'
    
    if (h === 0) {
      displayHours = 12
    } else if (h > 12) {
      displayHours = h - 12
      displayPeriod = 'PM'
    } else if (h === 12) {
      displayPeriod = 'PM'
    }
    
    return `${displayHours}:${m.toString().padStart(2, '0')} ${displayPeriod}`
  }

  const renderClockFace = () => {
    // Default to larger size for SSR, will adjust on client
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640
    const clockSize = isSmallScreen ? 160 : 192 // w-40 = 160px, w-48 = 192px
    const radius = isSmallScreen ? 60 : 75
    const center = isSmallScreen ? 80 : 96
    const buttonSize = isSmallScreen ? 32 : 40 // w-8 = 32px, w-10 = 40px
    const textSize = isSmallScreen ? 'text-sm' : 'text-base'
    const dotSize = isSmallScreen ? 'w-2 h-2' : 'w-3 h-3'
    
    if (currentView === 'hours') {
      return (
        <div className={`relative w-40 h-40 sm:w-48 sm:h-48 mx-auto`}>
          {/* Clock circle */}
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          
          {/* Hour numbers */}
          {Array.from({ length: 12 }, (_, i) => {
            const hour = i === 0 ? 12 : i
            const angle = (i * 30 - 90) * (Math.PI / 180)
            const x = Math.cos(angle) * radius + center
            const y = Math.sin(angle) * radius + center
            
            return (
              <button
                key={hour}
                onClick={() => handleHourClick(hour)}
                className={cn(
                  `absolute ${buttonSize === 32 ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center ${textSize} font-semibold transition-all duration-200 hover:bg-primary/10`,
                  hours === hour 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background text-foreground hover:text-primary"
                )}
                style={{
                  left: `${x - (buttonSize / 2)}px`,
                  top: `${y - (buttonSize / 2)}px`
                }}
              >
                {hour}
              </button>
            )
          })}
          
          {/* Center dot */}
          <div className={`absolute inset-0 m-auto ${dotSize} bg-primary rounded-full`}></div>
        </div>
      )
    } else {
      return (
        <div className={`relative w-40 h-40 sm:w-48 sm:h-48 mx-auto`}>
          {/* Clock circle */}
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          
          {/* Minute numbers */}
          {Array.from({ length: 12 }, (_, i) => {
            const minute = i * 5
            const angle = (i * 30 - 90) * (Math.PI / 180)
            const x = Math.cos(angle) * radius + center
            const y = Math.sin(angle) * radius + center
            
            return (
              <button
                key={minute}
                onClick={() => handleMinuteClick(minute)}
                className={cn(
                  `absolute ${buttonSize === 32 ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center ${textSize} font-semibold transition-all duration-200 hover:bg-primary/10`,
                  minutes === minute 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background text-foreground hover:text-primary"
                )}
                style={{
                  left: `${x - (buttonSize / 2)}px`,
                  top: `${y - (buttonSize / 2)}px`
                }}
              >
                {minute.toString().padStart(2, '0')}
              </button>
            )
          })}
          
          {/* Center dot */}
          <div className={`absolute inset-0 m-auto ${dotSize} bg-primary rounded-full`}></div>
        </div>
      )
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {formatDisplayTime()}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-4 max-h-[80vh] overflow-y-auto z-[9999] shadow-lg border-2 bg-background" 
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={true}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        style={{ 
          maxHeight: 'calc(80vh - 2rem)',
          position: 'relative',
          overflow: 'visible'
        }}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-lg font-semibold">
                {currentView === 'hours' ? 'Select Hour' : 'Select Minute'}
              </div>
              <div className="text-sm text-muted-foreground">
                {hours}:{minutes.toString().padStart(2, '0')} {period}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Clock Face */}
          <div className="flex justify-center">
            {renderClockFace()}
          </div>

          {/* Navigation */}
          <div className="flex justify-center space-x-2">
            <Button
              variant={currentView === 'hours' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('hours')}
            >
              Hours
            </Button>
            <Button
              variant={currentView === 'minutes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('minutes')}
            >
              Minutes
            </Button>
          </div>

          {/* AM/PM Toggle */}
          <div className="flex justify-center">
            <Button
              variant={period === 'AM' ? 'default' : 'outline'}
              size="sm"
              onClick={() => togglePeriod()}
              className="mr-2"
            >
              AM
            </Button>
            <Button
              variant={period === 'PM' ? 'default' : 'outline'}
              size="sm"
              onClick={() => togglePeriod()}
            >
              PM
            </Button>
          </div>

          {/* Quick Time Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {['09:00', '12:00', '15:00', '18:00', '21:00', '00:00'].map((time) => (
              <Button
                key={time}
                variant="outline"
                size="sm"
                onClick={() => {
                  const [h, m] = time.split(':').map(Number)
                  if (h !== undefined && m !== undefined) {
                    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h
                    const displayPeriod = h >= 12 ? 'PM' : 'AM'
                    setHours(displayHour)
                    setMinutes(m)
                    setPeriod(displayPeriod)
                    handleTimeChange(displayHour, m, displayPeriod)
                    setIsOpen(false)
                  }
                }}
                className="text-xs"
              >
                {time}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
