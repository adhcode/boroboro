import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { MessagingService } from './messaging.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('bookings/:bookingId/messages')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: User,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.messagingService.create(bookingId, user.id, createMessageDto);
  }

  @Get()
  findAll(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: User,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.messagingService.findAll(bookingId, user.id, limit, offset);
  }

  @Get('unread-count')
  getUnreadCount(@Param('bookingId') bookingId: string, @CurrentUser() user: User) {
    return this.messagingService.getUnreadCount(bookingId, user.id);
  }
}
