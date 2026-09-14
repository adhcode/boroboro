'use client';

import { Search, SlidersHorizontal } from 'lucide-react';

import { Input } from '@/components/ui/Input';

export function SearchBar() {
  return (
    <div className="px-4 py-3 bg-white">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search tents, drills, cameras..."
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>
        <button className="p-2.5 border-2 border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors">
          <SlidersHorizontal className="w-5 h-5 text-neutral-700" />
        </button>
      </div>
    </div>
  );
}
