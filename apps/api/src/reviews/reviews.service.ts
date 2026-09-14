import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(bookingId: string, reviewerId: string, createDto: CreateReviewDto) {
    // Get booking with participants
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          select: {
            ownerId: true,
          },
        },
        review: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    // Verify reviewer is a participant
    const isRenter = booking.renterId === reviewerId;
    const isOwner = booking.listing.ownerId === reviewerId;

    if (!isRenter && !isOwner) {
      throw new ForbiddenException('You are not a participant in this booking');
    }

    // Check if booking is completed
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Reviews can only be created for completed bookings');
    }

    // Check if review already exists
    if (booking.review) {
      throw new ConflictException('A review already exists for this booking');
    }

    // Determine reviewee
    const revieweeId = isRenter ? booking.listing.ownerId : booking.renterId;

    // Create review
    const review = await this.prisma.review.create({
      data: {
        bookingId,
        reviewerId,
        revieweeId,
        rating: createDto.rating,
        comment: createDto.comment,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        booking: {
          select: {
            id: true,
            listing: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return review;
  }

  async findByUser(userId: string, type: 'given' | 'received') {
    const where = type === 'given' ? { reviewerId: userId } : { revieweeId: userId };

    const reviews = await this.prisma.review.findMany({
      where,
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        booking: {
          select: {
            id: true,
            listing: {
              select: {
                id: true,
                title: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews;
  }

  async findByListing(listingId: string) {
    // First get the listing to find the owner
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${listingId} not found`);
    }

    // Get all reviews for bookings of this listing (reviews of the owner)
    const reviews = await this.prisma.review.findMany({
      where: {
        booking: {
          listingId,
        },
        // Only show reviews where the owner is the reviewee (renters reviewing owner)
        revieweeId: listing.ownerId,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews;
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        booking: {
          select: {
            id: true,
            listing: {
              select: {
                id: true,
                title: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async getUserStats(userId: string) {
    // Get all reviews received by this user
    const receivedReviews = await this.prisma.review.findMany({
      where: { revieweeId: userId },
      select: { rating: true },
    });

    if (receivedReviews.length === 0) {
      return {
        userId,
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    // Calculate average
    const totalRating = receivedReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / receivedReviews.length;

    // Calculate distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    receivedReviews.forEach((review) => {
      distribution[review.rating as keyof typeof distribution]++;
    });

    return {
      userId,
      totalReviews: receivedReviews.length,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      ratingDistribution: distribution,
    };
  }

  async canUserReview(bookingId: string, userId: string): Promise<boolean> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          select: {
            ownerId: true,
          },
        },
        review: true,
      },
    });

    if (!booking) {
      return false;
    }

    // Check if user is a participant
    const isParticipant =
      booking.renterId === userId || booking.listing.ownerId === userId;

    if (!isParticipant) {
      return false;
    }

    // Check if booking is completed
    if (booking.status !== BookingStatus.COMPLETED) {
      return false;
    }

    // Check if review already exists
    if (booking.review) {
      return false;
    }

    return true;
  }
}
