import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityBlocksService } from '../availability-blocks/availability-blocks.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availabilityBlocksService: AvailabilityBlocksService,
  ) {}

  async create(userId: string, createDto: CreateBookingDto) {
    // Validate dates
    this.validateDates(createDto.startDate, createDto.endDate);

    // Get listing
    const listing = await this.prisma.listing.findUnique({
      where: { id: createDto.listingId },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${createDto.listingId} not found`);
    }

    // Prevent self-booking
    if (listing.ownerId === userId) {
      throw new BadRequestException('You cannot book your own listing');
    }

    // Check if listing is published
    if (listing.status !== 'PUBLISHED') {
      throw new BadRequestException('This listing is not available for booking');
    }

    // Check availability
    const isAvailable = await this.availabilityBlocksService.isListingAvailable(
      createDto.listingId,
      createDto.startDate,
      createDto.endDate,
    );

    if (!isAvailable) {
      throw new ConflictException('Listing is not available for the requested dates');
    }

    // Check for overlapping bookings
    const hasOverlap = await this.hasOverlappingBookings(
      createDto.listingId,
      createDto.startDate,
      createDto.endDate,
    );

    if (hasOverlap) {
      throw new ConflictException('There is already a booking for these dates');
    }

    // Calculate pricing
    const { totalPrice, numberOfDays } = this.calculatePrice(
      createDto.startDate,
      createDto.endDate,
      listing.pricePerDay,
    );

    // Create booking
    const booking = await this.prisma.booking.create({
      data: {
        listingId: createDto.listingId,
        renterId: userId,
        startDate: createDto.startDate,
        endDate: createDto.endDate,
        totalPrice,
        depositAmount: listing.depositAmount,
        status: BookingStatus.PENDING,
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            pricePerDay: true,
            depositAmount: true,
            images: true,
            location: true,
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        renter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      ...booking,
      numberOfDays,
      message: 'Booking created successfully. Awaiting owner confirmation.',
    };
  }

  async findUserBookings(userId: string, role?: 'renter' | 'owner') {
    const where: any = {};

    if (role === 'renter') {
      where.renterId = userId;
    } else if (role === 'owner') {
      where.listing = {
        ownerId: userId,
      };
    } else {
      // Both roles
      where.OR = [{ renterId: userId }, { listing: { ownerId: userId } }];
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            images: true,
            location: true,
            pricePerDay: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        renter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings;
  }

  async findByListing(listingId: string, userId: string, status?: BookingStatus) {
    // Verify user is listing owner
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${listingId} not found`);
    }

    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You can only view bookings for your own listings');
    }

    const where: any = { listingId };
    if (status) {
      where.status = status;
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        renter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return bookings;
  }

  async findOne(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        renter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        payment: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Verify user is participant
    if (booking.renterId !== userId && booking.listing.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    return booking;
  }

  async updateStatus(id: string, userId: string, newStatus: BookingStatus) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Verify user is owner or renter
    const isOwner = booking.listing.ownerId === userId;
    const isRenter = booking.renterId === userId;

    if (!isOwner && !isRenter) {
      throw new ForbiddenException('You do not have permission to update this booking');
    }

    // Validate status transition
    this.validateStatusTransition(booking.status, newStatus, isOwner);

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: { status: newStatus },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        renter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedBooking;
  }

  async confirm(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Only owner can confirm
    if (booking.listing.ownerId !== userId) {
      throw new ForbiddenException('Only the listing owner can confirm bookings');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be confirmed');
    }

    // Re-check availability before confirming
    const isAvailable = await this.availabilityBlocksService.isListingAvailable(
      booking.listingId,
      booking.startDate,
      booking.endDate,
    );

    if (!isAvailable) {
      throw new ConflictException('Listing is no longer available for these dates');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CONFIRMED },
      include: {
        listing: {
          select: {
            title: true,
          },
        },
        renter: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      ...updatedBooking,
      message: 'Booking confirmed successfully',
    };
  }

  async cancel(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Both renter and owner can cancel
    const isOwner = booking.listing.ownerId === userId;
    const isRenter = booking.renterId === userId;

    if (!isOwner && !isRenter) {
      throw new ForbiddenException('You do not have permission to cancel this booking');
    }

    // Cannot cancel completed or disputed bookings
    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.DISPUTED
    ) {
      throw new BadRequestException(`Cannot cancel ${booking.status.toLowerCase()} bookings`);
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
      include: {
        listing: {
          select: {
            title: true,
          },
        },
      },
    });

    return {
      ...updatedBooking,
      message: 'Booking cancelled successfully',
    };
  }

  async complete(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Only owner can mark as complete
    if (booking.listing.ownerId !== userId) {
      throw new ForbiddenException('Only the listing owner can complete bookings');
    }

    if (booking.status !== BookingStatus.ACTIVE) {
      throw new BadRequestException('Only active bookings can be completed');
    }

    // Check if booking end date has passed
    const now = new Date();
    if (booking.endDate > now) {
      throw new BadRequestException('Cannot complete booking before end date');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.COMPLETED },
      include: {
        listing: {
          select: {
            title: true,
          },
        },
        renter: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      ...updatedBooking,
      message: 'Booking completed successfully',
    };
  }

  // Helper methods

  private validateDates(startDate: Date, endDate: Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (start < now) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    if (end <= start) {
      throw new BadRequestException('End date must be after start date');
    }

    // Minimum 1 day booking
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 1) {
      throw new BadRequestException('Booking must be at least 1 day');
    }

    // Maximum booking duration (e.g., 90 days)
    const maxDays = 90;
    if (daysDiff > maxDays) {
      throw new BadRequestException(`Booking cannot exceed ${maxDays} days`);
    }
  }

  private calculatePrice(startDate: Date, endDate: Date, pricePerDay: number) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const numberOfDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = numberOfDays * pricePerDay;

    return { totalPrice, numberOfDays };
  }

  private async hasOverlappingBookings(
    listingId: string,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string,
  ): Promise<boolean> {
    const where: any = {
      listingId,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ACTIVE],
      },
      OR: [
        {
          // New booking starts within existing booking
          AND: [{ startDate: { lte: startDate } }, { endDate: { gt: startDate } }],
        },
        {
          // New booking ends within existing booking
          AND: [{ startDate: { lt: endDate } }, { endDate: { gte: endDate } }],
        },
        {
          // New booking completely encompasses existing booking
          AND: [{ startDate: { gte: startDate } }, { endDate: { lte: endDate } }],
        },
      ],
    };

    if (excludeBookingId) {
      where.id = { not: excludeBookingId };
    }

    const overlapping = await this.prisma.booking.findFirst({
      where,
    });

    return !!overlapping;
  }

  private validateStatusTransition(
    currentStatus: BookingStatus,
    newStatus: BookingStatus,
    isOwner: boolean,
  ) {
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
      [BookingStatus.CONFIRMED]: [BookingStatus.ACTIVE, BookingStatus.CANCELLED],
      [BookingStatus.ACTIVE]: [BookingStatus.COMPLETED, BookingStatus.DISPUTED],
      [BookingStatus.COMPLETED]: [], // Cannot transition from completed
      [BookingStatus.CANCELLED]: [], // Cannot transition from cancelled
      [BookingStatus.DISPUTED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
    };

    const allowed = validTransitions[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }

    // Additional permission checks
    if (newStatus === BookingStatus.CONFIRMED && !isOwner) {
      throw new ForbiddenException('Only the listing owner can confirm bookings');
    }

    if (newStatus === BookingStatus.COMPLETED && !isOwner) {
      throw new ForbiddenException('Only the listing owner can complete bookings');
    }
  }
}
