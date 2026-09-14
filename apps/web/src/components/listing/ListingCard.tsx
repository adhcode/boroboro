import Image from 'next/image';

import { Star, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Card, CardImage, CardContent } from '@/components/ui/Card';
import { formatPrice, formatDistance } from '@/lib/utils';

export interface ListingCardProps {
  id: string;
  title: string;
  pricePerDay: number;
  rating: number;
  image: string;
  distance: number;
  isVerified: boolean;
}

export function ListingCard({
  title,
  pricePerDay,
  rating,
  image,
  distance,
  isVerified,
}: ListingCardProps) {
  return (
    <Card hover className="overflow-hidden">
      <CardImage className="aspect-[16/11]">
        <Image
          src={image}
          alt={title}
          width={800}
          height={550}
          className="w-full h-full object-cover"
        />
      </CardImage>
      
      <CardContent className="p-3 space-y-2">
        {/* Distance & Verification - Subtle */}
        <div className="flex items-center gap-2 min-h-[18px]">
          <span className="text-[11px] text-neutral-400 flex items-center gap-0.5">
            {formatDistance(distance)}
          </span>
          {isVerified && (
            <Badge variant="success" className="text-[10px] px-1.5 py-0.5">
              <ShieldCheck className="w-2.5 h-2.5" />
              VERIFIED
            </Badge>
          )}
        </div>
        
        {/* Title - Clean and readable */}
        <h3 className="font-semibold text-neutral-900 text-[15px] leading-tight line-clamp-1">
          {title}
        </h3>
        
        {/* Price & Rating - Prominent but not overwhelming */}
        <div className="flex items-baseline justify-between pt-0.5">
          <div className="flex items-baseline gap-0.5">
            <span className="text-primary-600 font-bold text-base">
              {formatPrice(pricePerDay)}
            </span>
            <span className="text-neutral-400 text-[11px]">/day</span>
          </div>
          
          <div className="flex items-center gap-0.5">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-neutral-900 text-[13px]">{rating.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
