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

import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('bookings/:bookingId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: User,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(bookingId, user.id, createReviewDto);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string, @Query('type') type: 'given' | 'received') {
    return this.reviewsService.findByUser(userId, type || 'received');
  }

  @Get('user/:userId/stats')
  getUserStats(@Param('userId') userId: string) {
    return this.reviewsService.getUserStats(userId);
  }

  @Get('listing/:listingId')
  findByListing(@Param('listingId') listingId: string) {
    return this.reviewsService.findByListing(listingId);
  }

  @Get('booking/:bookingId/can-review')
  @UseGuards(JwtAuthGuard)
  canReview(@Param('bookingId') bookingId: string, @CurrentUser() user: User) {
    return this.reviewsService.canUserReview(bookingId, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }
}
