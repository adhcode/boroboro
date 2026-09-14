'use client';

import { useState } from 'react';

import { BottomNav } from '@/components/layout/BottomNav';
import { CategoryTabs } from '@/components/layout/CategoryTabs';
import { Header } from '@/components/layout/Header';
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
    <div className="min-h-screen bg-white pb-32">
      <Header />
      <SearchBar />
      <CategoryTabs onCategoryChange={handleCategoryChange} />
      
      {/* Main Content - Consistent spacing throughout */}
      <main className="px-4 pt-4 pb-6">
        {/* Section Header - Consistent vertical spacing */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-bold text-neutral-900">
            {selectedCategory === 'all' ? 'Popular Nearby' : 'Available'}
          </h2>
          <button className="text-primary-600 font-medium text-[13px] hover:text-primary-700">
            See All
          </button>
        </div>
        
        {/* Listings - Consistent spacing between cards */}
        {filteredListings.length > 0 ? (
          <div className="space-y-3">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-neutral-400 text-[13px]">No items found in this category</p>
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
}
