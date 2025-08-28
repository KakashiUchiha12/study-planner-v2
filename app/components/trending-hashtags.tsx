"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Flame } from "lucide-react"
import { HashtagProcessor } from "@/app/(lib)/hashtag-utils"

interface TrendingHashtagsProps {
  posts: Array<{ tags: string[] }>
  onHashtagClick?: (hashtag: string) => void
  selectedHashtags?: string[]
  maxDisplay?: number
}

export function TrendingHashtags({ 
  posts, 
  onHashtagClick, 
  selectedHashtags = [], 
  maxDisplay = 10 
}: TrendingHashtagsProps) {
  const [trendingHashtags, setTrendingHashtags] = useState<string[]>([])

  useEffect(() => {
    if (posts.length > 0) {
      updateTrendingHashtags()
    }
  }, [posts])

  const updateTrendingHashtags = () => {
    const allTags = posts.flatMap(post => post.tags)
    const tagCounts: { [key: string]: number } = {}
    
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
    
    const sortedTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxDisplay)
      .map(([tag]) => tag)
    
    setTrendingHashtags(sortedTags)
  }

  const handleHashtagClick = (hashtag: string) => {
    if (onHashtagClick) {
      onHashtagClick(hashtag)
    }
  }

  if (trendingHashtags.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Trending Hashtags
        </h3>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {trendingHashtags.map((tag, index) => (
            <Badge
              key={tag}
              variant={selectedHashtags.includes(tag) ? "default" : "outline"}
              className={`cursor-pointer hover:bg-primary/10 transition-colors ${
                index < 3 ? 'bg-orange-100 text-orange-800 border-orange-200' : ''
              }`}
              onClick={() => handleHashtagClick(tag)}
            >
              {index < 3 && <TrendingUp className="h-3 w-3 mr-1" />}
              #{tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
