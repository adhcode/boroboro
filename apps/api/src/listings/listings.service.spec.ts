import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';

import { ListingsService } from './listings.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ListingsService', () => {
  let service: ListingsService;
  let prismaService: PrismaService;

  const mockListing = {
    id: '1',
    title: 'Camera Equipment',
    description: 'Professional DSLR camera with lenses',
    category: 'Photography',
    pricePerDay: 50,
    depositAmount: 200,
    status: ListingStatus.PUBLISHED,
    images: ['image1.jpg', 'image2.jpg'],
    location: 'Lagos, Nigeria',
    latitude: 6.5244,
    longitude: 3.3792,
    ownerId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        {
          provide: PrismaService,
          useValue: {
            listing: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new listing', async () => {
      const createDto = {
        title: 'Camera Equipment',
        description: 'Professional DSLR camera with lenses',
        category: 'Photography',
        pricePerDay: 50,
        depositAmount: 200,
        images: ['image1.jpg'],
        location: 'Lagos, Nigeria',
      };

      jest.spyOn(prismaService.listing, 'create').mockResolvedValue({
        ...mockListing,
        owner: {
          id: 'user1',
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      } as any);

      const result = await service.create('user1', createDto);

      expect(result).toBeDefined();
      expect(result.title).toBe(createDto.title);
      expect(prismaService.listing.create).toHaveBeenCalled();
    });

    it('should reject deposit amount that is too high', async () => {
      const createDto = {
        title: 'Camera Equipment',
        description: 'Professional DSLR camera with lenses',
        category: 'Photography',
        pricePerDay: 50,
        depositAmount: 1000, // 20x the daily price
        images: ['image1.jpg'],
        location: 'Lagos, Nigeria',
      };

      await expect(service.create('user1', createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated listings', async () => {
      jest.spyOn(prismaService.listing, 'findMany').mockResolvedValue([mockListing] as any);
      jest.spyOn(prismaService.listing, 'count').mockResolvedValue(1);

      const result = await service.findAll({ limit: 20, offset: 0 });

      expect(result).toHaveProperty('listings');
      expect(result).toHaveProperty('pagination');
      expect(result.listings).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter by category', async () => {
      jest.spyOn(prismaService.listing, 'findMany').mockResolvedValue([mockListing] as any);
      jest.spyOn(prismaService.listing, 'count').mockResolvedValue(1);

      await service.findAll({ category: 'Photography', limit: 20, offset: 0 });

      expect(prismaService.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: { contains: 'Photography', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should filter by price range', async () => {
      jest.spyOn(prismaService.listing, 'findMany').mockResolvedValue([mockListing] as any);
      jest.spyOn(prismaService.listing, 'count').mockResolvedValue(1);

      await service.findAll({ minPrice: 20, maxPrice: 100, limit: 20, offset: 0 });

      expect(prismaService.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            pricePerDay: { gte: 20, lte: 100 },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a listing by id', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if listing not found', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a listing', async () => {
      const updateDto = { title: 'Updated Camera Equipment' };

      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);
      jest.spyOn(prismaService.listing, 'update').mockResolvedValue({
        ...mockListing,
        ...updateDto,
      } as any);

      const result = await service.update('1', 'user1', updateDto);

      expect(result.title).toBe(updateDto.title);
    });

    it('should throw ForbiddenException if user does not own the listing', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);

      await expect(service.update('1', 'user2', { title: 'New Title' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if listing not found', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(null);

      await expect(service.update('999', 'user1', { title: 'New Title' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a listing without active bookings', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue({
        ...mockListing,
        bookings: [],
      } as any);
      jest.spyOn(prismaService.listing, 'delete').mockResolvedValue(mockListing as any);

      const result = await service.remove('1', 'user1');

      expect(result.message).toBe('Listing deleted successfully');
      expect(prismaService.listing.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw BadRequestException if there are active bookings', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue({
        ...mockListing,
        bookings: [{ id: 'booking1', status: 'CONFIRMED' }],
      } as any);

      await expect(service.remove('1', 'user1')).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user does not own the listing', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue({
        ...mockListing,
        bookings: [],
      } as any);

      await expect(service.remove('1', 'user2')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    it('should update listing status', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);
      jest.spyOn(prismaService.listing, 'update').mockResolvedValue({
        ...mockListing,
        status: ListingStatus.PAUSED,
      } as any);

      const result = await service.updateStatus('1', 'user1', ListingStatus.PAUSED);

      expect(result.status).toBe(ListingStatus.PAUSED);
    });

    it('should throw ForbiddenException if user does not own the listing', async () => {
      jest.spyOn(prismaService.listing, 'findUnique').mockResolvedValue(mockListing as any);

      await expect(service.updateStatus('1', 'user2', ListingStatus.PAUSED)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
