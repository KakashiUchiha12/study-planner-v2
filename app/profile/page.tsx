"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from '@/hooks/use-session-simple'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Target, FolderOpen, X, CheckCircle, Plus, User } from "lucide-react"
import { useRouter } from 'next/navigation'
import { MessageDialog } from "@/components/ui/message-dialog"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

// Import our new database hooks
import { useProfile } from '@/hooks/useProfile'
import { useGoals } from '@/hooks/useGoals'
import { useDocuments } from '@/hooks/useDocuments'
import { Goal } from '@prisma/client'
import { ActivityCreators } from '@/lib/utils/activity-helper'

// Import our new components
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileSummary } from "@/components/profile/profile-summary"
import { OverviewTab } from "@/components/profile/overview-tab"
import { GoalsTab } from "@/components/profile/goals-tab"
import { DocumentsTab } from "@/components/profile/documents-tab"

// Import interface types from components  
import type { GoalCard, GoalTask } from '@/components/profile/goals-tab'
import type { DocumentCard } from '@/components/profile/documents-tab'
import type { ProfileData } from '@/components/profile/profile-summary'

export default function ProfilePage() {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional logic
  const { data: session, status } = useSession()
  const router = useRouter()
  
  
  // Database hooks - temporarily simplified to prevent infinite loops
  const { 
    profile, 
    loading,
    updateProfile, 
    refreshProfile 
  } = useProfile()

  // Re-enable documents hook for proper functionality
  const { 
    documents, 
    uploadDocument, 
    updateDocument, 
    deleteDocument, 
    toggleDocumentPin, 
    reorderDocuments 
  } = useDocuments()

  // Re-enable goals and skills hooks for full functionality
  const { 
    goals, 
    createGoal, 
    updateGoal, 
    deleteGoal, 
    addGoalTask, 
    updateGoalTask, 
    deleteGoalTask, 
    toggleGoalTask, 
    reorderGoals 
  } = useGoals()

  // Temporarily disable other hooks to prevent infinite loops
  // const goalsLoading = false
  // const skillsLoading = false
  // const goals: any[] = []
  // const skills: any[] = []
  // const goalsError = null
  // const skillsError = null

  // Local UI state hooks - start with empty values, will be updated when profile loads
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: 'Student Name',
    email: 'user@example.com',
    university: '',
    program: '',
    currentYear: '',
    gpa: '',
    bio: 'Passionate computer science student focused on web development and data science. Always eager to learn new technologies and solve complex problems.',
    profilePicture: undefined,
    banner: undefined
  })

  const [activeTab, setActiveTab] = useState('overview')
  // State for modals and forms
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [showEditGoal, setShowEditGoal] = useState(false)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [showEditTaskModal, setShowEditTaskModal] = useState(false)
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({})
  const [newTask, setNewTask] = useState<Partial<GoalTask>>({})
  const [editingProfileData, setEditingProfileData] = useState<ProfileData>(profileData)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<GoalTask | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Dialog states
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

  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  // Show success message
  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 3000)
  }

  // Dialog helper functions
  const showMessage = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setMessageDialog({
      open: true,
      type,
      title,
      message
    })
  }

  const showConfirmation = (title: string, message: string, onConfirm: () => void, variant: 'default' | 'destructive' = 'default') => {
    setConfirmationDialog({
      open: true,
      title,
      message,
      onConfirm,
      variant
    })
  }

  // Update profileData when profile changes
  useEffect(() => {
    if (profile) {
      const newProfileData = {
        fullName: profile.fullName || 'Student Name',
        email: profile.email || 'user@example.com',
        university: profile.university || '',
        program: profile.program || '',
        currentYear: profile.currentYear || '',
        gpa: profile.gpa || '',
        bio: profile.bio || 'Passionate computer science student focused on web development and data science. Always eager to learn new technologies and solve complex problems.',
        profilePicture: profile.profilePicture || undefined
      }
      
      setProfileData(newProfileData)
      setEditingProfileData(newProfileData)
    }
  }, [profile])

  // Handle profile picture upload
  const handleProfilePictureUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/profile/picture', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload failed:', response.status, errorText)
        throw new Error(`Failed to upload profile picture: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Update local state
      setProfileData((prev: ProfileData) => ({
        ...prev,
        profilePicture: result.profilePicture
      }))
      
      // Refresh profile data
      await refreshProfile()
      
      // Show success feedback
      // Note: Success feedback is now handled by the ProfileSummary component
      
    } catch (error) {
      console.error('Failed to upload profile picture:', error)
      // Note: Error feedback is now handled by the ProfileSummary component
      throw error
    }
  }

  // Handle banner upload - now handled directly in ProfileSummary component
  const handleBannerUpload = async (file: File) => {
    // This is now handled directly in the ProfileSummary component
    // We just need to refresh the profile data after upload
    await refreshProfile()
  }

  // Handle profile update
  const handleUpdateProfile = async (profileData: any) => {
    try {
      console.log('Updating profile with data:', profileData);
      await updateProfile(profileData)
      setEditingProfile(false)
      
      // Refresh profile data to get the updated information
      await refreshProfile()
      
      // Create activity for profile update
      await ActivityCreators.profileUpdated('Profile information updated')
      
      // Show success feedback
      // Note: Success feedback is now handled by the ProfileSummary component
    } catch (error) {
      console.error('Failed to update profile:', error)
      // Note: Error feedback is now handled by the ProfileSummary component
    }
  }

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    window.location.href = '/dashboard'
  }

  // Handle view all activity
  const handleViewAllActivity = () => {
    router.push('/activities')
  }

  // Goal handlers
  const handleAddGoal = () => {
    setShowAddGoal(true)
  }

  const handleCreateGoal = async () => {
    if (!newGoal.title || !newGoal.description) return
    
    try {
      const createdGoal = await createGoal({
        title: newGoal.title,
        description: newGoal.description,
        targetDate: newGoal.targetDate || new Date(),
        category: 'academic',
        status: 'active'
      })
      
      setNewGoal({})
      setShowAddGoal(false)
      
      // Show success feedback
      showSuccess('Goal created successfully!')
    } catch (error) {
      console.error('Failed to create goal:', error)
      showMessage('error', 'Error', 'Failed to create goal. Please try again.')
    }
  }

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setShowEditGoal(true)
  }

  const handleUpdateGoal = async () => {
    if (!editingGoal) return
    
    try {
      await updateGoal(editingGoal.id, {
        title: editingGoal.title,
        description: editingGoal.description,
        category: editingGoal.category as 'academic' | 'personal' | 'career',
        status: editingGoal.status as 'active' | 'completed' | 'paused',
        targetDate: editingGoal.targetDate || new Date()
      })
      
      setEditingGoal(null)
      setShowEditGoal(false)
      
      // Show success feedback
      showSuccess('Goal updated successfully!')
    } catch (error) {
      console.error('Failed to update goal:', error)
      showMessage('error', 'Error', 'Failed to update goal. Please try again.')
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    showConfirmation(
      'Delete Goal',
      'Are you sure you want to delete this goal? This action cannot be undone.',
      async () => {
        try {
          await deleteGoal(goalId)
          showMessage('success', 'Success', 'Goal deleted successfully!')
        } catch (error) {
          console.error('Failed to delete goal:', error)
          showMessage('error', 'Error', 'Failed to delete goal. Please try again.')
        }
      },
      'destructive'
    )
  }



  const handleAddTask = (goalId: string) => {
    setSelectedGoalId(goalId)
    setShowAddTaskModal(true)
  }

  const handleEditTask = (task: GoalTask) => {
    setEditingTask(task)
    setShowEditTaskModal(true)
  }

  const handleToggleTask = async (taskId: string) => {
    try {
      await toggleGoalTask(taskId)
      showMessage('success', 'Success', 'Task status updated successfully!')
    } catch (error) {
      console.error('Failed to toggle task:', error)
      showMessage('error', 'Error', 'Failed to update task status. Please try again.')
    }
  }

  const handleCreateTask = async () => {
    if (!selectedGoalId || !newTask.title) return
    
    try {
              const createdTask = await addGoalTask(selectedGoalId, {
          title: newTask.title,
          priority: newTask.priority || 'medium',
          dueDate: newTask.dueDate || null,
          order: 0,
          completed: false
        })
      setNewTask({})
      setShowAddTaskModal(false)
      setSelectedGoalId(null)
      
      // Show success feedback
      showMessage('success', 'Success', 'Task created successfully!')
    } catch (error) {
      console.error('Failed to create task:', error)
      showMessage('error', 'Error', 'Failed to create task. Please try again.')
    }
  }

  const handleUpdateTask = async () => {
    if (!editingTask || !editingGoal) return
    
    try {
      await updateGoalTask(editingGoal.id, editingTask.id, {
        title: editingTask.title,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate || null
      })
      setEditingTask(null)
      setShowEditTaskModal(false)
      
      // Show success feedback
      showMessage('success', 'Success', 'Task updated successfully!')
    } catch (error) {
      console.error('Failed to update task:', error)
      showMessage('error', 'Error', 'Failed to update task. Please try again.')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!editingGoal) return
    
    showConfirmation(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      async () => {
        try {
          await deleteGoalTask(editingGoal.id, taskId)
          showMessage('success', 'Success', 'Task deleted successfully!')
        } catch (error) {
          console.error('Failed to delete task:', error)
          showMessage('error', 'Error', 'Failed to delete task. Please try again.')
        }
      },
      'destructive'
    )
  }

  const handleReorderGoals = async (goalIds: string[]) => {
    try {
      await reorderGoals(goalIds)
      showMessage('success', 'Success', 'Goals reordered successfully!')
    } catch (error) {
      console.error('Failed to reorder goals:', error)
      showMessage('error', 'Error', 'Failed to reorder goals. Please try again.')
    }
  }

  // Document handlers
  const handleUploadDocument = async (file: File) => {
    try {
      const newDocument = await uploadDocument(file)
      // Transform the database document to DocumentCard format
      showMessage('success', 'Success', 'Document uploaded successfully!')
      return transformDocuments([newDocument])[0]
    } catch (error) {
      console.error('Failed to upload document:', error)
      showMessage('error', 'Error', 'Failed to upload document. Please try again.')
      throw error
    }
  }

  const handleUpdateDocument = async (docId: string, data: any) => {
    try {
      await updateDocument(docId, data)
      // No need to return anything - the child component will handle state updates
      showMessage('success', 'Success', 'Document updated successfully!')
    } catch (error) {
      console.error('Failed to update document:', error)
      showMessage('error', 'Error', 'Failed to update document. Please try again.')
      throw error
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    showConfirmation(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      async () => {
        try {
          await deleteDocument(docId)
          showMessage('success', 'Success', 'Document deleted successfully!')
        } catch (error) {
          console.error('Failed to delete document:', error)
          showMessage('error', 'Error', 'Failed to delete document. Please try again.')
        }
      },
      'destructive'
    )
  }

  const handleToggleDocumentPin = async (docId: string) => {
    try {
      const updatedDocument = await toggleDocumentPin(docId)
      // Transform the database document to DocumentCard format
      return transformDocuments([updatedDocument])[0]
    } catch (error) {
      console.error('Failed to toggle document pin:', error)
      throw error
    }
  }

  const handleReorderDocuments = async (docIds: string[]) => {
    try {
      await reorderDocuments(docIds)
      
      // No need to refresh documents - the hook already updates local state
      showMessage('success', 'Success', 'Documents reordered successfully!')
      
    } catch (error) {
      console.error('Failed to reorder documents:', error)
      showMessage('error', 'Error', 'Failed to reorder documents. Please try again.')
    }
  }

  // Data transformation functions to convert database types to component interface types
  const transformProfileData = (dbProfile: any): any => {
    if (!dbProfile) {
      return {
        name: 'User',
        email: 'user@example.com',
        university: '',
        program: '',
        currentYear: '',
        gpa: '',
        bio: '',
        profilePicture: undefined,
        banner: undefined
      }
    }
    
    return {
      fullName: dbProfile.fullName || 'Student Name',
      email: dbProfile.email || 'user@example.com',
      university: dbProfile.university || '',
      program: dbProfile.program || '',
      currentYear: dbProfile.currentYear || '',
      gpa: dbProfile.gpa || '',
      bio: dbProfile.bio || 'Passionate computer science student focused on web development and data science. Always eager to learn new technologies and solve complex problems.',
      profilePicture: dbProfile.profilePicture || undefined,
      banner: dbProfile.banner || undefined
    }
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

  const transformGoals = (dbGoals: any[]): GoalCard[] => {
    return dbGoals.map(goal => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      status: goal.status,
      targetDate: goal.targetDate,
      tasks: goal.tasks || [],
      userId: goal.userId,
      order: goal.order,
      visibility: goal.visibility || 'public',
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt
    }))
  }

  const transformDocuments = (dbDocuments: any[]): DocumentCard[] => {
    return dbDocuments.map(doc => ({
      id: doc.id,
      name: doc.name,
      originalName: doc.originalName,
      description: doc.description,
      type: doc.type,
      mimeType: doc.mimeType,
      size: doc.size,
      filePath: doc.filePath,
      thumbnailPath: doc.thumbnailPath,
      category: doc.category || 'general',
      tags: doc.tags,
      isPinned: doc.isPinned,
      order: doc.order,
      userId: doc.userId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      uploadedAt: doc.uploadedAt
    }))
  }

  // Transform the data
  const transformedProfileData = transformProfileData(profile)
  const transformedGoals = transformGoals(goals)
  const transformedDocuments = transformDocuments(documents)

  // Show loading state only while data is actually being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state if there's an error
  if (false) { // Temporarily disabled to prevent errors
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Something went wrong</h2>
              <p className="text-slate-600 mb-4">
                An error occurred while loading your profile
              </p>
              <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // NOW we can have conditional logic and early returns
  // Check authentication
  if (status === "loading") {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  }
  
  if (status === "unauthenticated") {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Authentication Required</h1>
        <p className="text-slate-600 mb-6">Please log in to access your profile.</p>
        <Button onClick={() => window.location.href = '/auth/login'}>
          Go to Login
        </Button>
      </div>
    </div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-right duration-300">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            {successMessage}
          </div>
        </div>
      )}
      
      <ProfileHeader onBackToDashboard={handleBackToDashboard} />
      
      <div className="container mx-auto max-w-7xl p-0 md:p-8">
        {/* Profile Banner */}
        <div className="relative w-full rounded-none md:rounded-lg overflow-hidden mb-0 md:mb-6" style={{ aspectRatio: '4/1' }}>
        {transformedProfileData.banner ? (
          <img
            src={getBannerUrl(transformedProfileData.banner)}
            alt={`${transformedProfileData.fullName}'s banner`}
            className="w-full h-full object-cover"
            style={{ aspectRatio: '4/1' }}
          />
        ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <h2 className="text-lg md:text-xl font-semibold">{transformedProfileData.fullName}</h2>
                <p className="text-sm md:text-base opacity-90">Welcome to my profile</p>
              </div>
            </div>
          )}
        </div>

        {/* Profile Summary */}
        <div className="mb-6 px-4 md:px-0">
          <ProfileSummary 
            profileData={transformedProfileData}
            activeGoalsCount={goals.filter(g => g.status === 'active').length}
            editingProfile={editingProfile}
            onEditProfile={() => setEditingProfile(true)}
            onCloseEditProfile={() => setEditingProfile(false)}
            onProfilePictureUpload={handleProfilePictureUpload}
            onBannerUpload={handleBannerUpload}
            onUpdateProfile={handleUpdateProfile}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200 p-1 sm:p-2 rounded-xl shadow-sm h-14 sm:h-16 gap-1">
            <TabsTrigger 
              value="overview" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium p-2 sm:p-4 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 data-[state=active]:shadow-sm transition-all duration-200 hover:bg-slate-50 h-full min-w-0"
            >
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">O</span>
            </TabsTrigger>
            <TabsTrigger 
              value="goals" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium p-2 sm:p-4 rounded-lg data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200 data-[state=active]:shadow-sm transition-all duration-200 hover:bg-slate-50 h-full min-w-0"
            >
              <Target className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Goals</span>
              <span className="sm:hidden">G</span>
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium p-2 sm:p-4 rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:border-orange-200 data-[state=active]:shadow-sm transition-all duration-200 hover:bg-slate-50 h-full min-w-0"
            >
              <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Documents</span>
              <span className="sm:hidden">D</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4 sm:mt-6">
            <OverviewTab 
              goals={transformedGoals}
              onViewAllActivity={handleViewAllActivity}
            />
          </TabsContent>

          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <GoalsTab
              goals={transformedGoals as GoalCard[]}
              onAddGoal={handleAddGoal}
              onEditGoal={handleEditGoal}
              onDeleteGoal={handleDeleteGoal}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onReorderGoals={handleReorderGoals}
            />
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <DocumentsTab
              documents={transformedDocuments as DocumentCard[]}
              onUploadDocument={handleUploadDocument}
              onUpdateDocument={handleUpdateDocument}
              onDeleteDocument={handleDeleteDocument}
              onTogglePin={handleToggleDocumentPin}
              onReorderDocuments={handleReorderDocuments}
            />
          )}
        </Tabs>
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800">Add New Task</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddTaskModal(false)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Task Title</label>
                <Input
                  value={newTask.title || ''}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
                <Input
                  type="date"
                  value={newTask.dueDate ? new Date(newTask.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value ? new Date(e.target.value) : undefined })}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                <select
                  value={newTask.priority || 'medium'}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setShowAddTaskModal(false)} className="border-slate-200 text-slate-700 hover:bg-slate-50 order-2 sm:order-1">
                Cancel
              </Button>
              <Button onClick={handleCreateTask} className="bg-blue-600 hover:bg-blue-700 order-1 sm:order-2">
                <Plus className="h-4 w-4 mr-2" /> Add Task
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditTaskModal && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800">Edit Task</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowEditTaskModal(false)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Task Title</label>
                <Input
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  placeholder="Enter task title"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
                <Input
                  type="date"
                  value={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value ? new Date(e.target.value) : undefined })}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                <select
                  value={editingTask.priority}
                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="task-completed"
                  checked={editingTask.completed}
                  onChange={(e) => setEditingTask({ ...editingTask, completed: e.target.checked })}
                  className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="task-completed" className="text-sm text-slate-700">Mark as completed</label>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setShowEditTaskModal(false)} className="border-slate-200 text-slate-700 hover:bg-slate-50 order-2 sm:order-1">
                Cancel
              </Button>
              <Button onClick={handleUpdateTask} className="bg-blue-600 hover:bg-blue-700 order-1 sm:order-2">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800">Add New Goal</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddGoal(false)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Goal Title</label>
                <Input
                  value={newGoal.title || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="Enter goal title"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <Textarea
                  value={newGoal.description || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  placeholder="Enter goal description"
                  className="w-full"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Target Date</label>
                <Input
                  type="date"
                  value={newGoal.targetDate ? new Date(newGoal.targetDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value ? new Date(e.target.value) : undefined })}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setShowAddGoal(false)} className="border-slate-200 text-slate-700 hover:bg-slate-50 order-2 sm:order-1">
                Cancel
              </Button>
              <Button onClick={handleCreateGoal} className="bg-green-600 hover:bg-green-700 order-1 sm:order-2">
                <Plus className="h-4 w-4 mr-2" /> Add Goal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {showEditGoal && editingGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800">Edit Goal</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowEditGoal(false)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Goal Title</label>
                <Input
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  placeholder="Enter goal title"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <Textarea
                  value={editingGoal.description}
                  onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                  placeholder="Enter goal description"
                  className="w-full"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Target Date</label>
                <Input
                  type="date"
                  value={editingGoal.targetDate ? new Date(editingGoal.targetDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingGoal({ ...editingGoal, targetDate: e.target.value ? new Date(e.target.value) : new Date() })}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={editingGoal.status}
                  onChange={(e) => setEditingGoal({ ...editingGoal, status: e.target.value as 'active' | 'completed' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setShowEditGoal(false)} className="border-slate-200 text-slate-700 hover:bg-slate-50 order-2 sm:order-1">
                Cancel
              </Button>
              <Button onClick={handleUpdateGoal} className="bg-blue-600 hover:bg-blue-700 order-1 sm:order-2">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Skill Modal */}
      {/* Removed as per edit hint */}

      {/* Add Objective Modal */}
      {/* Removed as per edit hint */}

      {/* Message Dialog */}
      <MessageDialog
        open={messageDialog.open}
        onClose={() => setMessageDialog(prev => ({ ...prev, open: false }))}
        type={messageDialog.type}
        title={messageDialog.title}
        message={messageDialog.message}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmationDialog.open}
        onClose={() => setConfirmationDialog(prev => ({ ...prev, open: false }))}
        onConfirm={confirmationDialog.onConfirm}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        variant={confirmationDialog.variant}
      />
    </div>
  )
}


