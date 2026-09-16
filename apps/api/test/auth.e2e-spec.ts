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
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
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
      expect(body.user).not.toHaveProperty('passwordHash');
      expect(body.user).not.toHaveProperty('password');
    });

    it('should normalize email to lowercase', async () => {
      const registerDto = {
        email: 'Test@EXAMPLE.com',
        password: 'SecurePass123!',
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
      expect(body.user.email).toBe('test@example.com');
    });

    it('should reject registration with duplicate email (case-insensitive)', async () => {
      const registerDto = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      // First registration
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: registerDto,
      });

      // Second registration with same email but different case
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { ...registerDto, email: 'Duplicate@EXAMPLE.COM' },
      });

      expect(response.statusCode).toBe(HttpStatus.CONFLICT);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('User with this email already exists');
    });

    it('should reject registration with invalid email', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'SecurePass123!',
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

    it('should reject registration with password less than 8 characters', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'short',
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

    it('should not store password in plaintext', async () => {
      const registerDto = {
        email: 'plaintext@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: registerDto,
      });

      // Check database directly
      const user = await prisma.user.findUnique({
        where: { email: registerDto.email },
      });

      expect(user.passwordHash).not.toBe(registerDto.password);
      expect(user.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });
  });

  describe('/auth/login (POST)', () => {
    const testPassword = 'SecurePass123!';

    beforeEach(async () => {
      // Create a test user
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'login@example.com',
          password: testPassword,
          firstName: 'Login',
          lastName: 'User',
        },
      });
    });

    it('should login with valid credentials', async () => {
      const loginDto = {
        email: 'login@example.com',
        password: testPassword,
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
      expect(body.user).not.toHaveProperty('passwordHash');
      expect(body.user).not.toHaveProperty('password');
    });

    it('should login with email case-insensitive', async () => {
      const loginDto = {
        email: 'Login@EXAMPLE.COM',
        password: testPassword,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: loginDto,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
    });

    it('should reject login with wrong password', async () => {
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
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: testPassword,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: loginDto,
      });

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Invalid credentials');
    });

    it('should return same error message for wrong password and non-existent email', async () => {
      // Wrong password
      const wrongPasswordResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'login@example.com',
          password: 'wrongpassword',
        },
      });

      // Non-existent email
      const nonExistentResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: testPassword,
        },
      });

      const wrongPasswordBody = JSON.parse(wrongPasswordResponse.body);
      const nonExistentBody = JSON.parse(nonExistentResponse.body);

      expect(wrongPasswordBody.message).toBe(nonExistentBody.message);
      expect(wrongPasswordBody.message).toBe('Invalid credentials');
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
