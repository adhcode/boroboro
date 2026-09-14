import { UserRole, BookingStatus, PaymentStatus, ListingStatus } from './enums';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  pricePerDay: number;
  depositAmount: number;
  status: ListingStatus;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  listingId: string;
  renterId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  depositAmount: number;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}
