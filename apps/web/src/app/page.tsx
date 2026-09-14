import { BottomNav } from '@/components/layout/BottomNav';
import { CategoryTabs } from '@/components/layout/CategoryTabs';
import { Header } from '@/components/layout/Header';
import { SearchBar } from '@/components/layout/SearchBar';
import { ListingCard } from '@/components/listing/ListingCard';

// Mock data - will be replaced with API calls
const popularListings = [
  {
    id: '1',
    title: 'Party Canopy 10x10',
    pricePerDay: 8500,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&h=600&fit=crop',
    distance: 1200,
    isVerified: true,
  },
  {
    id: '2',
    title: '2.5kva Silent Generator',
    pricePerDay: 12000,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1591696331111-ef9586a5b17a?w=600&h=600&fit=crop',
    distance: 800,
    isVerified: true,
  },
  {
    id: '3',
    title: 'Canon EOS R5 + 24-70mm',
    pricePerDay: 25000,
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1606951687270-f2baf64f22bb?w=600&h=600&fit=crop',
    distance: 2500,
    isVerified: true,
  },
  {
    id: '4',
    title: 'Makita Circular Saw',
    pricePerDay: 4500,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&h=600&fit=crop',
    distance: 1700,
    isVerified: true,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <Header />
      <SearchBar />
      <CategoryTabs />
      
      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-neutral-900">Popular Nearby</h2>
          <button className="text-primary-600 font-medium text-sm hover:text-primary-700">
            See All
          </button>
        </div>
        
        {/* Listings - Single Column with more spacing */}
        <div className="space-y-5">
          {popularListings.map((listing) => (
            <ListingCard key={listing.id} {...listing} />
          ))}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
