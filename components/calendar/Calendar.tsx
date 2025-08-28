'use client';

import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { CalendarEvent } from '@/types/events';
import { CalendarView } from '@/types/calendar';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import CalendarToolbar from './CalendarToolbar';
import EventModal from './EventModal';
import toast from 'react-hot-toast';

// Import styles
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarStyles.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Create the DnD Calendar
const DnDCalendar = withDragAndDrop(BigCalendar);

export default function Calendar() {
  const { events, addEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const [view, setView] = useState<CalendarView>('month');
  const [date, setDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Error boundary effect
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      setError(error.message);
    };

    window.addEventListener('error', handleError);
    
    // Set loading to false after a short delay
    const timer = setTimeout(() => setIsLoading(false), 100);
    
    return () => {
      window.removeEventListener('error', handleError);
      clearTimeout(timer);
    };
  }, []);

  // Convert events for react-big-calendar - MUST be before conditional return
  const calendarEvents = useMemo(() => {
    try {
      const converted = events.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
      return converted;
    } catch (error) {
      setError('Failed to convert events');
      return [];
    }
  }, [events]);

  // Handle event drag and drop
  const onEventDrop = useCallback(({ event, start, end }: any) => {
    try {
      const updatedEvent = {
        ...event,
        start: new Date(start),
        end: new Date(end),
      };

      updateEvent(event.id, updatedEvent);
      
      toast.success(`"${event.title}" moved successfully!`, {
        duration: 2000,
        position: 'top-right',
      });
    } catch (error) {
      toast.error('Failed to move event');
    }
  }, [updateEvent]);

  // Handle event resize
  const onEventResize = useCallback(({ event, start, end }: any) => {
    try {
      const updatedEvent = {
        ...event,
        start: new Date(start),
        end: new Date(end),
      };

      updateEvent(event.id, updatedEvent);
      
      toast.success(`"${event.title}" resized successfully!`, {
        duration: 2000,
        position: 'top-right',
      });
    } catch (error) {
      toast.error('Failed to resize event');
    }
  }, [updateEvent]);

  // Handle external drag and drop
  const onDropFromOutside = useCallback(({ start, end, allDay }: any) => {
    try {
      const draggedEvent = JSON.parse(
        localStorage.getItem('draggedEvent') || '{}'
      );
      
      if (draggedEvent.title) {
        const newEvent = {
          ...draggedEvent,
          start: new Date(start),
          end: allDay ? new Date(end) : new Date(new Date(start).getTime() + draggedEvent.duration * 60 * 1000),
        };
        
        addEvent(newEvent);
        localStorage.removeItem('draggedEvent');
        
        toast.success(`"${newEvent.title}" added to calendar!`, {
          duration: 2000,
          position: 'top-right',
        });
      }
    } catch (error) {
      toast.error('Failed to add external event');
    }
  }, [addEvent]);

  // Handle external drag item
  const dragFromOutsideItem = useCallback(() => {
    const draggedEvent = JSON.parse(
      localStorage.getItem('draggedEvent') || '{}'
    );
    return draggedEvent.title ? draggedEvent : null;
  }, []);

  const handleSelectSlot = useCallback((slotInfo: any) => {
    try {
      // Ensure we have valid slot info
      if (!slotInfo || !slotInfo.start || !slotInfo.end) {
        return;
      }
      
      // Check if this is a valid selection action
      if (slotInfo.action !== 'select') {
        return;
      }
      
      // Disable event creation on mobile devices
      if (window.innerWidth < 768) {
        toast('Event creation is disabled on mobile. Use desktop to create new events.', {
          duration: 3000,
          position: 'top-center',
          icon: '📱',
        });
        return;
      }
      
      // Create new Date objects to avoid mutation
      const start = new Date(slotInfo.start);
      const end = new Date(slotInfo.end);
      
      // Calculate time difference in minutes
      const timeDiff = Math.abs(end.getTime() - start.getTime()) / (1000 * 60);
      
      // Determine if this is a single click or drag selection
      // Single clicks typically have very small time differences (less than 2 minutes)
      // or the same time, while drags have larger differences
      const isSingleClick = timeDiff < 2 || start.getTime() === end.getTime();
      
      let finalStart, finalEnd;
      
      if (isSingleClick) {
        // Single click - use the clicked time and extend by 30 minutes
        finalStart = new Date(start);
        finalEnd = new Date(start);
        finalEnd.setMinutes(finalEnd.getMinutes() + 30); // 30 minutes instead of 1 hour
      } else {
        // Drag selection - preserve the exact times
        finalStart = new Date(start);
        finalEnd = new Date(end);
      }
      
      // Create the final slot data
      const slotData = { start: finalStart, end: finalEnd };
      
      // Reset any existing selections and open modal
      setSelectedEvent(null);
      setSelectedSlot(slotData);
      setShowEventModal(true);
      
    } catch (error) {
      setError('Failed to handle slot selection');
    }
  }, []);

  const handleSelectEvent = useCallback((event: any) => {
    try {
      // Ensure we have a valid event
      if (!event || !event.id) {
        return;
      }
      
      // Find the original event from our events array
      const originalEvent = events.find(e => e.id === event.id);
      
      if (originalEvent) {
        setSelectedEvent(originalEvent);
        setSelectedSlot(null);
        setShowEventModal(true);
      } else {
        setError(`Event not found: ${event.title}`);
      }
    } catch (error) {
      setError('Failed to handle event selection');
    }
  }, [events]);

  const handleCloseModal = useCallback(() => {
    // Reset all modal states immediately
    setShowEventModal(false);
    setSelectedEvent(null);
    setSelectedSlot(null);
  }, []);

  const handleSaveEvent = useCallback((eventData: Omit<CalendarEvent, 'id'>) => {
    try {
      if (selectedEvent) {
        updateEvent(selectedEvent.id, eventData);
      } else {
        addEvent(eventData);
      }
      
      // Close modal after successful save
      handleCloseModal();
      
    } catch (error) {
      setError('Failed to save event');
    }
  }, [selectedEvent, addEvent, updateEvent, handleCloseModal]);

  const handleDeleteEvent = useCallback(() => {
    if (selectedEvent) {
      deleteEvent(selectedEvent.id);
      
      // Close modal after successful delete
      handleCloseModal();
    }
  }, [selectedEvent, deleteEvent, handleCloseModal]);

  // Handle Add Event button click
  const handleAddEvent = useCallback(() => {
    // Set current date/time for new event
    const now = new Date();
    const endTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes later
    
    // Reset any existing selections
    setSelectedEvent(null);
    setSelectedSlot({ start: now, end: endTime });
    setShowEventModal(true);
  }, []);

  const eventStyleGetter = useCallback((event: any) => {
    const backgroundColor = event.color || getEventColor(event.type);
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: event.completed ? 0.6 : 1,
        color: 'white',
        border: '0px',
        display: 'block',
        cursor: 'move', // Show move cursor for draggable events
      },
    };
  }, []);

  // NOW we can have conditional returns after all hooks are called
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg">
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError(null)}
            className="float-right font-bold text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      <CalendarToolbar
        view={view}
        onViewChange={setView}
        date={date}
        onNavigate={setDate}
        onAddEvent={handleAddEvent}
      />
      
      <div className="flex-1 p-4">
        {error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold mb-2">Calendar Error</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <DnDCalendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor={(event: any) => new Date(event.start)}
            endAccessor={(event: any) => new Date(event.end)}
            style={{ 
              height: '100%',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
              cursor: 'default',
              userSelect: 'none',
              position: 'relative',
              zIndex: 1
            }}
            view={view as any}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onEventDrop={onEventDrop}
            onEventResize={onEventResize}
            selectable
            resizable
            popup
            eventPropGetter={eventStyleGetter}
            dragFromOutsideItem={dragFromOutsideItem}
            onDropFromOutside={onDropFromOutside}
            components={{
              toolbar: () => null, // We use custom toolbar
            }}
            step={30}
            timeslots={2}
            defaultView="month"
            messages={{
              today: 'Today',
              previous: 'Previous',
              next: 'Next',
              month: 'Month',
              week: 'Week',
              day: 'Day',
              agenda: 'Agenda',
              date: 'Date',
              time: 'Time',
              event: 'Event',
              noEventsInRange: 'No events in this range',
              showMore: (total: number) => `+${total} more`,
            }}
            longPressThreshold={200}
            onDoubleClickEvent={handleSelectEvent}
            onKeyPressEvent={handleSelectEvent}
          />
        )}
      </div>

      {showEventModal && (
        <EventModal
          key={`modal-${selectedEvent?.id || selectedSlot?.start?.getTime() || 'new'}`}
          event={selectedEvent}
          slot={selectedSlot}
          onSave={handleSaveEvent}
          onDelete={selectedEvent ? handleDeleteEvent : undefined}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

function getEventColor(type: CalendarEvent['type']): string {
  const colors = {
    study: '#3b82f6',      // Blue
    assignment: '#f59e0b',  // Amber
    exam: '#ef4444',       // Red
    break: '#10b981',      // Emerald
    personal: '#8b5cf6',   // Violet
  };
  return colors[type] || '#6b7280';
}