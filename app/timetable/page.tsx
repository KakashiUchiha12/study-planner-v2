'use client';

import { Toaster } from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Calendar from '@/components/calendar/Calendar';
import EventTemplates from '@/components/calendar/EventTemplates';

export default function TimeTablePage() {
  const router = useRouter();

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Back to Dashboard Button */}
        <div className="mb-4">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm border border-gray-200 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Study TimeTable</h1>
          <p className="text-gray-600 mt-2">Manage your study schedule, assignments, and events</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
          {/* Event Templates Sidebar - Hidden on mobile */}
          <EventTemplates />
          
          {/* Main Calendar - Full width on mobile */}
          <div className="flex-1 min-h-0">
            <Calendar />
          </div>
        </div>
      </div>
      
      <Toaster position="top-right" />
    </div>
  );
}
