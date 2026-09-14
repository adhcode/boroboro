import { Injectable } from '@nestjs/common';
import { Prisma, ListingStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { SearchListingsDto } from './dto/search-listings.dto';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchListings(searchDto: SearchListingsDto, userId?: string) {
    const {
      query,
      category,
      location,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = searchDto;

    // Build where clause
    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.PUBLISHED, // Only show published listings
    };

    // Text search on title and description
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.pricePerDay = {};
      if (minPrice !== undefined) {
        where.pricePerDay.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.pricePerDay.lte = maxPrice;
      }
    }

    // If date range is provided, only return listings with availability
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Find listings that have at least one availability block covering the date range
      where.availabilityBlocks = {
        some: {
          startDate: { lte: start },
          endDate: { gte: end },
        },
      };
    }

    // Count total results
    const total = await this.prisma.listing.count({ where });

    // Build orderBy
    let orderBy: Prisma.ListingOrderByWithRelationInput = {};
    if (sortBy === 'pricePerDay') {
      orderBy.pricePerDay = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy.createdAt = sortOrder; // Default
    }

    // Fetch paginated results
    const listings = await this.prisma.listing.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    // Log search query if results are low (for demand analysis)
    if (total < 3) {
      await this.logSearchQuery(searchDto, total, userId);
    }

    return {
      data: listings,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  async getPopularSearches(limit: number = 10) {
    // Get most frequent search queries with low results
    const searches = await this.prisma.searchQuery.groupBy({
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
      take: limit,
    });

    return searches.map((search) => ({
      category: search.category,
      location: search.location,
      searchCount: search._count.id,
    }));
  }

  async getDemandInsights() {
    // Get demand data grouped by category
    const categoryDemand = await this.prisma.searchQuery.groupBy({
      by: ['category'],
      where: {
        resultCount: { lt: 3 },
        category: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Get demand data grouped by location
    const locationDemand = await this.prisma.searchQuery.groupBy({
      by: ['location'],
      where: {
        resultCount: { lt: 3 },
        location: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 20,
    });

    return {
      categoryDemand: categoryDemand.map((item) => ({
        category: item.category,
        unfulfilled_searches: item._count.id,
      })),
      locationDemand: locationDemand.map((item) => ({
        location: item.location,
        unfulfilled_searches: item._count.id,
      })),
    };
  }

  private async logSearchQuery(
    searchDto: SearchListingsDto,
    resultsCount: number,
    userId?: string,
  ) {
    try {
      await this.prisma.searchQuery.create({
        data: {
          query: searchDto.query || '',
          category: searchDto.category || null,
          location: searchDto.location || null,
          resultCount: resultsCount,
        },
      });
    } catch (error) {
      // Silent fail - don't break search if logging fails
      console.error('Failed to log search query:', error);
    }
  }
}
