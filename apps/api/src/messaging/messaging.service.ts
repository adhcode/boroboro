import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(bookingId: string, senderId: string, createDto: CreateMessageDto) {
    // Get booking with participants
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    // Verify sender is a participant (renter or owner)
    const isRenter = booking.renterId === senderId;
    const isOwner = booking.listing.ownerId === senderId;

    if (!isRenter && !isOwner) {
      throw new ForbiddenException('You are not a participant in this booking');
    }

    // Determine receiver
    const receiverId = isRenter ? booking.listing.ownerId : booking.renterId;

    // Create message
    const message = await this.prisma.message.create({
      data: {
        bookingId,
        senderId,
        receiverId,
        content: createDto.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return message;
  }

  async findAll(bookingId: string, userId: string, limit = 50, offset = 0) {
    // Verify user is a participant
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    const isRenter = booking.renterId === userId;
    const isOwner = booking.listing.ownerId === userId;

    if (!isRenter && !isOwner) {
      throw new ForbiddenException('You are not a participant in this booking');
    }

    // Get messages
    const messages = await this.prisma.message.findMany({
      where: { bookingId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.message.count({
      where: { bookingId },
    });

    return {
      messages,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async getUnreadCount(bookingId: string, userId: string) {
    // Verify user is a participant
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    const isRenter = booking.renterId === userId;
    const isOwner = booking.listing.ownerId === userId;

    if (!isRenter && !isOwner) {
      throw new ForbiddenException('You are not a participant in this booking');
    }

    // Count unread messages (messages sent to this user)
    // Note: In production, you'd track read status in a separate field
    // For now, we'll just return a simple count
    const unreadCount = await this.prisma.message.count({
      where: {
        bookingId,
        receiverId: userId,
      },
    });

    return {
      bookingId,
      unreadCount,
    };
  }

  /**
   * Get all conversations for a user (grouped by booking)
   */
  async getUserConversations(userId: string) {
    // Get all bookings where user is renter or owner
    const bookings = await this.prisma.booking.findMany({
      where: {
        OR: [
          { renterId: userId },
          { listing: { ownerId: userId } },
        ],
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            images: true,
            ownerId: true,
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
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Format conversations
    const conversations = bookings.map((booking) => {
      const isOwner = booking.listing.ownerId === userId;
      const otherParticipant = isOwner ? booking.renter : booking.listing.owner;
      const lastMessage = booking.messages[0] || null;

      return {
        bookingId: booking.id,
        listingTitle: booking.listing.title,
        listingImage: booking.listing.images[0] || null,
        otherParticipant: {
          id: otherParticipant.id,
          firstName: otherParticipant.firstName,
          lastName: otherParticipant.lastName,
        },
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.senderId,
            }
          : null,
        messageCount: booking._count.messages,
        bookingStatus: booking.status,
      };
    });

    return conversations;
  }
}
