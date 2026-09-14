'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Calendar, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';

// Mock data - will be replaced with API call
const mockBookingData = {
  listing: {
    id: '1',
    title: 'Party Canopy Tent (10x10 ft)',
    category: 'Event Equipment',
    location: 'Ikeja',
    pricePerDay: 8500,
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=200&h=200&fit=crop',
  },
  dates: {
    start: 'Oct 17, 2026',
    end: 'Oct 19, 2026',
    days: 2,
  },
  pricing: {
    dailyRate: 8500,
    days: 2,
    subtotal: 17000,
    serviceFee: 1500,
    deposit: 5000,
    total: 23500,
  },
};

export default function BookingRequestPage() {
  const router = useRouter();
  const startDate = mockBookingData.dates.start;
  const endDate = mockBookingData.dates.end;

  const handleRequestBooking = () => {
    // TODO: Submit booking request to API
    console.log('Requesting booking...');
  };

  const handleSendMessage = () => {
    // TODO: Navigate to messaging with owner
    console.log('Opening message...');
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-900" />
          </button>
          <h1 className="text-[17px] font-bold text-neutral-900">
            Confirm & Request
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 space-y-4">
        {/* Listing Summary Card */}
        <Card className="p-3">
          <div className="flex gap-3">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={mockBookingData.listing.image}
                alt={mockBookingData.listing.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-[15px] text-neutral-900 mb-1 line-clamp-1">
                {mockBookingData.listing.title}
              </h2>
              <p className="text-[12px] text-neutral-400 mb-1">
                {mockBookingData.listing.category} • {mockBookingData.listing.location}
              </p>
              <p className="text-primary-600 font-bold text-[15px]">
                {formatPrice(mockBookingData.listing.pricePerDay)}/day
              </p>
            </div>
          </div>
        </Card>

        {/* Rental Dates */}
        <div>
          <h3 className="text-[16px] font-bold text-neutral-900 mb-3">
            Rental Dates
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Start Date */}
            <div>
              <label className="text-[12px] text-neutral-500 mb-2 block">
                Start Date
              </label>
              <button className="w-full px-3 py-3 bg-white border border-neutral-200 rounded-xl flex items-center gap-2 hover:border-primary-600 transition-colors">
                <Calendar className="w-4 h-4 text-primary-600" />
                <span className="text-[14px] font-medium text-neutral-900">
                  {startDate}
                </span>
              </button>
            </div>

            {/* End Date */}
            <div>
              <label className="text-[12px] text-neutral-500 mb-2 block">
                End Date
              </label>
              <button className="w-full px-3 py-3 bg-white border border-neutral-200 rounded-xl flex items-center gap-2 hover:border-primary-600 transition-colors">
                <Calendar className="w-4 h-4 text-primary-600" />
                <span className="text-[14px] font-medium text-neutral-900">
                  {endDate}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <Card className="p-4">
          <h3 className="text-[16px] font-bold text-neutral-900 mb-3">
            Price Breakdown
          </h3>

          <div className="space-y-3">
            {/* Daily Rate */}
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-neutral-600">
                {formatPrice(mockBookingData.pricing.dailyRate)} × {mockBookingData.pricing.days} days
              </span>
              <span className="text-[14px] font-medium text-neutral-900">
                {formatPrice(mockBookingData.pricing.subtotal)}
              </span>
            </div>

            {/* Service Fee */}
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-neutral-600">Service Fee</span>
              <span className="text-[14px] font-medium text-neutral-900">
                {formatPrice(mockBookingData.pricing.serviceFee)}
              </span>
            </div>

            {/* Deposit */}
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-neutral-600">Refundable Deposit</span>
              <span className="text-[14px] font-medium text-neutral-900">
                {formatPrice(mockBookingData.pricing.deposit)}
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-200" />

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-bold text-neutral-900">Total Payment</span>
              <span className="text-[18px] font-bold text-primary-600">
                {formatPrice(mockBookingData.pricing.total)}
              </span>
            </div>
          </div>
        </Card>

        {/* Security Note */}
        <div className="flex gap-3 p-3 bg-success-50 rounded-xl">
          <ShieldCheck className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-success-800 leading-relaxed">
            Your money is held securely. It is only released to the owner after you successfully pick up the item.
          </p>
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 space-y-2 safe-area-bottom">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={handleRequestBooking}
        >
          Send Request
        </Button>
        <Button
          variant="outline"
          fullWidth
          size="lg"
          onClick={handleSendMessage}
        >
          Send Message
        </Button>
      </div>
    </div>
  );
}
