import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AvailabilityBlocks (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let listingId: string;
  let blockId: string;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(0, 0, 0, 0);

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
    await prisma.availabilityBlock.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    // Register a user and create a listing
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'availability-test@example.com',
        password: 'password123',
        firstName: 'Availability',
        lastName: 'Test',
      },
    });

    const { accessToken, user } = JSON.parse(registerResponse.body);
    authToken = accessToken;
    userId = user.id;

    // Create a listing
    const listing = await prisma.listing.create({
      data: {
        title: 'Test Listing for Availability',
        description: 'This listing is used to test availability blocks functionality',
        category: 'Test',
        pricePerDay: 50,
        depositAmount: 200,
        status: 'PUBLISHED',
        images: ['test.jpg'],
        location: 'Test Location',
        ownerId: userId,
      },
    });

    listingId = listing.id;
  });

  describe('/listings/:listingId/availability-blocks (POST)', () => {
    it('should create an availability block', async () => {
      const createDto = {
        startDate: tomorrow.toISOString(),
        endDate: nextWeek.toISOString(),
        isBlocked: true,
      };

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/listings/${listingId}/availability-blocks`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: createDto,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('id');
      expect(body.listingId).toBe(listingId);
      expect(body.isBlocked).toBe(true);

      blockId = body.id;
    });

    it('should reject block creation without authentication', async () => {
      const createDto = {
        startDate: tomorrow.toISOString(),
        endDate: nextWeek.toISOString(),
      };

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/listings/${listingId}/availability-blocks`,
        payload: createDto,
      });

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should reject block with end date before start date', async () => {
      const createDto = {
        startDate: nextWeek.toISOString(),
        endDate: tomorrow.toISOString(),
      };

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/listings/${listingId}/availability-blocks`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: createDto,
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should reject overlapping blocks', async () => {
      // Create first block
      await prisma.availabilityBlock.create({
        data: {
          listingId,
          startDate: tomorrow,
          endDate: nextWeek,
          isBlocked: true,
        },
      });

      // Try to create overlapping block
      const createDto = {
        startDate: tomorrow.toISOString(),
        endDate: nextWeek.toISOString(),
      };

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/listings/${listingId}/availability-blocks`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: createDto,
      });

      expect(response.statusCode).toBe(HttpStatus.CONFLICT);
    });

    it('should reject block creation for non-owner', async () => {
      // Register another user
      const otherUserResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'other@example.com',
          password: 'password123',
          firstName: 'Other',
          lastName: 'User',
        },
      });

      const { accessToken: otherToken } = JSON.parse(otherUserResponse.body);

      const createDto = {
        startDate: tomorrow.toISOString(),
        endDate: nextWeek.toISOString(),
      };

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/listings/${listingId}/availability-blocks`,
        headers: {
          authorization: `Bearer ${otherToken}`,
        },
        payload: createDto,
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('/listings/:listingId/availability-blocks (GET)', () => {
    beforeEach(async () => {
      // Create some test blocks
      await prisma.availabilityBlock.createMany({
        data: [
          {
            listingId,
            startDate: tomorrow,
            endDate: nextWeek,
            isBlocked: true,
          },
          {
            listingId,
            startDate: new Date(tomorrow.getTime() + 10 * 24 * 60 * 60 * 1000),
            endDate: new Date(nextWeek.getTime() + 10 * 24 * 60 * 60 * 1000),
            isBlocked: false,
          },
        ],
      });
    });

    it('should return all availability blocks for a listing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/listings/${listingId}/availability-blocks`,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter blocks by date range', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/listings/${listingId}/availability-blocks?startDate=${tomorrow.toISOString()}&endDate=${nextWeek.toISOString()}`,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
    });
  });

  describe('/listings/:listingId/availability-blocks/check (POST)', () => {
    beforeEach(async () => {
      // Create a blocked period
      await prisma.availabilityBlock.create({
        data: {
          listingId,
          startDate: tomorrow,
          endDate: nextWeek,
          isBlocked: true,
        },
      });
    });

    it('should check availability and return unavailable for blocked period', async () => {
      const checkDto = {
        startDate: tomorrow.toISOString(),
        endDate: nextWeek.toISOString(),
      };

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/listings/${listingId}/availability-blocks/check`,
        payload: checkDto,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(body.isAvailable).toBe(false);
      expect(body.blockedPeriods).toHaveLength(1);
    });

    it('should return available for non-blocked period', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const farFutureDate = new Date();
      farFutureDate.setDate(farFutureDate.getDate() + 37);

      const checkDto = {
        startDate: futureDate.toISOString(),
        endDate: farFutureDate.toISOString(),
      };

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/listings/${listingId}/availability-blocks/check`,
        payload: checkDto,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(body.isAvailable).toBe(true);
      expect(body.blockedPeriods).toHaveLength(0);
    });
  });

  describe('/listings/:listingId/availability-blocks/:id (GET)', () => {
    beforeEach(async () => {
      const block = await prisma.availabilityBlock.create({
        data: {
          listingId,
          startDate: tomorrow,
          endDate: nextWeek,
          isBlocked: true,
        },
      });
      blockId = block.id;
    });

    it('should return a single availability block', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/listings/${listingId}/availability-blocks/${blockId}`,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(blockId);
      expect(body.listingId).toBe(listingId);
    });

    it('should return 404 for non-existent block', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/listings/${listingId}/availability-blocks/non-existent-id`,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('/listings/:listingId/availability-blocks/:id (PATCH)', () => {
    beforeEach(async () => {
      const block = await prisma.availabilityBlock.create({
        data: {
          listingId,
          startDate: tomorrow,
          endDate: nextWeek,
          isBlocked: true,
        },
      });
      blockId = block.id;
    });

    it('should update an availability block', async () => {
      const updateDto = {
        isBlocked: false,
      };

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/listings/${listingId}/availability-blocks/${blockId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: updateDto,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(body.isBlocked).toBe(false);
    });

    it('should reject update from non-owner', async () => {
      // Register another user
      const otherUserResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'other2@example.com',
          password: 'password123',
          firstName: 'Other',
          lastName: 'User',
        },
      });

      const { accessToken: otherToken } = JSON.parse(otherUserResponse.body);

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/listings/${listingId}/availability-blocks/${blockId}`,
        headers: {
          authorization: `Bearer ${otherToken}`,
        },
        payload: { isBlocked: false },
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('/listings/:listingId/availability-blocks/:id (DELETE)', () => {
    beforeEach(async () => {
      const block = await prisma.availabilityBlock.create({
        data: {
          listingId,
          startDate: tomorrow,
          endDate: nextWeek,
          isBlocked: true,
        },
      });
      blockId = block.id;
    });

    it('should delete an availability block', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/listings/${listingId}/availability-blocks/${blockId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(HttpStatus.NO_CONTENT);

      // Verify deletion
      const block = await prisma.availabilityBlock.findUnique({
        where: { id: blockId },
      });
      expect(block).toBeNull();
    });

    it('should reject delete from non-owner', async () => {
      // Register another user
      const otherUserResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'other3@example.com',
          password: 'password123',
          firstName: 'Other',
          lastName: 'User',
        },
      });

      const { accessToken: otherToken } = JSON.parse(otherUserResponse.body);

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/listings/${listingId}/availability-blocks/${blockId}`,
        headers: {
          authorization: `Bearer ${otherToken}`,
        },
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
