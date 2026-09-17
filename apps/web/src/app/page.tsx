'use client';

import { useState } from 'react';

import { BottomNav } from '@/components/layout/BottomNav';
import { CategoryTabs } from '@/components/layout/CategoryTabs';
import { Header } from '@/components/layout/Header';
import { Hero } from '@/components/layout/Hero';
import { SearchBar } from '@/components/layout/SearchBar';
import { ListingCard } from '@/components/listing/ListingCard';

// Mock data - will be replaced with API calls
const allListings = [
  {
    id: '1',
    title: 'Party Canopy 10x10',
    category: 'event-equipment',
    pricePerDay: 8500,
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&h=600&fit=crop',
    distance: 1200,
    location: 'Ikeja, Lagos',
  },
  {
    id: '2',
    title: '2.5kva Silent Generator',
    category: 'electronics',
    pricePerDay: 12000,
    image: 'https://images.unsplash.com/photo-1591696331111-ef9586a5b17a?w=600&h=600&fit=crop',
    distance: 800,
    location: 'Lekki, Lagos',
  },
  {
    id: '3',
    title: 'Canon EOS R5 + 24-70mm',
    category: 'photography',
    pricePerDay: 25000,
    image: 'https://images.unsplash.com/photo-1606951687270-f2baf64f22bb?w=600&h=600&fit=crop',
    distance: 2500,
    location: 'Victoria Island, Lagos',
  },
  {
    id: '4',
    title: 'Makita Circular Saw',
    category: 'tools',
    pricePerDay: 4500,
    image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&h=600&fit=crop',
    distance: 1700,
    location: 'Ikeja, Lagos',
  },
  {
    id: '5',
    title: 'Professional DJ Controller',
    category: 'musical-instruments',
    pricePerDay: 15000,
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=600&fit=crop',
    distance: 950,
    location: 'Surulere, Lagos',
  },
  {
    id: '6',
    title: 'Electric Scooter',
    category: 'vehicles',
    pricePerDay: 3500,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&h=600&fit=crop',
    distance: 1350,
    location: 'Yaba, Lagos',
  },
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter listings based on selected category
  const filteredListings = selectedCategory === 'all' 
    ? allListings 
    : allListings.filter(listing => listing.category === selectedCategory);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // TODO: Fetch listings from API based on category
    // const response = await fetch(`/api/v1/search/listings?category=${category}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header - Hidden when hero is visible */}
      <div className="lg:hidden hidden">
        <Header />
        <SearchBar />
      </div>
      
      {/* Hero - Visible on all screens */}
      <Hero />
      
      {/* Categories */}
      <div className="bg-white border-b border-neutral-200 lg:border-t">
        <div className="lg:max-w-7xl lg:mx-auto px-4 lg:px-8 py-3 lg:py-4">
          <h3 className="hidden lg:block text-[13px] font-semibold text-neutral-500 uppercase tracking-wide mb-3">
            Featured Categories
          </h3>
          <CategoryTabs onCategoryChange={handleCategoryChange} />
        </div>
      </div>
      
      {/* Main Content - Responsive */}
      <main className="px-4 lg:px-8 pt-4 pb-28 lg:pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Section Header - Responsive */}
          <div className="flex items-center justify-between mb-3 lg:mb-6">
            <h2 className="text-[17px] lg:text-[28px] font-bold text-neutral-900">
              {selectedCategory === 'all' ? 'Popular Rentals Nearby' : 'Available Items'}
            </h2>
            <button className="text-primary-600 font-medium text-[13px] lg:text-[15px] hover:text-primary-700">
              See All
            </button>
          </div>
          
          {/* Listings - Responsive Grid */}
          {filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-6">
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} {...listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 lg:py-20">
              <p className="text-neutral-400 text-[13px] lg:text-[15px]">No items found in this category</p>
            </div>
          )}
        </div>
      </main>
      
      {/* Bottom Nav - Only on mobile */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
