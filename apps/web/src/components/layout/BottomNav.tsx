'use client';

import { useState } from 'react';

import { Home, Search, PlusCircle, MessageSquare, User } from 'lucide-react';

import { cn } from '@/lib/utils';

const navItems = [
  { id: 'browse', label: 'Browse', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'rent-out', label: 'Rent Out', icon: PlusCircle },
  { id: 'chats', label: 'Chats', icon: MessageSquare },
  { id: 'profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const [activeTab, setActiveTab] = useState('browse');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 safe-area-bottom">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[60px]',
                isActive ? 'text-primary-600' : 'text-neutral-400 hover:text-neutral-600'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5',
                  isActive && 'fill-primary-600'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Home Indicator - iOS style */}
      <div className="h-1 bg-neutral-900 rounded-full mx-auto w-32 mt-1" />
    </nav>
  );
}
