'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Share2, Heart, Star } from 'lucide-react';

import { BottomNav } from '@/components/layout/BottomNav';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';

// Mock data - will be replaced with API call
const mockListing = {
  id: '1',
  title: 'Party Canopy Tent (10x10 ft) with Side Walls',
  category: 'EVENT EQUIPMENT',
  pricePerDay: 8500,
  distance: 1200,
  location: 'Ikeja, Lagos',
  image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=600&fit=crop',
  description:
    "High-quality, water-resistant canopy tent. Perfect for small outdoor gatherings, birthdays, and vendor pop-ups. Sets up in under 15 minutes. Comes with optional side walls for wind protection and weight bags.",
  owner: {
    id: 'owner-1',
    name: 'Segun A.',
    avatar: 'https://i.pravatar.cc/150?u=owner1',
    isVerified: true,
    memberSince: '2023',
    rating: 4.9,
    reviewCount: 28,
  },
  availability: {
    month: 'October',
    year: '2026',
    availableDates: [12, 13, 14, 15, 16],
    bookedDates: [17, 18],
  },
};

export default function ListingDetailPage() {
  // const params = useParams();
  const router = useRouter();

  // TODO: Fetch listing data based on dynamic route
  // const listing = await fetch(`/api/v1/listings/${params.id}`);

  const listing = mockListing;

  return (
    <div className="min-h-screen bg-white pb-56">
      {/* Hero Image with overlay buttons */}
      <div className="relative h-[300px] w-full">
        <Image
          src={listing.image}
          alt={listing.title}
          fill
          className="object-cover"
          priority
        />
        
        {/* Overlay buttons */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-900" />
          </button>
          
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors">
              <Share2 className="w-5 h-5 text-neutral-900" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors">
              <Heart className="w-5 h-5 text-neutral-900" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {/* Category & Distance */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">
            {listing.category}
          </span>
          <span className="text-[13px] text-neutral-400">
            {(listing.distance / 1000).toFixed(1)} km away
          </span>
        </div>

        {/* Title */}
        <h1 className="text-[22px] font-bold text-neutral-900 leading-tight mb-3">
          {listing.title}
        </h1>

        {/* Price */}
        <div className="mb-5">
          <span className="text-primary-600 font-bold text-[24px]">
            {formatPrice(listing.pricePerDay)}
          </span>
          <span className="text-neutral-400 text-[14px]"> /day</span>
        </div>

        {/* Divider */}
        <div className="h-px bg-neutral-200 mb-5" />

        {/* Owner Info */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Image
                src={listing.owner.avatar}
                alt={listing.owner.name}
                width={48}
                height={48}
                className="rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-[15px] text-neutral-900">
                  {listing.owner.name}
                </span>
                {listing.owner.isVerified && (
                  <Badge variant="success" className="text-[9px] px-1.5 py-0.5">
                    VERIFIED
                  </Badge>
                )}
              </div>
              <p className="text-[12px] text-neutral-400">
                Host since {listing.owner.memberSince}
              </p>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-[15px] text-neutral-900">
              {listing.owner.rating}
            </span>
            <span className="text-[13px] text-neutral-400">
              ({listing.owner.reviewCount})
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-neutral-200 mb-5" />

        {/* About this item */}
        <div className="mb-6">
          <h2 className="text-[18px] font-bold text-neutral-900 mb-3">
            About this item
          </h2>
          <p className="text-[14px] text-neutral-600 leading-relaxed">
            {listing.description}
          </p>
        </div>

        {/* Availability Calendar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-neutral-900">
              Availability
            </h2>
            <span className="text-[13px] font-medium text-primary-600">
              {listing.availability.month} {listing.availability.year}
            </span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
              <div
                key={index}
                className="text-center text-[11px] font-medium text-neutral-400 pb-2"
              >
                {day}
              </div>
            ))}

            {/* Date cells */}
            {Array.from({ length: 7 }).map((_, index) => {
              const date = 12 + index;
              const isAvailable = listing.availability.availableDates.includes(date);
              const isBooked = listing.availability.bookedDates.includes(date);

              return (
                <div
                  key={index}
                  className={`
                    aspect-square flex items-center justify-center text-[14px] rounded-lg
                    ${isBooked ? 'bg-primary-100 text-primary-600 font-semibold' : ''}
                    ${isAvailable && !isBooked ? 'text-neutral-900' : ''}
                    ${!isAvailable && !isBooked ? 'text-neutral-300' : ''}
                  `}
                >
                  {date}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-neutral-200 p-4 space-y-2 safe-area-bottom">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={() => router.push(`/listings/${listing.id}/request`)}
        >
          Request to Book
        </Button>
        <Button
          variant="outline"
          fullWidth
          size="lg"
          onClick={() => router.push('/chats/1')}
        >
          Send Message
        </Button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
