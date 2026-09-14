import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import { ListingStatus } from '@prisma/client';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: PrismaService;

  const mockPrismaService = {
    listing: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    searchQuery: {
      create: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchListings', () => {
    const mockListings = [
      {
        id: 'listing-1',
        title: 'Test Listing',
        description: 'Test description',
        pricePerDay: 100,
        category: 'Electronics',
        location: 'Lagos',
        status: ListingStatus.PUBLISHED,
        owner: {
          id: 'owner-1',
          firstName: 'John',
          lastName: 'Doe',
        },
        _count: {
          bookings: 5,
        },
      },
    ];

    it('should search listings with basic query', async () => {
      mockPrismaService.listing.count.mockResolvedValue(1);
      mockPrismaService.listing.findMany.mockResolvedValue(mockListings);

      const result = await service.searchListings({
        query: 'test',
        page: 1,
        limit: 20,
      });

      expect(result.data).toEqual(mockListings);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(prisma.listing.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: ListingStatus.PUBLISHED,
          OR: expect.any(Array),
        }),
      });
    });

    it('should filter by category', async () => {
      mockPrismaService.listing.count.mockResolvedValue(1);
      mockPrismaService.listing.findMany.mockResolvedValue(mockListings);

      await service.searchListings({
        category: 'Electronics',
      });

      expect(prisma.listing.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          category: 'Electronics',
        }),
      });
    });

    it('should filter by location', async () => {
      mockPrismaService.listing.count.mockResolvedValue(1);
      mockPrismaService.listing.findMany.mockResolvedValue(mockListings);

      await service.searchListings({
        location: 'Lagos',
      });

      expect(prisma.listing.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          location: { contains: 'Lagos', mode: 'insensitive' },
        }),
      });
    });

    it('should filter by price range', async () => {
      mockPrismaService.listing.count.mockResolvedValue(1);
      mockPrismaService.listing.findMany.mockResolvedValue(mockListings);

      await service.searchListings({
        minPrice: 50,
        maxPrice: 150,
      });

      expect(prisma.listing.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          pricePerDay: {
            gte: 50,
            lte: 150,
          },
        }),
      });
    });

    it('should filter by date range for availability', async () => {
      mockPrismaService.listing.count.mockResolvedValue(1);
      mockPrismaService.listing.findMany.mockResolvedValue(mockListings);

      await service.searchListings({
        startDate: '2026-10-01',
        endDate: '2026-10-10',
      });

      expect(prisma.listing.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          availabilityBlocks: {
            some: {
              startDate: { lte: expect.any(Date) },
              endDate: { gte: expect.any(Date) },
            },
          },
        }),
      });
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.listing.count.mockResolvedValue(50);
      mockPrismaService.listing.findMany.mockResolvedValue(mockListings);

      const result = await service.searchListings({
        page: 2,
        limit: 10,
      });

      expect(result.meta.total).toBe(50);
      expect(result.meta.page).toBe(2);
      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.hasMore).toBe(true);
      expect(prisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should sort by pricePerDay', async () => {
      mockPrismaService.listing.count.mockResolvedValue(1);
      mockPrismaService.listing.findMany.mockResolvedValue(mockListings);

      await service.searchListings({
        sortBy: 'pricePerDay',
        sortOrder: 'asc',
      });

      expect(prisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { pricePerDay: 'asc' },
        }),
      );
    });

    it('should log search query when results are low', async () => {
      mockPrismaService.listing.count.mockResolvedValue(2);
      mockPrismaService.listing.findMany.mockResolvedValue([]);
      mockPrismaService.searchQuery.create.mockResolvedValue({});

      await service.searchListings(
        {
          query: 'rare item',
          category: 'Electronics',
          location: 'Abuja',
        },
        'user-1',
      );

      expect(prisma.searchQuery.create).toHaveBeenCalledWith({
        data: {
          query: 'rare item',
          category: 'Electronics',
          location: 'Abuja',
          resultCount: 2,
        },
      });
    });

    it('should not log search query when results are sufficient', async () => {
      mockPrismaService.listing.count.mockResolvedValue(10);
      mockPrismaService.listing.findMany.mockResolvedValue(mockListings);

      await service.searchListings({
        query: 'common item',
      });

      expect(prisma.searchQuery.create).not.toHaveBeenCalled();
    });

    it('should handle search query logging failure silently', async () => {
      mockPrismaService.listing.count.mockResolvedValue(1);
      mockPrismaService.listing.findMany.mockResolvedValue(mockListings);
      mockPrismaService.searchQuery.create.mockRejectedValue(new Error('DB error'));

      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      await service.searchListings({ query: 'test' });

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('getPopularSearches', () => {
    it('should return popular searches with low results', async () => {
      const mockPopularSearches = [
        {
          category: 'Electronics',
          location: 'Lagos',
          _count: { id: 15 },
        },
        {
          category: 'Vehicles',
          location: 'Abuja',
          _count: { id: 10 },
        },
      ];

      mockPrismaService.searchQuery.groupBy.mockResolvedValue(mockPopularSearches);

      const result = await service.getPopularSearches(10);

      expect(result).toEqual([
        {
          category: 'Electronics',
          location: 'Lagos',
          searchCount: 15,
        },
        {
          category: 'Vehicles',
          location: 'Abuja',
          searchCount: 10,
        },
      ]);
      expect(prisma.searchQuery.groupBy).toHaveBeenCalledWith({
        by: ['category', 'location'],
        where: {
          resultCount: { lt: 3 },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      });
    });
  });

  describe('getDemandInsights', () => {
    it('should return demand insights grouped by category and location', async () => {
      const mockCategoryDemand = [
        {
          category: 'Electronics',
          _count: { id: 25 },
        },
      ];

      const mockLocationDemand = [
        {
          location: 'Lagos',
          _count: { id: 30 },
        },
      ];

      mockPrismaService.searchQuery.groupBy
        .mockResolvedValueOnce(mockCategoryDemand)
        .mockResolvedValueOnce(mockLocationDemand);

      const result = await service.getDemandInsights();

      expect(result).toEqual({
        categoryDemand: [
          {
            category: 'Electronics',
            unfulfilled_searches: 25,
          },
        ],
        locationDemand: [
          {
            location: 'Lagos',
            unfulfilled_searches: 30,
          },
        ],
      });
      expect(prisma.searchQuery.groupBy).toHaveBeenCalledTimes(2);
    });
  });
});
