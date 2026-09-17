'use client';

import Image from 'next/image';
import { Settings, Star, BadgeCheck } from 'lucide-react';
import { useState } from 'react';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils';

// Mock data - will be replaced with API call
const mockUserProfile = {
  name: 'Adebisi O.',
  avatar: 'https://i.pravatar.cc/150?u=adebisi',
  isVerified: true,
  memberSince: 'April 2024',
  rating: 4.8,
  reviewCount: 14,
  activeListings: [
    {
      id: '1',
      title: 'Neewer LED Light Panel',
      image: 'https://images.unsplash.com/photo-1551982731-d0d1d86b0f87?w=400&h=400&fit=crop',
      pricePerDay: 6000,
      rating: 4.9,
      status: 'Self-listed',
    },
    {
      id: '2',
      title: 'Karcher K4 Pressure Washer',
      image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=400&fit=crop',
      pricePerDay: 3500,
      rating: 4.6,
      status: 'Self-listed',
    },
  ],
  recentRentals: [
    {
      id: '1',
      title: '2.5kva Silent Generator',
      image: 'https://images.unsplash.com/photo-1591696331111-ef9586a5b17a?w=100&h=100&fit=crop',
      dateRange: 'Sep 12 - Sep 14',
      price: 24000,
      status: 'RETURNED',
    },
  ],
};

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'listings' | 'history'>('listings');

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-neutral-50 pb-28 lg:pb-12">
      {/* Header */}
      <div className="bg-white px-4 lg:px-8 pt-3 lg:pt-6 pb-4 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h1 className="text-[24px] lg:text-[32px] font-bold text-neutral-900">My Account</h1>
            <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
              <Settings className="w-6 h-6 text-neutral-700" />
            </button>
          </div>

          {/* User Info Card */}
          <div className="flex items-start gap-4 lg:gap-6 mb-4 lg:mb-6">
            <div className="relative">
              <Image
                src={mockUserProfile.avatar}
                alt={mockUserProfile.name}
                width={80}
                height={80}
                className="rounded-full lg:w-24 lg:h-24"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-[20px] lg:text-[24px] font-bold text-neutral-900">
                  {mockUserProfile.name}
                </h2>
                {mockUserProfile.isVerified && (
                  <Badge variant="success" className="text-[10px] px-2 py-0.5 flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" />
                    VERIFIED
                  </Badge>
                )}
              </div>
              <p className="text-[13px] lg:text-[14px] text-neutral-500 mb-2">
                Member since {mockUserProfile.memberSince}
              </p>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-[15px] lg:text-[16px] text-neutral-900">
                  {mockUserProfile.rating}
                </span>
                <span className="text-[13px] lg:text-[14px] text-neutral-500">
                  • {mockUserProfile.reviewCount} reviews
                </span>
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <Button variant="outline" fullWidth size="lg" className="lg:w-auto lg:px-8">
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white mt-2 px-4 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex border-b border-neutral-200">
            <button
              onClick={() => setActiveTab('listings')}
              className={`flex-1 lg:flex-none pb-3 text-[15px] lg:text-[16px] font-semibold transition-colors relative ${
                activeTab === 'listings'
                  ? 'text-primary-600'
                  : 'text-neutral-400'
              }`}
            >
              Active Listings ({mockUserProfile.activeListings.length})
              {activeTab === 'listings' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 lg:flex-none lg:ml-8 pb-3 text-[15px] lg:text-[16px] font-semibold transition-colors relative ${
                activeTab === 'history'
                  ? 'text-primary-600'
                  : 'text-neutral-400'
              }`}
            >
              Rental History
              {activeTab === 'history' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 lg:px-8 pt-4 lg:pt-6">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'listings' && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {mockUserProfile.activeListings.map((listing) => (
                <Card key={listing.id} className="overflow-hidden">
                  <div className="relative aspect-square">
                    <Image
                      src={listing.image}
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-[11px] text-neutral-400 uppercase">
                      {listing.status}
                    </p>
                    <h3 className="font-semibold text-[13px] text-neutral-900 line-clamp-1">
                      {listing.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-primary-600 font-bold text-[14px]">
                          {formatPrice(listing.pricePerDay)}
                        </span>
                        <span className="text-neutral-500 text-[11px]">/day</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-[13px] text-neutral-900">
                          {listing.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <h3 className="text-[17px] lg:text-[20px] font-bold text-neutral-900 mb-3">
                Recent Rentals
              </h3>
              {mockUserProfile.recentRentals.map((rental) => (
                <Card key={rental.id} className="p-3 lg:p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={rental.image}
                        alt={rental.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-[15px] lg:text-[16px] text-neutral-900 mb-1 line-clamp-1">
                        {rental.title}
                      </h4>
                      <p className="text-[12px] lg:text-[13px] text-neutral-500 mb-1">
                        Rented {rental.dateRange} • {formatPrice(rental.price)}
                      </p>
                    </div>
                    <Badge variant="success" className="text-[10px] px-2 py-1">
                      {rental.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav - Only on mobile */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
    </ProtectedRoute>
  );
}
