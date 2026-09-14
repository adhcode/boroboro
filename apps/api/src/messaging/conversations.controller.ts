import { Controller, Get, UseGuards } from '@nestjs/common';

import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get()
  getUserConversations(@CurrentUser() user: User) {
    return this.messagingService.getUserConversations(user.id);
  }
}
