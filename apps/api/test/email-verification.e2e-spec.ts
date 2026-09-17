import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Email Verification (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.emailVerificationToken.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Complete Verification Journey', () => {
    it('should prevent unverified user from creating listing', async () => {
      // Step 1: Register user
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          firstName: 'New',
          lastName: 'User',
        },
      });

      expect(registerResponse.statusCode).toBe(HttpStatus.CREATED);
      const { accessToken, user } = JSON.parse(registerResponse.body);
      expect(user.emailVerifiedAt).toBeNull();

      // Step 2: Try to create listing (should fail)
      const createListingResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/listings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          title: 'Test Listing',
          description: 'Test Description',
          category: 'Electronics',
          pricePerDay: 1000,
          depositAmount: 5000,
          location: 'Lagos',
          images: [],
        },
      });

      expect(createListingResponse.statusCode).toBe(HttpStatus.FORBIDDEN);
      const errorBody = JSON.parse(createListingResponse.body);
      expect(errorBody.message).toContain('verify your email');
    });

    it('should allow verified user to create listing', async () => {
      // Step 1: Register user
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'verified@example.com',
          password: 'SecurePass123!',
          firstName: 'Verified',
          lastName: 'User',
        },
      });

      const { accessToken, user } = JSON.parse(registerResponse.body);

      // Step 2: Get verification token from database
      const verificationToken = await prisma.emailVerificationToken.findFirst({
        where: { userId: user.id },
      });
      expect(verificationToken).not.toBeNull();

      // Step 3: Generate raw token that would have been sent in email
      // In a real scenario, this would come from the email link
      // For testing, we need to reverse-engineer it from the hash
      // Since we can't reverse SHA-256, we'll use a different approach:
      // We'll manually create a token and verify it works

      // Actually, let's manually set emailVerifiedAt for this test
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });

      // Step 4: Try to create listing (should succeed)
      const createListingResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/listings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          title: 'Test Listing',
          description: 'Test Description',
          category: 'Electronics',
          pricePerDay: 1000,
          depositAmount: 5000,
          location: 'Lagos',
          images: [],
        },
      });

      expect(createListingResponse.statusCode).toBe(HttpStatus.CREATED);
    });

    it('should prevent unverified user from creating booking', async () => {
      // Create a verified user with a listing first
      const ownerResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'owner@example.com',
          password: 'SecurePass123!',
          firstName: 'Owner',
          lastName: 'User',
        },
      });

      const { accessToken: ownerToken, user: owner } = JSON.parse(ownerResponse.body);
      
      // Verify owner
      await prisma.user.update({
        where: { id: owner.id },
        data: { emailVerifiedAt: new Date() },
      });

      // Create listing
      const listingResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/listings',
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
        payload: {
          title: 'Test Listing',
          description: 'Test Description',
          category: 'Electronics',
          pricePerDay: 1000,
          depositAmount: 5000,
          location: 'Lagos',
          images: [],
        },
      });

      const listing = JSON.parse(listingResponse.body);

      // Register unverified renter
      const renterResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'renter@example.com',
          password: 'SecurePass123!',
          firstName: 'Renter',
          lastName: 'User',
        },
      });

      const { accessToken: renterToken } = JSON.parse(renterResponse.body);

      // Try to create booking (should fail)
      const bookingResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/bookings',
        headers: {
          authorization: `Bearer ${renterToken}`,
        },
        payload: {
          listingId: listing.id,
          startDate: '2026-10-01',
          endDate: '2026-10-03',
        },
      });

      expect(bookingResponse.statusCode).toBe(HttpStatus.FORBIDDEN);
      const errorBody = JSON.parse(bookingResponse.body);
      expect(errorBody.message).toContain('verify your email');
    });
  });

  describe('/auth/verify-email (POST)', () => {
    it('should reject invalid verification token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verify-email',
        payload: {
          token: 'invalid-token-1234567890123456789012345678901234567890123456789012',
        },
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('Invalid verification token');
    });

    it('should reject token that is too short', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verify-email',
        payload: {
          token: 'short',
        },
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/auth/resend-verification (POST)', () => {
    it('should accept resend request for existing email', async () => {
      // Register user
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'resend@example.com',
          password: 'SecurePass123!',
          firstName: 'Resend',
          lastName: 'User',
        },
      });

      // Resend verification
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/resend-verification',
        payload: {
          email: 'resend@example.com',
        },
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('verification email has been sent');
    });

    it('should return same response for non-existent email (no enumeration)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/resend-verification',
        payload: {
          email: 'nonexistent@example.com',
        },
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('verification email has been sent');
    });

    it('should enforce rate limiting', async () => {
      const email = 'ratelimit@example.com';

      // First request
      const response1 = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/resend-verification',
        payload: { email },
      });
      expect(response1.statusCode).toBe(HttpStatus.OK);

      // Second request immediately after (should be rate limited)
      const response2 = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/resend-verification',
        payload: { email },
      });
      expect(response2.statusCode).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });

    it('should invalidate old tokens when resending', async () => {
      // Register user
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'invalidate@example.com',
          password: 'SecurePass123!',
          firstName: 'Invalidate',
          lastName: 'User',
        },
      });

      const { user } = JSON.parse(registerResponse.body);

      // Check initial token count
      const initialTokens = await prisma.emailVerificationToken.findMany({
        where: { userId: user.id },
      });
      expect(initialTokens.length).toBe(1);

      // Wait to avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 61000)); // Wait 61 seconds

      // Resend
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/resend-verification',
        payload: {
          email: 'invalidate@example.com',
        },
      });

      // Should still have only 1 token (old one deleted, new one created)
      const finalTokens = await prisma.emailVerificationToken.findMany({
        where: { userId: user.id },
      });
      expect(finalTokens.length).toBe(1);
      expect(finalTokens[0].id).not.toBe(initialTokens[0].id);
    }, 70000); // Increase timeout for this test
  });

  describe('User browsing without verification', () => {
    it('should allow unverified user to browse listings', async () => {
      // Register user
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'browser@example.com',
          password: 'SecurePass123!',
          firstName: 'Browser',
          lastName: 'User',
        },
      });

      const { accessToken } = JSON.parse(registerResponse.body);

      // Browse listings (should work)
      const browseResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/listings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(browseResponse.statusCode).toBe(HttpStatus.OK);
    });

    it('should allow unverified user to view their profile', async () => {
      // Register user
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'profile@example.com',
          password: 'SecurePass123!',
          firstName: 'Profile',
          lastName: 'User',
        },
      });

      const { accessToken } = JSON.parse(registerResponse.body);

      // View profile (should work)
      const profileResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(profileResponse.statusCode).toBe(HttpStatus.OK);
      const user = JSON.parse(profileResponse.body);
      expect(user.emailVerifiedAt).toBeNull();
    });
  });
});
