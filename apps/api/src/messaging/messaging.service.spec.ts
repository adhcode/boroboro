import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { MessagingService } from './messaging.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MessagingService', () => {
  let service: MessagingService;
  let prismaService: PrismaService;

  const mockBooking = {
    id: 'booking1',
    renterId: 'renter1',
    listing: {
      ownerId: 'owner1',
    },
  };

  const mockMessage = {
    id: 'message1',
    bookingId: 'booking1',
    senderId: 'renter1',
    receiverId: 'owner1',
    content: 'Hello, is the camera still available?',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        {
          provide: PrismaService,
          useValue: {
            booking: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            message: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a message from renter to owner', async () => {
      const createDto = {
        content: 'Hello, is the camera still available?',
      };

      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue(mockBooking as any);
      jest.spyOn(prismaService.message, 'create').mockResolvedValue({
        ...mockMessage,
        sender: { id: 'renter1', firstName: 'Renter', lastName: 'User' },
        receiver: { id: 'owner1', firstName: 'Owner', lastName: 'User' },
      } as any);

      const result = await service.create('booking1', 'renter1', createDto);

      expect(result).toBeDefined();
      expect(result.content).toBe(createDto.content);
      expect(result.senderId).toBe('renter1');
      expect(result.receiverId).toBe('owner1');
    });

    it('should create a message from owner to renter', async () => {
      const createDto = {
        content: 'Yes, it is available!',
      };

      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue(mockBooking as any);
      jest.spyOn(prismaService.message, 'create').mockResolvedValue({
        ...mockMessage,
        senderId: 'owner1',
        receiverId: 'renter1',
        content: createDto.content,
        sender: { id: 'owner1', firstName: 'Owner', lastName: 'User' },
        receiver: { id: 'renter1', firstName: 'Renter', lastName: 'User' },
      } as any);

      const result = await service.create('booking1', 'owner1', createDto);

      expect(result).toBeDefined();
      expect(result.senderId).toBe('owner1');
      expect(result.receiverId).toBe('renter1');
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue(null);

      await expect(
        service.create('booking1', 'renter1', { content: 'Hello' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if sender is not a participant', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue(mockBooking as any);

      await expect(
        service.create('booking1', 'other-user', { content: 'Hello' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return messages for a booking', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue(mockBooking as any);
      jest.spyOn(prismaService.message, 'findMany').mockResolvedValue([mockMessage] as any);
      jest.spyOn(prismaService.message, 'count').mockResolvedValue(1);

      const result = await service.findAll('booking1', 'renter1', 50, 0);

      expect(result).toHaveProperty('messages');
      expect(result).toHaveProperty('pagination');
      expect(result.messages).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue(mockBooking as any);

      await expect(service.findAll('booking1', 'other-user', 50, 0)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue(null);

      await expect(service.findAll('booking1', 'renter1', 50, 0)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread message count', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue(mockBooking as any);
      jest.spyOn(prismaService.message, 'count').mockResolvedValue(3);

      const result = await service.getUnreadCount('booking1', 'renter1');

      expect(result.unreadCount).toBe(3);
      expect(result.bookingId).toBe('booking1');
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      jest.spyOn(prismaService.booking, 'findUnique').mockResolvedValue(mockBooking as any);

      await expect(service.getUnreadCount('booking1', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getUserConversations', () => {
    it('should return all conversations for a user', async () => {
      const mockBookings = [
        {
          id: 'booking1',
          renterId: 'renter1',
          status: 'CONFIRMED',
          updatedAt: new Date(),
          listing: {
            id: 'listing1',
            title: 'Camera Equipment',
            images: ['camera.jpg'],
            ownerId: 'owner1',
            owner: {
              id: 'owner1',
              firstName: 'Owner',
              lastName: 'User',
            },
          },
          renter: {
            id: 'renter1',
            firstName: 'Renter',
            lastName: 'User',
          },
          messages: [mockMessage],
          _count: {
            messages: 5,
          },
        },
      ];

      jest.spyOn(prismaService.booking, 'findMany').mockResolvedValue(mockBookings as any);

      const result = await service.getUserConversations('renter1');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('bookingId');
      expect(result[0]).toHaveProperty('otherParticipant');
      expect(result[0]).toHaveProperty('lastMessage');
      expect(result[0].messageCount).toBe(5);
    });
  });
});
