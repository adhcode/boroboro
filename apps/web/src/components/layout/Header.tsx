'use client';

import { MapPin, ChevronDown, Bell } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="px-4 py-3">
        {/* Time & Status Bar Spacer */}
        <div className="h-6 mb-2" />
        
        {/* Location & Notification */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 mb-1">Renting in</p>
            <button className="flex items-center gap-1 text-neutral-900 font-medium hover:text-primary-600 transition-colors">
              <MapPin className="w-4 h-4 text-primary-600" />
              <span>Ikeja, Lagos</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          
          <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors relative">
            <Bell className="w-5 h-5 text-neutral-700" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-600 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}
