'use client';

import { useState, useEffect } from 'react';

import { Tent, Wrench, Camera, Zap, Music, Bike, Home as HomeIcon, Hammer } from 'lucide-react';

import { cn } from '@/lib/utils';

// Icon mapping for categories
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Event Equipment': Tent,
  'Tools': Wrench,
  'Photography': Camera,
  'Electronics': Zap,
  'Musical Instruments': Music,
  'Vehicles': Bike,
  'Home & Garden': HomeIcon,
  'Construction': Hammer,
};

interface Category {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CategoryTabsProps {
  onCategoryChange?: (category: string) => void;
}

export function CategoryTabs({ onCategoryChange }: CategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([
    { id: 'all', label: 'All' },
  ]);

  // Fetch categories from API
  useEffect(() => {
    async function fetchCategories() {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/v1/listings/categories');
        // const data = await response.json();
        
        // Mock data for now - will be replaced with API
        const mockCategories = [
          'Event Equipment',
          'Tools',
          'Photography',
          'Electronics',
          'Musical Instruments',
          'Vehicles',
        ];

        const categoryList: Category[] = [
          { id: 'all', label: 'All' },
          ...mockCategories.map((cat) => ({
            id: cat.toLowerCase().replace(/\s+/g, '-'),
            label: cat,
            icon: categoryIcons[cat],
          })),
        ];

        setCategories(categoryList);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    }

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    if (onCategoryChange) {
      onCategoryChange(categoryId);
    }
  };

  return (
    <div className="px-4 py-3 bg-white border-b border-neutral-100">
      {/* Hide scrollbar but keep scrolling functionality */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
