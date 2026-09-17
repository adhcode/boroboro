import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    // Generate and send email verification token
    await this.generateAndSendVerificationToken(user.id, user.email, user.firstName);

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedException('Refresh token expired');
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Validate tokenVersion matches current user's version
      if (payload.tokenVersion !== storedToken.user.tokenVersion) {
        // Token version mismatch - token has been invalidated
        await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      // Delete old refresh token (rotation)
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

      // Generate new token pair
      const tokens = await this.generateTokens(payload.sub, storedToken.user.email);

      return tokens;
    } catch (error) {
      // Clean up invalid token
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      return;
    }

    // Find the token to get the user ID
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      select: { userId: true },
    });

    if (storedToken) {
      // Increment tokenVersion to invalidate ALL refresh tokens for this user
      await this.prisma.user.update({
        where: { id: storedToken.userId },
        data: { tokenVersion: { increment: 1 } },
      });

      // Delete all refresh tokens for this user
      await this.prisma.refreshToken.deleteMany({
        where: { userId: storedToken.userId },
      });
    }
  }

  private async generateTokens(userId: string, email: string) {
    // Get user's current tokenVersion
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tokenVersion: true },
    });

    const payload = { sub: userId, email };
    const refreshPayload = { 
      sub: userId, 
      tokenVersion: user?.tokenVersion || 0,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '30d', // Changed from 7d to 30d
      }),
    ]);

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Changed from 7 to 30

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async verifyEmail(code: string) {
    // Hash the incoming code to match against stored hash
    const tokenHash = this.hashToken(code);

    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new BadRequestException('Invalid verification code');
    }

    if (verificationToken.expiresAt < new Date()) {
      // Delete expired token
      await this.prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      throw new BadRequestException('Verification code has expired');
    }

    // Update user's email verification status
    const updatedUser = await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerifiedAt: new Date() },
    });

    // Delete used token
    await this.prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    // Generate tokens for auto-login
    const accessToken = this.jwtService.sign(
      { sub: updatedUser.id, email: updatedUser.email },
      { 
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: updatedUser.id, tokenVersion: updatedUser.tokenVersion },
      { 
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '30d',
      },
    );

    // Return tokens and user for auto-login
    return {
      message: 'Email verified successfully',
      accessToken,
      refreshToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        role: updatedUser.role,
        emailVerifiedAt: updatedUser.emailVerifiedAt,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    };
  }

  async resendVerificationEmail(email: string) {
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Always return success to avoid email enumeration
    // But only send email if user exists and isn't verified
    const user = await this.usersService.findByEmail(normalizedEmail);
    
    if (user && !user.emailVerifiedAt) {
      // Invalidate existing unexpired tokens
      await this.prisma.emailVerificationToken.deleteMany({
        where: {
          userId: user.id,
          expiresAt: { gt: new Date() },
        },
      });

      // Generate and send new token
      await this.generateAndSendVerificationToken(user.id, user.email, user.firstName);
    }

    // Always return success message
    return { message: 'If your email is registered and unverified, a verification email has been sent' };
  }

  async forgotPassword(email: string) {
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Always return success to avoid email enumeration
    const user = await this.usersService.findByEmail(normalizedEmail);
    
    if (user) {
      // Invalidate existing unexpired tokens
      await this.prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          expiresAt: { gt: new Date() },
        },
      });

      // Generate and send reset code
      await this.generateAndSendPasswordResetCode(user.id, user.email, user.firstName);
    }

    // Always return success message
    return { message: 'If your email is registered, a password reset code has been sent' };
  }

  async resetPassword(code: string, newPassword: string) {
    // Hash the incoming code to match against stored hash
    const tokenHash = this.hashToken(code);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid reset code');
    }

    if (resetToken.expiresAt < new Date()) {
      // Delete expired token
      await this.prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      throw new BadRequestException('Reset code has expired');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user's password and increment tokenVersion (invalidates all refresh tokens)
    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { 
        passwordHash,
        tokenVersion: { increment: 1 },
      },
    });

    // Delete used token
    await this.prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return { message: 'Password reset successful' };
  }

  private async generateAndSendPasswordResetCode(
    userId: string,
    email: string,
    firstName: string,
  ): Promise<void> {
    // Generate cryptographically secure 6-digit code
    const code = this.generateVerificationCode();
    
    // Hash code before storing (SHA-256)
    const tokenHash = this.hashToken(code);
    
    // Store token with 1-hour expiry (shorter than email verification)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    // Send email with raw code
    await this.emailService.sendPasswordResetEmail(email, code, firstName);
  }

  private async generateAndSendVerificationToken(
    userId: string,
    email: string,
    firstName: string,
  ): Promise<void> {
    // Generate cryptographically secure 6-digit code
    const code = this.generateVerificationCode();
    
    // Hash code before storing (SHA-256)
    const tokenHash = this.hashToken(code);
    
    // Store token with 24-hour expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    // Send email with raw code (never log or store the raw code)
    await this.emailService.sendVerificationEmail(email, code, firstName);
  }

  private generateVerificationCode(): string {
    // Generate a cryptographically secure 6-digit code
    // Use crypto.randomInt to ensure uniform distribution
    const code = crypto.randomInt(100000, 999999).toString();
    return code;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
