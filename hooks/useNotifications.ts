import { useCallback, useEffect } from 'react';
import { CalendarEvent } from '@/types/events';
import toast from 'react-hot-toast';

export function useNotifications() {
  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const scheduleNotification = useCallback((event: CalendarEvent) => {
    if (!event.notificationEnabled || typeof window === 'undefined') return;

    const eventTime = new Date(event.start).getTime();
    const notificationTime = eventTime - (event.notificationTime * 60 * 1000);
    const now = Date.now();

    if (notificationTime > now) {
      const timeoutId = setTimeout(() => {
        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification(`Upcoming: ${event.title}`, {
            body: `Starting in ${event.notificationTime} minutes`,
            icon: '/favicon.ico',
            tag: event.id,
          });
        }

        // Toast notification
        toast(`📅 ${event.title} starts in ${event.notificationTime} minutes`, {
          duration: 5000,
          position: 'top-right',
        });
      }, notificationTime - now);

      // Store timeout ID for cancellation
      localStorage.setItem(`notification-${event.id}`, timeoutId.toString());
    }
  }, []);

  const cancelNotification = useCallback((eventId: string) => {
    const timeoutId = localStorage.getItem(`notification-${eventId}`);
    if (timeoutId) {
      clearTimeout(parseInt(timeoutId));
      localStorage.removeItem(`notification-${eventId}`);
    }
  }, []);

  return { scheduleNotification, cancelNotification };
}
