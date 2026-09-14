import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { AvailabilityBlocksService } from './availability-blocks.service';
import { PrismaService } from '../prisma/prisma.service';
import { ListingsService } from '../listings/listings.service';

describe('AvailabilityBlocksService', () => {
  let service: AvailabilityBlocksService;
  let prismaService: PrismaService;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const mockListing = {
    id: 'listing1',
    ownerId: 'user1',
    title: 'Test Listing',
  };

  const mockBlock = {
    id: 'block1',
    listingId: 'listing1',
    startDate: tomorrow,
    endDate: nextWeek,
    isBlocked: true,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityBlocksService,
        {
          provide: PrismaService,
          useValue: {
            listing: {
              findUnique: jest.fn(),
            },
            availabilityBlock: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: ListingsService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AvailabilityBlocksService>(AvailabilityBlocksService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an availability block', async () => {
      const createDto = {
        startDate: tomorrow,
        endDate: nextWeek,
        isBlocked: true,
      };

      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);
      jest.spyOn(prismaService.availabilityBlock, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.availabilityBlock, 'create').mockResolvedValue(mockBlock as any);

      const result = await service.create('listing1', 'user1', createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('block1');
      expect(prismaService.availabilityBlock.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if listing does not exist', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(null);

      await expect(
        service.create('listing1', 'user1', {
          startDate: tomorrow,
          endDate: nextWeek,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own listing', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);

      await expect(
        service.create('listing1', 'user2', {
          startDate: tomorrow,
          endDate: nextWeek,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for past start date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);

      await expect(
        service.create('listing1', 'user1', {
          startDate: yesterday,
          endDate: tomorrow,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if end date is before start date', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);

      await expect(
        service.create('listing1', 'user1', {
          startDate: nextWeek,
          endDate: tomorrow,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for overlapping blocks', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);
      jest
        .spyOn(prismaService.availabilityBlock, 'findFirst')
        .mockResolvedValue(mockBlock as any);

      await expect(
        service.create('listing1', 'user1', {
          startDate: tomorrow,
          endDate: nextWeek,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('checkAvailability', () => {
    it('should return available when no blocked periods exist', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);
      jest.spyOn(prismaService.availabilityBlock, 'findMany').mockResolvedValue([]);

      const result = await service.checkAvailability('listing1', {
        startDate: tomorrow,
        endDate: nextWeek,
      });

      expect(result.isAvailable).toBe(true);
      expect(result.blockedPeriods).toHaveLength(0);
    });

    it('should return unavailable when blocked periods exist', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);
      jest
        .spyOn(prismaService.availabilityBlock, 'findMany')
        .mockResolvedValue([mockBlock as any]);

      const result = await service.checkAvailability('listing1', {
        startDate: tomorrow,
        endDate: nextWeek,
      });

      expect(result.isAvailable).toBe(false);
      expect(result.blockedPeriods).toHaveLength(1);
    });

    it('should throw NotFoundException if listing does not exist', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(null);

      await expect(
        service.checkAvailability('listing1', {
          startDate: tomorrow,
          endDate: nextWeek,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all blocks for a listing', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);
      jest
        .spyOn(prismaService.availabilityBlock, 'findMany')
        .mockResolvedValue([mockBlock as any]);

      const result = await service.findAll('listing1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('block1');
    });

    it('should filter blocks by date range', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);
      jest
        .spyOn(prismaService.availabilityBlock, 'findMany')
        .mockResolvedValue([mockBlock as any]);

      const result = await service.findAll(
        'listing1',
        tomorrow.toISOString(),
        nextWeek.toISOString(),
      );

      expect(result).toBeDefined();
      expect(prismaService.availabilityBlock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            listingId: 'listing1',
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update an availability block', async () => {
      const updateDto = { isBlocked: false };

      jest.spyOn(prismaService.availabilityBlock, 'findUnique').mockResolvedValue({
        ...mockBlock,
        listing: mockListing,
      } as any);
      jest.spyOn(prismaService.availabilityBlock, 'update').mockResolvedValue({
        ...mockBlock,
        ...updateDto,
      } as any);

      const result = await service.update('block1', 'listing1', 'user1', updateDto);

      expect(result.isBlocked).toBe(false);
    });

    it('should throw ForbiddenException if user does not own listing', async () => {
      jest.spyOn(prismaService.availabilityBlock, 'findUnique').mockResolvedValue({
        ...mockBlock,
        listing: mockListing,
      } as any);

      await expect(
        service.update('block1', 'listing1', 'user2', { isBlocked: false }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete an availability block', async () => {
      jest.spyOn(prismaService.availabilityBlock, 'findUnique').mockResolvedValue({
        ...mockBlock,
        listing: mockListing,
      } as any);
      jest.spyOn(prismaService.availabilityBlock, 'delete').mockResolvedValue(mockBlock as any);

      const result = await service.remove('block1', 'listing1', 'user1');

      expect(result.message).toBe('Availability block deleted successfully');
      expect(prismaService.availabilityBlock.delete).toHaveBeenCalledWith({
        where: { id: 'block1' },
      });
    });

    it('should throw ForbiddenException if user does not own listing', async () => {
      jest.spyOn(prismaService.availabilityBlock, 'findUnique').mockResolvedValue({
        ...mockBlock,
        listing: mockListing,
      } as any);

      await expect(service.remove('block1', 'listing1', 'user2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('isListingAvailable', () => {
    it('should return true when listing is available', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);
      jest.spyOn(prismaService.availabilityBlock, 'findMany').mockResolvedValue([]);

      const result = await service.isListingAvailable('listing1', tomorrow, nextWeek);

      expect(result).toBe(true);
    });

    it('should return false when listing is blocked', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);
      jest
        .spyOn(prismaService.availabilityBlock, 'findMany')
        .mockResolvedValue([mockBlock as any]);

      const result = await service.isListingAvailable('listing1', tomorrow, nextWeek);

      expect(result).toBe(false);
    });
  });
});
