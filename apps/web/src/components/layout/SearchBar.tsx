'use client';

import { Search, SlidersHorizontal } from 'lucide-react';

import { Input } from '@/components/ui/Input';

export function SearchBar() {
  return (
    <div className="px-4 py-3 bg-white">
      <div className="flex gap-2.5">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search tents, drills, cameras..."
            leftIcon={<Search className="w-4.5 h-4.5" />}
            className="text-[14px] placeholder:text-neutral-400"
          />
        </div>
        <button className="p-2.5 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors flex-shrink-0">
          <SlidersHorizontal className="w-5 h-5 text-neutral-600" />
        </button>
      </div>
    </div>
  );
}
