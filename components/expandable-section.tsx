"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExpandableSectionProps {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
  icon?: React.ComponentType<{ className?: string }>
}

export function ExpandableSection({ 
  title, 
  children, 
  defaultExpanded = false,
  icon: Icon 
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  return (
    <div className="card-enhanced overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsExpanded(!isExpanded)
          }
        }}
        className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between interactive-element focus-ring"
        aria-expanded={isExpanded}
        aria-controls={`expandable-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title} section`}
      >
        <div className="flex items-center space-x-2 sm:space-x-3">
          {Icon && (
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-primary/10 to-accent-purple/10 rounded-lg">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          )}
          <span className="font-semibold text-foreground text-base sm:text-lg">{title}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
            isExpanded ? 'bg-accent-green' : 'bg-muted-foreground/40'
          }`}></div>
          <ChevronDown 
            className={`h-5 w-5 text-muted-foreground transition-all duration-300 ${
              isExpanded ? 'rotate-180 text-primary' : ''
            }`}
          />
        </div>
      </button>
      
      <div 
        id={`expandable-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className={`overflow-visible transition-all duration-500 ease-out ${
          isExpanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-border/30">
          <div className="pt-4 sm:pt-6 animate-fade-in-up">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
