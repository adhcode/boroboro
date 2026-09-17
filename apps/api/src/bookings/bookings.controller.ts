import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookingStatus } from '@rental-marketplace/shared';

import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(EmailVerifiedGuard) // Require email verification for creating bookings
  create(@CurrentUser() user: User, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(user.id, createBookingDto);
  }

  @Get()
  findAll(@CurrentUser() user: User, @Query('role') role?: 'renter' | 'owner') {
    return this.bookingsService.findUserBookings(user.id, role);
  }

  @Get('listing/:listingId')
  findByListing(
    @Param('listingId') listingId: string,
    @CurrentUser() user: User,
    @Query('status') status?: BookingStatus,
  ) {
    return this.bookingsService.findByListing(listingId, user.id, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingsService.findOne(id, user.id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateStatusDto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, user.id, updateStatusDto.status);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingsService.cancel(id, user.id);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  confirm(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingsService.confirm(id, user.id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingsService.complete(id, user.id);
  }
}
