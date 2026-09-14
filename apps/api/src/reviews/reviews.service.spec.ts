import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prismaService: PrismaService;

  const mockBooking = {
    id: 'booking1',
    renterId: 'renter1',
    status: BookingStatus.COMPLETED,
    listing: {
      ownerId: 'owner1',
    },
    review: null,
  };

  const mockReview = {
    id: 'review1',
    bookingId: 'booking1',
    reviewerId: 'renter1',
    revieweeId: 'owner1',
    rating: 5,
    comment: 'Great experience!',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: PrismaService,
          useValue: {
            booking: {
              findUnique: jest.fn(),
            },
            review: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            listing: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a review from renter to owner', async () => {
      const createDto = {
        rating: 5,
        comment: 'Great experience!',
      };

      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue(mockBooking as any);
      jest.spyOn(prismaService.review, 'create').mockResolvedValue({
        ...mockReview,
        reviewer: { id: 'renter1', firstName: 'Renter', lastName: 'User' },
        reviewee: { id: 'owner1', firstName: 'Owner', lastName: 'User' },
        booking: { id: 'booking1', listing: { id: 'listing1', title: 'Camera' } },
      } as any);

      const result = await service.create('booking1', 'renter1', createDto);

      expect(result).toBeDefined();
      expect(result.rating).toBe(5);
      expect(result.reviewerId).toBe('renter1');
      expect(result.revieweeId).toBe('owner1');
    });

    it('should create a review from owner to renter', async () => {
      const createDto = {
        rating: 4,
        comment: 'Good renter',
      };

      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue(mockBooking as any);
      jest.spyOn(prismaService.review, 'create').mockResolvedValue({
        ...mockReview,
        reviewerId: 'owner1',
        revieweeId: 'renter1',
        rating: 4,
      } as any);

      const result = await service.create('booking1', 'owner1', createDto);

      expect(result.reviewerId).toBe('owner1');
      expect(result.revieweeId).toBe('renter1');
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue(null);

      await expect(service.create('booking1', 'renter1', { rating: 5 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue(mockBooking as any);

      await expect(service.create('booking1', 'other-user', { rating: 5 })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if booking is not completed', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      } as any);

      await expect(service.create('booking1', 'renter1', { rating: 5 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if review already exists', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue({
        ...mockBooking,
        review: mockReview,
      } as any);

      await expect(service.create('booking1', 'renter1', { rating: 5 })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findByUser', () => {
    it('should return reviews given by a user', async () => {
      jest.spyOn(prismaService.review, 'findMany').mockResolvedValue([mockReview] as any);

      const result = await service.findByUser('renter1', 'given');

      expect(result).toHaveLength(1);
      expect(prismaService.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { reviewerId: 'renter1' },
        }),
      );
    });

    it('should return reviews received by a user', async () => {
      jest.spyOn(prismaService.review, 'findMany').mockResolvedValue([mockReview] as any);

      const result = await service.findByUser('owner1', 'received');

      expect(result).toHaveLength(1);
      expect(prismaService.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { revieweeId: 'owner1' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single review', async () => {
      jest.spyOn(prismaService.review, 'findUnique').mockResolvedValue(mockReview as any);

      const result = await service.findOne('review1');

      expect(result).toBeDefined();
      expect(result.id).toBe('review1');
    });

    it('should throw NotFoundException if review does not exist', async () => {
      jest.spyOn(prismaService.review, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('review1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserStats', () => {
    it('should calculate user rating statistics', async () => {
      const reviews = [
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 3 },
        { rating: 5 },
      ];

      jest.spyOn(prismaService.review, 'findMany').mockResolvedValue(reviews as any);

      const result = await service.getUserStats('owner1');

      expect(result.totalReviews).toBe(5);
      expect(result.averageRating).toBe(4.4);
      expect(result.ratingDistribution[5]).toBe(3);
      expect(result.ratingDistribution[4]).toBe(1);
      expect(result.ratingDistribution[3]).toBe(1);
    });

    it('should return zero stats for user with no reviews', async () => {
      jest.spyOn(prismaService.review, 'findMany').mockResolvedValue([]);

      const result = await service.getUserStats('owner1');

      expect(result.totalReviews).toBe(0);
      expect(result.averageRating).toBe(0);
    });
  });

  describe('canUserReview', () => {
    it('should return true if user can review', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue(mockBooking as any);

      const result = await service.canUserReview('booking1', 'renter1');

      expect(result).toBe(true);
    });

    it('should return false if booking does not exist', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue(null);

      const result = await service.canUserReview('booking1', 'renter1');

      expect(result).toBe(false);
    });

    it('should return false if user is not a participant', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue(mockBooking as any);

      const result = await service.canUserReview('booking1', 'other-user');

      expect(result).toBe(false);
    });

    it('should return false if booking is not completed', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.ACTIVE,
      } as any);

      const result = await service.canUserReview('booking1', 'renter1');

      expect(result).toBe(false);
    });

    it('should return false if review already exists', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue({
        ...mockBooking,
        review: mockReview,
      } as any);

      const result = await service.canUserReview('booking1', 'renter1');

      expect(result).toBe(false);
    });
  });
});
