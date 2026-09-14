'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Card, CardImage, CardContent } from '@/components/ui/Card';
import { formatPrice, formatDistance } from '@/lib/utils';

export interface ListingCardProps {
  id: string;
  title: string;
  pricePerDay: number;
  image: string;
  distance: number;
  location?: string;
}

export function ListingCard({
  id,
  title,
  pricePerDay,
  image,
  distance,
  location = 'Ikeja, Lagos',
}: ListingCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/listings/${id}`);
  };

  return (
    <Card hover className="overflow-hidden" onClick={handleClick}>
      <CardImage className="aspect-[16/11]">
        <Image
          src={image}
          alt={title}
          width={800}
          height={550}
          className="w-full h-full object-cover"
        />
      </CardImage>
      
      {/* Remove all padding - text aligns perfectly with image edge */}
      <CardContent className="px-0 pt-3 pb-3 space-y-1">
        {/* Title - Prominent, dark, readable */}
        <h3 className="font-semibold text-neutral-900 text-[15px] leading-snug">
          {title}
        </h3>
        
        {/* Location + Distance - Subtle gray */}
        <p className="text-[13px] text-neutral-400">
          {formatDistance(distance)} ({location})
        </p>
        
        {/* Price - Colored and bold */}
        <div>
          <span className="text-primary-600 font-bold text-[16px]">
            {formatPrice(pricePerDay)}
          </span>
          <span className="text-primary-600 font-bold text-[16px]"> - 30</span>
          <span className="text-neutral-400 text-[13px]">/day</span>
        </div>
      </CardContent>
    </Card>
  );
} 
