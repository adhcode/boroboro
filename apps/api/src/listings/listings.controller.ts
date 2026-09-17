import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ListingStatus } from '@rental-marketplace/shared';

import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard) // Require email verification
  create(@CurrentUser() user: User, @Body() createListingDto: CreateListingDto) {
    return this.listingsService.create(user.id, createListingDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryListingsDto) {
    return this.listingsService.findAll(queryDto);
  }

  @Get('my-listings')
  @UseGuards(JwtAuthGuard)
  findMyListings(@CurrentUser() user: User, @Query('status') status?: ListingStatus) {
    return this.listingsService.findMyListings(user.id, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateListingDto: UpdateListingDto,
  ) {
    return this.listingsService.update(id, user.id, updateListingDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('status') status: ListingStatus,
  ) {
    return this.listingsService.updateStatus(id, user.id, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.listingsService.remove(id, user.id);
  }
}
