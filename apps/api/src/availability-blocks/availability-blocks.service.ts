import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { ListingsService } from '../listings/listings.service';
import { CreateAvailabilityBlockDto } from './dto/create-availability-block.dto';
import { UpdateAvailabilityBlockDto } from './dto/update-availability-block.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';

@Injectable()
export class AvailabilityBlocksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly listingsService: ListingsService,
  ) {}

  async create(listingId: string, userId: string, createDto: CreateAvailabilityBlockDto) {
    // Verify listing exists and user owns it
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${listingId} not found`);
    }

    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You can only manage availability for your own listings');
    }

    // Validate dates
    this.validateDates(createDto.startDate, createDto.endDate);

    // Check for overlapping blocks
    const hasOverlap = await this.hasOverlappingBlocks(
      listingId,
      createDto.startDate,
      createDto.endDate,
    );

    if (hasOverlap) {
      throw new ConflictException(
        'This date range overlaps with an existing availability block',
      );
    }

    const block = await this.prisma.availabilityBlock.create({
      data: {
        listingId,
        startDate: createDto.startDate,
        endDate: createDto.endDate,
        isBlocked: createDto.isBlocked ?? false,
      },
    });

    return block;
  }

  async findAll(listingId: string, startDate?: string, endDate?: string) {
    // Verify listing exists
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${listingId} not found`);
    }

    const where: any = { listingId };

    // Filter by date range if provided
    if (startDate || endDate) {
      where.AND = [];

      if (startDate) {
        where.AND.push({
          endDate: {
            gte: new Date(startDate),
          },
        });
      }

      if (endDate) {
        where.AND.push({
          startDate: {
            lte: new Date(endDate),
          },
        });
      }
    }

    const blocks = await this.prisma.availabilityBlock.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    return blocks;
  }

  async checkAvailability(listingId: string, checkDto: CheckAvailabilityDto) {
    // Verify listing exists
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${listingId} not found`);
    }

    // Validate dates
    this.validateDates(checkDto.startDate, checkDto.endDate);

    // Check if there are any blocked periods in the range
    const blockedPeriods = await this.prisma.availabilityBlock.findMany({
      where: {
        listingId,
        isBlocked: true,
        OR: [
          {
            // Block starts within the requested range
            startDate: {
              gte: checkDto.startDate,
              lte: checkDto.endDate,
            },
          },
          {
            // Block ends within the requested range
            endDate: {
              gte: checkDto.startDate,
              lte: checkDto.endDate,
            },
          },
          {
            // Block completely encompasses the requested range
            AND: [
              { startDate: { lte: checkDto.startDate } },
              { endDate: { gte: checkDto.endDate } },
            ],
          },
        ],
      },
    });

    const isAvailable = blockedPeriods.length === 0;

    return {
      isAvailable,
      requestedStartDate: checkDto.startDate,
      requestedEndDate: checkDto.endDate,
      blockedPeriods: isAvailable ? [] : blockedPeriods,
      message: isAvailable
        ? 'Listing is available for the requested dates'
        : 'Listing has blocked periods within the requested date range',
    };
  }

  async findOne(id: string, listingId: string) {
    const block = await this.prisma.availabilityBlock.findUnique({
      where: { id },
    });

    if (!block) {
      throw new NotFoundException(`Availability block with ID ${id} not found`);
    }

    if (block.listingId !== listingId) {
      throw new NotFoundException(`Availability block not found for this listing`);
    }

    return block;
  }

  async update(
    id: string,
    listingId: string,
    userId: string,
    updateDto: UpdateAvailabilityBlockDto,
  ) {
    // Verify block exists and belongs to listing
    const block = await this.prisma.availabilityBlock.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!block) {
      throw new NotFoundException(`Availability block with ID ${id} not found`);
    }

    if (block.listingId !== listingId) {
      throw new NotFoundException(`Availability block not found for this listing`);
    }

    if (block.listing.ownerId !== userId) {
      throw new ForbiddenException('You can only manage availability for your own listings');
    }

    // Validate dates if being updated
    if (updateDto.startDate || updateDto.endDate) {
      const newStartDate = updateDto.startDate || block.startDate;
      const newEndDate = updateDto.endDate || block.endDate;

      this.validateDates(newStartDate, newEndDate);

      // Check for overlapping blocks (excluding current block)
      const hasOverlap = await this.hasOverlappingBlocks(
        listingId,
        newStartDate,
        newEndDate,
        id,
      );

      if (hasOverlap) {
        throw new ConflictException(
          'Updated date range overlaps with an existing availability block',
        );
      }
    }

    const updatedBlock = await this.prisma.availabilityBlock.update({
      where: { id },
      data: updateDto,
    });

    return updatedBlock;
  }

  async remove(id: string, listingId: string, userId: string) {
    // Verify block exists and belongs to listing
    const block = await this.prisma.availabilityBlock.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!block) {
      throw new NotFoundException(`Availability block with ID ${id} not found`);
    }

    if (block.listingId !== listingId) {
      throw new NotFoundException(`Availability block not found for this listing`);
    }

    if (block.listing.ownerId !== userId) {
      throw new ForbiddenException('You can only manage availability for your own listings');
    }

    await this.prisma.availabilityBlock.delete({
      where: { id },
    });

    return { message: 'Availability block deleted successfully' };
  }

  // Helper methods

  private validateDates(startDate: Date, endDate: Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to start of day

    if (start < now) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    if (end <= start) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate reasonable range (e.g., max 1 year)
    const maxDays = 365;
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > maxDays) {
      throw new BadRequestException(`Date range cannot exceed ${maxDays} days`);
    }
  }

  private async hasOverlappingBlocks(
    listingId: string,
    startDate: Date,
    endDate: Date,
    excludeBlockId?: string,
  ): Promise<boolean> {
    const where: any = {
      listingId,
      OR: [
        {
          // New block starts within existing block
          AND: [{ startDate: { lte: startDate } }, { endDate: { gt: startDate } }],
        },
        {
          // New block ends within existing block
          AND: [{ startDate: { lt: endDate } }, { endDate: { gte: endDate } }],
        },
        {
          // New block completely encompasses existing block
          AND: [{ startDate: { gte: startDate } }, { endDate: { lte: endDate } }],
        },
      ],
    };

    if (excludeBlockId) {
      where.id = { not: excludeBlockId };
    }

    const overlapping = await this.prisma.availabilityBlock.findFirst({
      where,
    });

    return !!overlapping;
  }

  /**
   * Check if a listing is available for a specific date range
   * Used by bookings module
   */
  async isListingAvailable(listingId: string, startDate: Date, endDate: Date): Promise<boolean> {
    const result = await this.checkAvailability(listingId, { startDate, endDate });
    return result.isAvailable;
  }
}
