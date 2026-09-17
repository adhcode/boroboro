import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';

describe('AuthService - Email Verification', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let emailService: EmailService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    emailVerifiedAt: null,
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    },
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_ACCESS_SECRET: 'test-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);

    jest.clearAllMocks();
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const verificationToken = {
        id: 'token-123',
        userId: 'user-123',
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        user: mockUser,
      };

      mockPrismaService.emailVerificationToken.findUnique.mockResolvedValue(verificationToken);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        emailVerifiedAt: new Date(),
      });
      mockPrismaService.emailVerificationToken.delete.mockResolvedValue(verificationToken);

      const result = await service.verifyEmail(rawToken);

      expect(result).toEqual({ message: 'Email verified successfully' });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { emailVerifiedAt: expect.any(Date) },
      });
      expect(mockPrismaService.emailVerificationToken.delete).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockPrismaService.emailVerificationToken.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(BadRequestException);
      await expect(service.verifyEmail('invalid-token')).rejects.toThrow('Invalid verification token');
    });

    it('should throw BadRequestException for expired token', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const expiredToken = {
        id: 'token-123',
        userId: 'user-123',
        tokenHash,
        expiresAt: new Date(Date.now() - 1000), // Expired
        createdAt: new Date(),
        user: mockUser,
      };

      mockPrismaService.emailVerificationToken.findUnique.mockResolvedValue(expiredToken);
      mockPrismaService.emailVerificationToken.delete.mockResolvedValue(expiredToken);

      await expect(service.verifyEmail(rawToken)).rejects.toThrow(BadRequestException);
      await expect(service.verifyEmail(rawToken)).rejects.toThrow('Verification token has expired');
      expect(mockPrismaService.emailVerificationToken.delete).toHaveBeenCalled();
    });

    it('should delete used token after verification', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const verificationToken = {
        id: 'token-123',
        userId: 'user-123',
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        user: mockUser,
      };

      mockPrismaService.emailVerificationToken.findUnique.mockResolvedValue(verificationToken);
      mockPrismaService.user.update.mockResolvedValue({});
      mockPrismaService.emailVerificationToken.delete.mockResolvedValue({});

      await service.verifyEmail(rawToken);

      expect(mockPrismaService.emailVerificationToken.delete).toHaveBeenCalledWith({
        where: { id: 'token-123' },
      });
    });
  });

  describe('resendVerificationEmail', () => {
    it('should send verification email for unverified user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockPrismaService.emailVerificationToken.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.emailVerificationToken.create.mockResolvedValue({});

      const result = await service.resendVerificationEmail('test@example.com');

      expect(result.message).toContain('verification email has been sent');
      expect(mockPrismaService.emailVerificationToken.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.emailVerificationToken.create).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should not send email for already verified user', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        emailVerifiedAt: new Date(),
      });

      const result = await service.resendVerificationEmail('test@example.com');

      expect(result.message).toContain('verification email has been sent');
      expect(mockPrismaService.emailVerificationToken.create).not.toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should not reveal if email exists (always return success)', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.resendVerificationEmail('nonexistent@example.com');

      expect(result.message).toContain('verification email has been sent');
      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should invalidate existing tokens before creating new one', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockPrismaService.emailVerificationToken.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaService.emailVerificationToken.create.mockResolvedValue({});

      await service.resendVerificationEmail('test@example.com');

      expect(mockPrismaService.emailVerificationToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          expiresAt: { gt: expect.any(Date) },
        },
      });
    });
  });

  describe('token generation', () => {
    it('should hash tokens before storage', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockPrismaService.emailVerificationToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.emailVerificationToken.create.mockResolvedValue({});

      await service.resendVerificationEmail('test@example.com');

      const createCall = mockPrismaService.emailVerificationToken.create.mock.calls[0][0];
      
      // Token hash should be 64 characters (SHA-256 hex)
      expect(createCall.data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
      
      // Should have 24-hour expiry
      const now = new Date();
      const expiresAt = new Date(createCall.data.expiresAt);
      const hoursDiff = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBeGreaterThan(23);
      expect(hoursDiff).toBeLessThan(25);
    });

    it('should never store raw token', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockPrismaService.emailVerificationToken.create.mockResolvedValue({});

      await service.resendVerificationEmail('test@example.com');

      // The raw token sent in email should not match what's stored
      const emailCall = mockEmailService.sendVerificationEmail.mock.calls[0];
      const rawToken = emailCall[1]; // Second argument is the token
      
      const createCall = mockPrismaService.emailVerificationToken.create.mock.calls[0][0];
      const storedHash = createCall.data.tokenHash;

      expect(rawToken).not.toBe(storedHash);
      expect(rawToken).toHaveLength(64); // Raw token is 64 hex chars
      expect(storedHash).toHaveLength(64); // Hash is also 64 hex chars
    });
  });
});
