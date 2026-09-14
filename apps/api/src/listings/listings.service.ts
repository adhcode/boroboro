import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, ListingStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createListingDto: CreateListingDto) {
    // Validate deposit is reasonable (e.g., not more than 10x daily price)
    if (createListingDto.depositAmount > createListingDto.pricePerDay * 10) {
      throw new BadRequestException('Deposit amount seems unreasonably high');
    }

    const listing = await this.prisma.listing.create({
      data: {
        ...createListingDto,
        ownerId: userId,
        status: createListingDto.status || ListingStatus.DRAFT,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return listing;
  }

  async findAll(queryDto: QueryListingsDto) {
    const {
      category,
      location,
      search,
      status,
      minPrice,
      maxPrice,
      limit = 20,
      offset = 0,
    } = queryDto;

    const where: Prisma.ListingWhereInput = {
      // Default: only show published listings to public
      status: status || ListingStatus.PUBLISHED,
    };

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
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

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      listings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async findOne(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          },
        },
        availabilityBlocks: {
          orderBy: { startDate: 'asc' },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    return listing;
  }

  async findMyListings(userId: string, status?: ListingStatus) {
    const where: Prisma.ListingWhereInput = {
      ownerId: userId,
    };

    if (status) {
      where.status = status;
    }

    const listings = await this.prisma.listing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    return listings;
  }

  async update(id: string, userId: string, updateListingDto: UpdateListingDto) {
    // Check listing exists and user owns it
    const listing = await this.prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    // Validate deposit if being updated
    if (
      updateListingDto.depositAmount !== undefined &&
      updateListingDto.pricePerDay !== undefined
    ) {
      if (updateListingDto.depositAmount > updateListingDto.pricePerDay * 10) {
        throw new BadRequestException('Deposit amount seems unreasonably high');
      }
    } else if (updateListingDto.depositAmount !== undefined) {
      if (updateListingDto.depositAmount > listing.pricePerDay * 10) {
        throw new BadRequestException('Deposit amount seems unreasonably high');
      }
    } else if (updateListingDto.pricePerDay !== undefined) {
      if (listing.depositAmount > updateListingDto.pricePerDay * 10) {
        throw new BadRequestException(
          'Deposit amount would be unreasonably high with new price',
        );
      }
    }

    const updatedListing = await this.prisma.listing.update({
      where: { id },
      data: updateListingDto,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedListing;
  }

  async remove(id: string, userId: string) {
    // Check listing exists and user owns it
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED', 'ACTIVE'],
            },
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    // Prevent deletion if there are active bookings
    if (listing.bookings.length > 0) {
      throw new BadRequestException(
        'Cannot delete listing with pending or active bookings. Cancel them first or archive the listing instead.',
      );
    }

    await this.prisma.listing.delete({
      where: { id },
    });

    return { message: 'Listing deleted successfully' };
  }

  async updateStatus(id: string, userId: string, status: ListingStatus) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    const updatedListing = await this.prisma.listing.update({
      where: { id },
      data: { status },
    });

    return updatedListing;
  }
}
