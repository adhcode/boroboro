import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
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
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: registerDto,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(body.user.email).toBe(registerDto.email);
    });

    it('should reject registration with duplicate email', async () => {
      const registerDto = {
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      // First registration
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: registerDto,
      });

      // Second registration with same email
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: registerDto,
      });

      expect(response.statusCode).toBe(HttpStatus.CONFLICT);
    });

    it('should reject registration with invalid email', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: registerDto,
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a test user
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'login@example.com',
          password: 'password123',
          firstName: 'Login',
          lastName: 'User',
        },
      });
    });

    it('should login with valid credentials', async () => {
      const loginDto = {
        email: 'login@example.com',
        password: 'password123',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: loginDto,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
    });

    it('should reject login with invalid password', async () => {
      const loginDto = {
        email: 'login@example.com',
        password: 'wrongpassword',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: loginDto,
      });

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/users/me (GET)', () => {
    it('should get current user profile with valid token', async () => {
      // Register and get token
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'profile@example.com',
          password: 'password123',
          firstName: 'Profile',
          lastName: 'User',
        },
      });

      const { accessToken } = JSON.parse(registerResponse.body);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.body);
      expect(body.email).toBe('profile@example.com');
      expect(body).not.toHaveProperty('passwordHash');
    });

    it('should reject request without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
      });

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
