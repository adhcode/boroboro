import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get('me')
  getProfile(@CurrentUser() user: User) {
    const { passwordHash, ...userWithoutPassword } = user as any;
    return userWithoutPassword;
  }
}
