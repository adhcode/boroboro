import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency: string = '₦'): string {
  return `${currency}${amount.toLocaleString()}`;
}

export function formatDistance(meters: number): string {
  const km = meters / 1000;
  if (km < 1) {
    return `${Math.round(meters)}m away`;
  }
  return `${km.toFixed(1)} km away`;
}
