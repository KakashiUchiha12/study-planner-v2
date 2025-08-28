'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CalendarEvent } from '@/types/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Save, X } from 'lucide-react';

const eventSchema = yup.object({
  title: yup.string().required('Title is required'),
  start: yup.date().required('Start date is required'),
  end: yup.date().required('End date is required'),
  type: yup.string().oneOf(['study', 'assignment', 'exam', 'break', 'personal']).required(),
  description: yup.string().optional(),
  location: yup.string().optional(),
  priority: yup.string().oneOf(['low', 'medium', 'high']).required(),
  notificationEnabled: yup.boolean().required(),
  notificationTime: yup.number().min(0).max(1440).required(),
});

type EventFormData = yup.InferType<typeof eventSchema>;

interface EventModalProps {
  event?: CalendarEvent | null;
  slot?: { start: Date; end: Date } | null;
  onSave: (eventData: Omit<CalendarEvent, 'id'>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function EventModal({ event, slot, onSave, onDelete, onClose }: EventModalProps) {
  const [isOpen, setIsOpen] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
    clearErrors,
  } = useForm<EventFormData>({
    resolver: yupResolver(eventSchema),
    defaultValues: {
      title: '',
      start: new Date(),
      end: new Date(Date.now() + 60 * 60 * 1000),
      type: 'study',
      description: '',
      location: '',
      priority: 'medium',
      notificationEnabled: true,
      notificationTime: 15,
    },
  });

  const notificationEnabled = watch('notificationEnabled');

  // Debug form values
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      console.log('🔄 Form value changed:', { name, type, value });
      if (name === 'start' || name === 'end') {
        console.log(`🔄 ${name} value:`, value);
        console.log(`🔄 ${name} type:`, typeof value);
        console.log(`🔄 ${name} instanceof Date:`, value instanceof Date);
        if (value instanceof Date) {
          console.log(`🔄 ${name} isValid:`, !isNaN(value.getTime()));
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Reset form when event or slot changes
  useEffect(() => {
    console.log('🔄 EventModal useEffect - event:', event, 'slot:', slot);
    console.log('🔄 Slot start type:', typeof slot?.start, 'value:', slot?.start);
    console.log('🔄 Slot end type:', typeof slot?.end, 'value:', slot?.end);
    
    if (event) {
      const eventData: EventFormData = {
        title: event.title,
        start: new Date(event.start),
        end: new Date(event.end),
        type: event.type,
        description: event.description || '',
        location: event.location || '',
        priority: event.priority,
        notificationEnabled: event.notificationEnabled,
        notificationTime: event.notificationTime,
      };
      console.log('🔄 Setting form data for existing event:', eventData);
      reset(eventData);
      clearErrors();
    } else if (slot) {
      // Ensure we have valid Date objects
      const slotStart = slot.start instanceof Date ? slot.start : new Date(slot.start);
      const slotEnd = slot.end instanceof Date ? slot.end : new Date(slot.end);
      
      console.log('🔄 Processed slot start:', slotStart, 'isValid:', !isNaN(slotStart.getTime()));
      console.log('🔄 Processed slot end:', slotEnd, 'isValid:', !isNaN(slotEnd.getTime()));
      
      // Create the slot data with the actual slot times
      const slotData: EventFormData = {
        title: '',
        start: slotStart,
        end: slotEnd,
        type: 'study',
        description: '',
        location: '',
        priority: 'medium',
        notificationEnabled: true,
        notificationTime: 15,
      };
      
      console.log('🔄 Setting form data for new slot:', slotData);
      console.log('🔄 Slot start time formatted:', formatDateForInput(slotStart));
      console.log('🔄 Slot end time formatted:', formatDateForInput(slotEnd));
      
      // Reset the form with the slot data
      reset(slotData);
      clearErrors();
      
      // Verify the form was set correctly
      setTimeout(() => {
        console.log('🔄 Form values after reset - start:', watch('start'), 'end:', watch('end'));
        console.log('🔄 Form start formatted:', formatDateForInput(watch('start')));
        console.log('🔄 Form end formatted:', formatDateForInput(watch('end')));
        
        // Force update the form values if they're not set correctly
        if (!watch('start') || !watch('end')) {
          console.log('🔄 Form values not set correctly, forcing update');
          setValue('start', slotStart);
          setValue('end', slotEnd);
        }
      }, 100);
      
    } else {
      // Default values when no event or slot
      const defaultData: EventFormData = {
        title: '',
        start: new Date(),
        end: new Date(Date.now() + 60 * 60 * 1000),
        type: 'study',
        description: '',
        location: '',
        priority: 'medium',
        notificationEnabled: true,
        notificationTime: 15,
      };
      console.log('🔄 Setting default form data:', defaultData);
      reset(defaultData);
      clearErrors();
    }
  }, [event, slot, reset, clearErrors, watch, setValue]);

  const handleClose = () => {
    console.log('🚪 Closing EventModal');
    setIsOpen(false);
    setTimeout(() => {
      console.log('🚪 Calling onClose after timeout');
      onClose();
    }, 200);
  };

  // Handle dialog open/close changes
  const handleOpenChange = (open: boolean) => {
    console.log('🔄 Dialog open state changed to:', open);
    if (!open) {
      console.log('🔄 Dialog closing, calling handleClose');
      handleClose();
    }
  };

  // Monitor modal state changes
  useEffect(() => {
    console.log('🔄 EventModal state changed - isOpen:', isOpen);
    console.log('🔄 EventModal props - event:', event, 'slot:', slot);
    
    if (!isOpen) {
      console.log('🔄 Modal is closed, ensuring proper cleanup');
    }
  }, [isOpen, event, slot]);

  const onSubmit = (data: EventFormData) => {
    console.log('💾 Submitting event data:', data);
    
    try {
      // Get the current form values for start and end
      const currentStart = watch('start');
      const currentEnd = watch('end');
      
      console.log('💾 Current form start:', currentStart);
      console.log('💾 Current form end:', currentEnd);
      
      // Ensure dates are properly converted
      const eventData = {
        ...data,
        start: currentStart instanceof Date ? currentStart : new Date(currentStart),
        end: currentEnd instanceof Date ? currentEnd : new Date(currentEnd),
        completed: event?.completed || false,
        color: event?.color,
        recurring: event?.recurring,
      };
      
      console.log('💾 Processed event data:', eventData);
      onSave(eventData);
      
    } catch (error) {
      console.error('❌ Error processing event data:', error);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  // Helper function to format date for datetime-local input
  const formatDateForInput = (date: any) => {
    try {
      console.log('🔧 formatDateForInput called with:', date);
      console.log('🔧 Date type:', typeof date);
      console.log('🔧 Date instanceof Date:', date instanceof Date);
      
      // Ensure we have a valid date
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.warn('⚠️ Invalid date provided to formatDateForInput:', date);
        // Return current date as fallback
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const result = `${year}-${month}-${day}T${hours}:${minutes}`;
        console.log('🔧 Returning fallback date:', result);
        return result;
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const result = `${year}-${month}-${day}T${hours}:${minutes}`;
      console.log('🔧 Formatted date result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error formatting date:', error, 'date:', date);
      // Return current date as fallback
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const result = `${year}-${month}-${day}T${hours}:${minutes}`;
      console.log('🔧 Returning fallback date after error:', result);
      return result;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{event ? 'Edit Event' : 'Create New Event'}</span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" key={`form-${slot?.start?.getTime() || event?.id || 'new'}`}>
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter event title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start Date & Time *</Label>
              <Input
                id="start"
                type="datetime-local"
                key={`start-${slot?.start?.getTime() || 'default'}`}
                value={formatDateForInput(watch('start') || slot?.start || new Date())}
                className={errors.start ? 'border-red-500' : ''}
                onChange={(e) => {
                  try {
                    const date = new Date(e.target.value);
                    console.log('🔄 Setting start date:', date);
                    console.log('🔄 Input value was:', e.target.value);
                    setValue('start', date);
                  } catch (error) {
                    console.error('❌ Error setting start date:', error);
                  }
                }}
                onBlur={() => {
                  // Ensure the form value is properly set
                  const currentValue = watch('start');
                  console.log('🔄 Start date onBlur - current value:', currentValue);
                }}
              />
              {errors.start && (
                <p className="text-sm text-red-500">{errors.start.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End Date & Time *</Label>
              <Input
                id="end"
                type="datetime-local"
                key={`end-${slot?.end?.getTime() || 'default'}`}
                value={formatDateForInput(watch('end') || slot?.end || new Date(Date.now() + 60 * 60 * 1000))}
                className={errors.end ? 'border-red-500' : ''}
                onChange={(e) => {
                  try {
                    const date = new Date(e.target.value);
                    console.log('🔄 Setting end date:', date);
                    console.log('🔄 Input value was:', e.target.value);
                    setValue('end', date);
                  } catch (error) {
                    console.error('❌ Error setting end date:', error);
                  }
                }}
                onBlur={() => {
                  // Ensure the form value is properly set
                  const currentValue = watch('end');
                  console.log('🔄 End date onBlur - current value:', currentValue);
                }}
              />
              {errors.end && (
                <p className="text-sm text-red-500">{errors.end.message}</p>
              )}
            </div>
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Event Type *</Label>
              <Select
                value={watch('type')}
                onValueChange={(value) => setValue('type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="study">Study Session</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="break">Break</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={watch('priority')}
                onValueChange={(value) => setValue('priority', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description and Location */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter event description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="Enter location (optional)"
            />
          </div>

          {/* Notifications */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notificationEnabled">Enable Notifications</Label>
              <Switch
                id="notificationEnabled"
                checked={notificationEnabled}
                onCheckedChange={(checked) => setValue('notificationEnabled', checked)}
              />
            </div>
            
            {notificationEnabled && (
              <div className="space-y-2">
                <Label htmlFor="notificationTime">Notify me before (minutes)</Label>
                <Select
                  value={watch('notificationTime').toString()}
                  onValueChange={(value) => setValue('notificationTime', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="1440">1 day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              {event && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{event ? 'Update' : 'Create'}</span>
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
