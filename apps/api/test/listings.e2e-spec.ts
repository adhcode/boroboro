import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Listings (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let listingId: string;

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
    await prisma.listing.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    // Register a user and get auth token
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'listing-owner@example.com',
        password: 'password123',
        firstName: 'Listing',
        lastName: 'Owner',
      },
    });

    const { accessToken, user } = JSON.parse(registerResponse.body);
    authToken = accessToken;
    userId = user.id;
  });

  describe('/listings (POST)', () => {
    it('should create a new listing', async () => {
      const createDto = {
        title: 'Professional Camera Equipment',
        description:
          'High-quality DSLR camera with multiple lenses perfect for professional photography',
        category: 'Photography',
        pricePerDay: 50,
        depositAmount: 200,
        images: ['camera1.jpg', 'camera2.jpg'],
        location: 'Lagos, Nigeria',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/listings',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: createDto,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('id');
      expect(body.title).toBe(createDto.title);
      expect(body.ownerId).toBe(userId);
      expect(body.status).toBe('DRAFT');

      listingId = body.id;
    });

    it('should reject listing without authentication', async () => {
      const createDto = {
        title: 'Professional Camera Equipment',
        description: 'High-quality DSLR camera',
        category: 'Photography',
        pricePerDay: 50,
        depositAmount: 200,
        images: ['camera1.jpg'],
        location: 'Lagos, Nigeria',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/listings',
        payload: createDto,
      });

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should reject listing with invalid data', async () => {
      const createDto = {
        title: 'Short', // Too short
        description: 'Too short description',
        category: 'Photography',
        pricePerDay: -10, // Negative price
        depositAmount: 200,
        images: [],
        location: 'Lagos, Nigeria',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/listings',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: createDto,
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/listings (GET)', () => {
    beforeEach(async () => {
      // Create some test listings
      await prisma.listing.createMany({
        data: [
          {
            title: 'Camera Equipment',
            description: 'Professional DSLR camera with lenses for photography enthusiasts',
            category: 'Photography',
            pricePerDay: 50,
            depositAmount: 200,
            status: 'PUBLISHED',
            images: ['camera.jpg'],
            location: 'Lagos, Nigeria',
            ownerId: userId,
          },
          {
            title: 'Power Tools Set',
            description: 'Complete set of power tools including drill, saw, and sanders',
            category: 'Tools',
            pricePerDay: 30,
            depositAmount: 100,
            status: 'PUBLISHED',
            images: ['tools.jpg'],
            location: 'Abuja, Nigeria',
            ownerId: userId,
          },
          {
            title: 'Draft Listing',
            description: 'This is a draft listing that should not appear in public search',
            category: 'Other',
            pricePerDay: 20,
            depositAmount: 50,
            status: 'DRAFT',
            images: ['draft.jpg'],
            location: 'Lagos, Nigeria',
            ownerId: userId,
          },
        ],
      });
    });

    it('should return published listings', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/listings',
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('listings');
      expect(body).toHaveProperty('pagination');
      expect(body.listings).toHaveLength(2); // Only published listings
    });

    it('should filter by category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/listings?category=Photography',
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(body.listings).toHaveLength(1);
      expect(body.listings[0].category).toBe('Photography');
    });

    it('should filter by price range', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/listings?minPrice=40&maxPrice=60',
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(body.listings).toHaveLength(1);
      expect(body.listings[0].pricePerDay).toBe(50);
    });

    it('should search by text', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/listings?search=camera',
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(body.listings.length).toBeGreaterThan(0);
    });
  });

  describe('/listings/my-listings (GET)', () => {
    beforeEach(async () => {
      await prisma.listing.createMany({
        data: [
          {
            title: 'Published Listing',
            description: 'This is a published listing for my account view test',
            category: 'Test',
            pricePerDay: 25,
            depositAmount: 75,
            status: 'PUBLISHED',
            images: ['pub.jpg'],
            location: 'Lagos, Nigeria',
            ownerId: userId,
          },
          {
            title: 'Draft Listing',
            description: 'This is a draft listing for my account view test only',
            category: 'Test',
            pricePerDay: 20,
            depositAmount: 50,
            status: 'DRAFT',
            images: ['draft.jpg'],
            location: 'Lagos, Nigeria',
            ownerId: userId,
          },
        ],
      });
    });

    it('should return all user listings including drafts', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/listings/my-listings',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(2); // Both draft and published
    });

    it('should filter by status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/listings/my-listings?status=DRAFT',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(1);
      expect(body[0].status).toBe('DRAFT');
    });
  });

  describe('/listings/:id (GET)', () => {
    beforeEach(async () => {
      const listing = await prisma.listing.create({
        data: {
          title: 'Camera Equipment',
          description: 'Professional DSLR camera with lenses for rent in Lagos',
          category: 'Photography',
          pricePerDay: 50,
          depositAmount: 200,
          status: 'PUBLISHED',
          images: ['camera.jpg'],
          location: 'Lagos, Nigeria',
          ownerId: userId,
        },
      });
      listingId = listing.id;
    });

    it('should return a single listing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/listings/${listingId}`,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(listingId);
      expect(body).toHaveProperty('owner');
    });

    it('should return 404 for non-existent listing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/listings/non-existent-id',
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('/listings/:id (PATCH)', () => {
    beforeEach(async () => {
      const listing = await prisma.listing.create({
        data: {
          title: 'Camera Equipment',
          description: 'Professional DSLR camera with lenses',
          category: 'Photography',
          pricePerDay: 50,
          depositAmount: 200,
          status: 'DRAFT',
          images: ['camera.jpg'],
          location: 'Lagos, Nigeria',
          ownerId: userId,
        },
      });
      listingId = listing.id;
    });

    it('should update a listing', async () => {
      const updateDto = {
        title: 'Updated Camera Equipment',
        pricePerDay: 55,
      };

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/listings/${listingId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: updateDto,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(body.title).toBe(updateDto.title);
      expect(body.pricePerDay).toBe(updateDto.pricePerDay);
    });

    it('should reject update from non-owner', async () => {
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

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/listings/${listingId}`,
        headers: {
          authorization: `Bearer ${otherToken}`,
        },
        payload: { title: 'Hacked Title' },
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('/listings/:id/status (PATCH)', () => {
    beforeEach(async () => {
      const listing = await prisma.listing.create({
        data: {
          title: 'Camera Equipment',
          description: 'Professional DSLR camera with lenses',
          category: 'Photography',
          pricePerDay: 50,
          depositAmount: 200,
          status: 'DRAFT',
          images: ['camera.jpg'],
          location: 'Lagos, Nigeria',
          ownerId: userId,
        },
      });
      listingId = listing.id;
    });

    it('should update listing status', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/listings/${listingId}/status`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { status: 'PUBLISHED' },
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('PUBLISHED');
    });
  });

  describe('/listings/:id (DELETE)', () => {
    beforeEach(async () => {
      const listing = await prisma.listing.create({
        data: {
          title: 'Camera Equipment',
          description: 'Professional DSLR camera with lenses',
          category: 'Photography',
          pricePerDay: 50,
          depositAmount: 200,
          status: 'DRAFT',
          images: ['camera.jpg'],
          location: 'Lagos, Nigeria',
          ownerId: userId,
        },
      });
      listingId = listing.id;
    });

    it('should delete a listing without bookings', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/listings/${listingId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(HttpStatus.NO_CONTENT);

      // Verify deletion
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
      });
      expect(listing).toBeNull();
    });

    it('should reject delete from non-owner', async () => {
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

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/listings/${listingId}`,
        headers: {
          authorization: `Bearer ${otherToken}`,
        },
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
