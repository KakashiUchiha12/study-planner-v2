"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Share2, Users, Lock, Building2, Globe } from "lucide-react"
import { Post } from "@/types/posts"
import { PostSharingSystem } from "@/app/(lib)/post-sharing"

interface PostShareDialogProps {
  post: Post | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onShareSuccess?: () => void
}

export function PostShareDialog({ 
  post, 
  open, 
  onOpenChange, 
  onShareSuccess 
}: PostShareDialogProps) {
  const [shareMessage, setShareMessage] = useState("")
  const [shareType, setShareType] = useState<'public' | 'private' | 'group'>('public')
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async () => {
    if (!post) return
    
    setIsSharing(true)
    
    try {
      // In a real app, you'd get the current user from context/session
      const currentUser = {
        id: "current-user",
        name: "Current User",
        email: "user@example.com",
        avatar: "/avatars/default.jpg",
        university: "Tech University",
        program: "Computer Science",
        year: 2,
        verified: false
      }
      
      const sharedPost = await PostSharingSystem.sharePost(
        post,
        currentUser,
        shareMessage,
        shareType
      )
      
      console.log("Post shared successfully:", sharedPost)
      
      // Reset form
      setShareMessage("")
      setShareType('public')
      
      // Close dialog
      onOpenChange(false)
      
      // Call success callback
      if (onShareSuccess) {
        onShareSuccess()
      }
      
    } catch (error) {
      console.error("Error sharing post:", error)
      alert("Failed to share post. Please try again.")
    } finally {
      setIsSharing(false)
    }
  }

  const getShareSuggestions = () => {
    if (!post) return []
    
    const suggestions: string[] = []
    
    // Add relevant hashtags
    if (post.tags.length > 0) {
      suggestions.push(`Check out this post about ${post.tags[0]}!`)
    }
    
    // Add category-based suggestions
    switch (post.category) {
      case 'study':
        suggestions.push('Great study resource!')
        suggestions.push('This helped me with my studies')
        break
      case 'achievement':
        suggestions.push('Amazing achievement!')
        suggestions.push('Inspiring work!')
        break
      case 'question':
        suggestions.push('Interesting question!')
        suggestions.push('Thoughts on this?')
        break
      case 'resource':
        suggestions.push('Useful resource!')
        suggestions.push('Worth checking out!')
        break
    }
    
    // Add generic suggestions
    suggestions.push('Thought this was interesting')
    suggestions.push('Worth sharing!')
    
    return suggestions.slice(0, 3)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setShareMessage(suggestion)
  }

  if (!post) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Post
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Original Post Preview */}
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">{post.author.name[0]}</span>
              </div>
              <div>
                <p className="text-sm font-medium">{post.author.name}</p>
                <p className="text-xs text-muted-foreground">{post.author.program}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {post.content}
            </p>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {post.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {/* Share Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add a message</label>
            <Textarea
              placeholder="What do you think about this post?"
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              rows={3}
            />
            
            {/* Quick Suggestions */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {getShareSuggestions().map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1 px-2"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Share Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share with</label>
            <Select value={shareType} onValueChange={(value) => setShareType(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Public
                </SelectItem>
                <SelectItem value="private" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Private
                </SelectItem>
                <SelectItem value="group" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Group
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSharing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              {isSharing ? 'Sharing...' : 'Share'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
