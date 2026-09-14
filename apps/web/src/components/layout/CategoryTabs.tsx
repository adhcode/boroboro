'use client';

import { useState } from 'react';

import { Tent, Wrench, Camera } from 'lucide-react';

import { cn } from '@/lib/utils';

const categories = [
  { id: 'event-equipment', label: 'Event Equipment', icon: Tent },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'photography', label: 'Photography', icon: Camera },
];

export function CategoryTabs() {
  const [activeCategory, setActiveCategory] = useState('event-equipment');

  return (
    <div className="px-4 py-3 bg-white border-b border-neutral-200 overflow-x-auto">
      <div className="flex gap-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-neutral-700 border-2 border-neutral-300 hover:bg-neutral-50'
              )}
            >
              <Icon className="w-4 h-4" />
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
