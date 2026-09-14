import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityBlocksService } from '../availability-blocks/availability-blocks.service';

describe('BookingsService', () => {
  let service: BookingsService;
  let prismaService: PrismaService;
  let availabilityService: AvailabilityBlocksService;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const mockListing = {
    id: 'listing1',
    title: 'Test Listing',
    ownerId: 'owner1',
    pricePerDay: 50,
    depositAmount: 200,
    status: 'PUBLISHED',
  };

  const mockBooking = {
    id: 'booking1',
    listingId: 'listing1',
    renterId: 'renter1',
    startDate: tomorrow,
    endDate: nextWeek,
    totalPrice: 300,
    depositAmount: 200,
    status: BookingStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: {
            listing: {
              findUnique: jest.fn(),
            },
            booking: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: AvailabilityBlocksService,
          useValue: {
            isListingAvailable: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prismaService = module.get<PrismaService>(PrismaService);
    availabilityService = module.get<AvailabilityBlocksService>(AvailabilityBlocksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a booking successfully', async () => {
      const createDto = {
        listingId: 'listing1',
        startDate: tomorrow,
        endDate: nextWeek,
      };

      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);
      jest.spyOn(availabilityService, 'isListingAvailable').mockResolvedValue(true);
      jest.spyOn(prismaService.booking, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.booking, 'create').mockResolvedValue({
        ...mockBooking,
        listing: { ...mockListing, owner: { id: 'owner1', firstName: 'Owner' } },
        renter: { id: 'renter1', firstName: 'Renter' },
      } as any);

      const result = await service.create('renter1', createDto);

      expect(result).toBeDefined();
      expect(result.status).toBe(BookingStatus.PENDING);
      expect(prismaService.booking.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if listing does not exist', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(null);

      await expect(
        service.create('renter1', {
          listingId: 'listing1',
          startDate: tomorrow,
          endDate: nextWeek,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for self-booking', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);

      await expect(
        service.create('owner1', {
          listingId: 'listing1',
          startDate: tomorrow,
          endDate: nextWeek,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for unpublished listing', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue({
        ...mockListing,
        status: 'DRAFT',
      } as any);

      await expect(
        service.create('renter1', {
          listingId: 'listing1',
          startDate: tomorrow,
          endDate: nextWeek,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if dates are not available', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);
      jest.spyOn(availabilityService, 'isListingAvailable').mockResolvedValue(false);

      await expect(
        service.create('renter1', {
          listingId: 'listing1',
          startDate: tomorrow,
          endDate: nextWeek,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException for overlapping bookings', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);
      jest.spyOn(availabilityService, 'isListingAvailable').mockResolvedValue(true);
      jest.spyOn(prismaService.booking, 'findFirst').mockResolvedValue(mockBooking as any);

      await expect(
        service.create('renter1', {
          listingId: 'listing1',
          startDate: tomorrow,
          endDate: nextWeek,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for past start date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);

      await expect(
        service.create('renter1', {
          listingId: 'listing1',
          startDate: yesterday,
          endDate: tomorrow,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findUserBookings', () => {
    it('should return bookings for a renter', async () => {
      jest.spyOn(prismaService.booking, 'findMany').mockResolvedValue([mockBooking] as any);

      const result = await service.findUserBookings('renter1', 'renter');

      expect(result).toHaveLength(1);
      expect(prismaService.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { renterId: 'renter1' },
        }),
      );
    });

    it('should return bookings for an owner', async () => {
      jest.spyOn(prismaService.booking, 'findMany').mockResolvedValue([mockBooking] as any);

      const result = await service.findUserBookings('owner1', 'owner');

      expect(result).toHaveLength(1);
      expect(prismaService.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { listing: { ownerId: 'owner1' } },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a booking for authorized user', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue({
        ...mockBooking,
        listing: mockListing,
      } as any);

      const result = await service.findOne('booking1', 'renter1');

      expect(result).toBeDefined();
      expect(result.id).toBe('booking1');
    });

    it('should throw ForbiddenException for unauthorized user', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue({
        ...mockBooking,
        listing: mockListing,
      } as any);

      await expect(service.findOne('booking1', 'other-user')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('booking1', 'renter1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirm', () => {
    it('should confirm a pending booking', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue({
        ...mockBooking,
        listing: mockListing,
      } as any);
      jest.spyOn(availabilityService, 'isListingAvailable').mockResolvedValue(true);
      jest.spyOn(prismaService.booking, 'update').mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      } as any);

      const result = await service.confirm('booking1', 'owner1');

      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue({
        ...mockBooking,
        listing: mockListing,
      } as any);

      await expect(service.confirm('booking1', 'renter1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if booking is not pending', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
        listing: mockListing,
      } as any);

      await expect(service.confirm('booking1', 'owner1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel a booking', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue({
        ...mockBooking,
        listing: mockListing,
      } as any);
      jest.spyOn(prismaService.booking, 'update').mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      } as any);

      const result = await service.cancel('booking1', 'renter1');

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should allow owner to cancel', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue({
        ...mockBooking,
        listing: mockListing,
      } as any);
      jest.spyOn(prismaService.booking, 'update').mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      } as any);

      const result = await service.cancel('booking1', 'owner1');

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw BadRequestException for completed bookings', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.COMPLETED,
        listing: mockListing,
      } as any);

      await expect(service.cancel('booking1', 'renter1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('complete', () => {
    it('should complete an active booking', async () => {
      const pastEndDate = new Date();
      pastEndDate.setDate(pastEndDate.getDate() - 1);

      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.ACTIVE,
        endDate: pastEndDate,
        listing: mockListing,
      } as any);
      jest.spyOn(prismaService.booking, 'update').mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.COMPLETED,
      } as any);

      const result = await service.complete('booking1', 'owner1');

      expect(result.status).toBe(BookingStatus.COMPLETED);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.ACTIVE,
        listing: mockListing,
      } as any);

      await expect(service.complete('booking1', 'renter1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if booking is not active', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.PENDING,
        listing: mockListing,
      } as any);

      await expect(service.complete('booking1', 'owner1')).rejects.toThrow(BadRequestException);
    });
  });
});
