export type CalendarView = 'month' | 'week' | 'work_week' | 'day' | 'agenda';

export interface CalendarSettings {
  defaultView: CalendarView;
  startHour: number;
  endHour: number;
  timeFormat: '12' | '24';
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  showWeekends: boolean;
  theme: 'light' | 'dark' | 'windows';
}
