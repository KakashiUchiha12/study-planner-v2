'use client';

import { DragEvent } from 'react';
import { BookOpen, FileText, AlertCircle, Coffee } from 'lucide-react';

const eventTemplates = [
  {
    id: 'study-session',
    title: 'Study Session',
    type: 'study',
    duration: 60, // 1 hour (2 x 30 min slots)
    icon: BookOpen,
    color: '#3b82f6',
  },
  {
    id: 'assignment',
    title: 'Assignment Work',
    type: 'assignment',
    duration: 90, // 1.5 hours (3 x 30 min slots)
    icon: FileText,
    color: '#f59e0b',
  },
  {
    id: 'exam',
    title: 'Exam',
    type: 'exam',
    duration: 120, // 2 hours (4 x 30 min slots)
    icon: AlertCircle,
    color: '#ef4444',
  },
  {
    id: 'break',
    title: 'Break Time',
    type: 'break',
    duration: 30, // 30 minutes (1 slot)
    icon: Coffee,
    color: '#10b981',
  },
];

export default function EventTemplates() {
  const handleDragStart = (e: DragEvent, template: typeof eventTemplates[0]) => {
    const eventData = {
      title: template.title,
      type: template.type,
      color: template.color,
      duration: template.duration,
      description: '',
      priority: 'medium',
      completed: false,
      notificationEnabled: true,
      notificationTime: 15,
    };
    
    localStorage.setItem('draggedEvent', JSON.stringify(eventData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="hidden lg:block w-64 bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Event Templates</h3>
      <div className="space-y-2">
        {eventTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <div
              key={template.id}
              draggable
              onDragStart={(e) => handleDragStart(e, template)}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
              style={{ borderLeft: `4px solid ${template.color}` }}
            >
              <Icon className="w-5 h-5" style={{ color: template.color }} />
              <div>
                <div className="font-medium text-sm">{template.title}</div>
                <div className="text-xs text-gray-500">
                  {template.duration} minutes
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-xs text-gray-500">
        💡 Drag templates to the calendar to create events
      </div>
    </div>
  );
}
