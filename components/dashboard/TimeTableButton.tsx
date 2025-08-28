'use client';

import { Calendar, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';

export default function TimeTableButton() {
  const router = useRouter();
  const { getUpcomingEvents } = useCalendarEvents();
  const upcomingEvents = getUpcomingEvents(1); // Next 24 hours

  const handleClick = () => {
    router.push('/timetable');
  };

  return (
    <button
      onClick={handleClick}
      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 mb-4"
    >
      <div className="flex items-center justify-center space-x-2">
        <Calendar className="w-5 h-5" />
        <span>View TimeTable</span>
        {upcomingEvents.length > 0 && (
          <div className="bg-white bg-opacity-20 rounded-full px-2 py-1 text-xs">
            {upcomingEvents.length}
          </div>
        )}
      </div>
      {upcomingEvents.length > 0 && (
        <div className="text-xs mt-1 opacity-90">
          Next: {upcomingEvents[0].title} at {new Date(upcomingEvents[0].start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </button>
  );
}
