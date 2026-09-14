import Image from 'next/image';

import { Star, MapPin, ShieldCheck } from 'lucide-react';

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
    <Card hover>
      <CardImage>
        <Image
          src={image}
          alt={title}
          width={600}
          height={450}
          className="w-full h-full object-cover"
        />
      </CardImage>
      
      <CardContent className="space-y-2">
        {/* Distance & Verification */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {formatDistance(distance)}
          </span>
          {isVerified && (
            <Badge variant="success" className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              VERIFIED
            </Badge>
          )}
        </div>
        
        {/* Title */}
        <h3 className="font-semibold text-neutral-900 text-base leading-snug">
          {title}
        </h3>
        
        {/* Price & Rating */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-primary-600 font-bold text-lg">
              {formatPrice(pricePerDay)}
            </span>
            <span className="text-neutral-500 text-sm">/day</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-neutral-900 text-sm">{rating.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
