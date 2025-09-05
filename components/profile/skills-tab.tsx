"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Award, Target, Edit3, Trash2, GripVertical } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface SkillObjective {
  id: string
  title: string
  description?: string
  targetDate?: Date
  completed: boolean
  skillId: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface SkillCard {
  id: string
  name: string
  description: string
  resources: string
  objectives: SkillObjective[]
  userId: string
  order: number
  createdAt: Date
  updatedAt: Date
}

interface SkillsTabProps {
  skills: SkillCard[]
  onAddSkill: () => void
  onEditSkill: (skill: SkillCard) => void
  onDeleteSkill: (skillId: string) => void
  onAddObjective: (skillId: string) => void
  onEditObjective: (objective: SkillObjective) => void
  onToggleObjective: (objectiveId: string) => void
  onDeleteObjective: (objectiveId: string) => void
  onReorderSkills: (skillIds: string[]) => Promise<void>
  onReorderObjectives: (skillId: string, objectiveIds: string[]) => void
}

// Sortable Skill Card Component
function SortableSkillCard({ 
  skill, 
  onEdit, 
  onDelete, 
  onAddObjective, 
  onEditObjective, 
  onToggleObjective, 
  onDeleteObjective 
}: {
  skill: SkillCard
  onEdit: () => void
  onDelete: () => void
  onAddObjective: () => void
  onEditObjective: (objective: SkillObjective) => void
  onToggleObjective: (objectiveId: string) => void
  onDeleteObjective: (objectiveId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: skill.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const calculateProgress = (): number => {
    if (skill.objectives.length === 0) return 0
    const completedObjectives = skill.objectives.filter(obj => obj.completed).length
    return Math.round((completedObjectives / skill.objectives.length) * 100)
  }

  const progress = calculateProgress()

  return (
    <div ref={setNodeRef} style={style} className="relative w-full">
      <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 w-full group">
        <div
          {...attributes}
          {...listeners}
          className="absolute top-3 left-3 cursor-grab active:cursor-grabbing z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="p-1.5 bg-slate-100 rounded hover:bg-slate-200">
            <GripVertical className="h-3 w-3 text-slate-500" />
          </div>
        </div>

        <div className="pt-8">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">{skill.name}</h3>
              <p className="text-slate-600 text-sm mb-3">{skill.description}</p>
              
              {/* Progress Bar */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Progress</span>
                  <span className="font-medium text-slate-800">{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Resources */}
              {skill.resources && (
                <div className="mb-3">
                  <span className="text-xs text-slate-500 mb-2 block">Resources:</span>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      try {
                        const resources = typeof skill.resources === 'string' 
                          ? JSON.parse(skill.resources) 
                          : skill.resources;
                        return Array.isArray(resources) 
                          ? resources.map((resource, index) => (
                              <span key={index} className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                                {resource}
                              </span>
                            ))
                          : <span className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                              {skill.resources}
                            </span>;
                      } catch (e) {
                        return <span className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                          {skill.resources}
                        </span>;
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 ml-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0 hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 hover:bg-red-100 text-slate-600 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Objectives */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                Objectives ({skill.objectives.filter(o => o.completed).length}/{skill.objectives.length})
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddObjective}
                className="h-7 text-xs px-2 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Objective
              </Button>
            </div>
            
            {skill.objectives.length > 0 ? (
              <div className="space-y-2">
                {skill.objectives.map((objective) => (
                  <div
                    key={objective.id}
                    className={`flex items-center justify-between p-2 rounded border transition-all duration-200 ${
                      objective.completed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="checkbox"
                        checked={objective.completed}
                        onChange={() => onToggleObjective(objective.id)}
                        className="rounded border-slate-300 text-green-600 focus:ring-green-500 focus:ring-2 transition-all"
                      />
                      <span className={`text-sm font-medium ${
                        objective.completed 
                          ? 'line-through text-slate-500' 
                          : 'text-slate-700'
                      }`}>
                        {objective.title}
                      </span>
                      {objective.targetDate && (
                        <span className="px-2 py-1 rounded text-xs border border-slate-300 text-slate-600">
                          Due: {new Date(objective.targetDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditObjective(objective)}
                        className="h-6 w-6 p-0 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-colors"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteObjective(objective.id)}
                        className="h-6 w-6 p-0 hover:bg-red-100 text-slate-600 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-50 rounded border border-dashed border-slate-300">
                <Target className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No objectives yet. Add your first objective!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkillsTab({
  skills,
  onAddSkill,
  onEditSkill,
  onDeleteSkill,
  onAddObjective,
  onEditObjective,
  onToggleObjective,
  onDeleteObjective,
  onReorderSkills,
  onReorderObjectives
}: SkillsTabProps) {
  // Drag and Drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  // Handle skills drag end
  const handleSkillsDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = skills.findIndex((item) => item.id === active.id)
      const newIndex = skills.findIndex((item) => item.id === over?.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        try {
          // Create new array with reordered skills
          const reorderedSkills = [...skills]
          const [movedSkill] = reorderedSkills.splice(oldIndex, 1)
          reorderedSkills.splice(newIndex, 0, movedSkill)
          
          // Update the UI by calling the reorderSkills method from the hook
          const skillIds = reorderedSkills.map(s => s.id)
          await onReorderSkills(skillIds)
        } catch (error) {
          console.error('Error reordering skills:', error)
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Skill Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Award className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-slate-800">Add New Skill</h2>
        </div>
        <Button 
          onClick={onAddSkill}
          className="bg-green-600 hover:bg-green-700 text-white h-10 px-6 text-sm font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Skill
        </Button>
      </div>

      {/* Skills List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Award className="h-5 w-5 text-green-600" />
          Your Skills ({skills.length})
        </h3>
        
        {skills.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSkillsDragEnd}
          >
            <SortableContext
              items={skills.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {skills.map((skill) => (
                  <SortableSkillCard
                    key={skill.id}
                    skill={skill}
                    onEdit={() => onEditSkill(skill)}
                    onDelete={() => onDeleteSkill(skill.id)}
                    onAddObjective={() => onAddObjective(skill.id)}
                    onEditObjective={onEditObjective}
                    onToggleObjective={onToggleObjective}
                    onDeleteObjective={onDeleteObjective}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <Award className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No skills yet</h3>
            <p className="text-slate-500 mb-4">Start by adding your first skill to track your development</p>
            <Button 
              onClick={onAddSkill}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Skill
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
