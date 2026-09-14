'use client';

import { MapPin, ChevronDown, Bell } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-100">
      <div className="px-4 py-3">
        {/* Time & Status Bar Spacer */}
        <div className="h-5 mb-2" />
        
        {/* Location & Notification */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-neutral-400 mb-0.5">Renting in</p>
            <button className="flex items-center gap-1 text-neutral-900 font-semibold text-[15px] hover:text-primary-600 transition-colors">
              <MapPin className="w-4 h-4 text-primary-600" />
              <span>Ikeja, Lagos</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          </div>
          
          <button className="p-2 hover:bg-neutral-50 rounded-full transition-colors relative">
            <Bell className="w-5 h-5 text-neutral-600" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary-600 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}
