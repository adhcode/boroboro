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

import { AvailabilityBlocksService } from './availability-blocks.service';
import { CreateAvailabilityBlockDto } from './dto/create-availability-block.dto';
import { UpdateAvailabilityBlockDto } from './dto/update-availability-block.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('listings/:listingId/availability-blocks')
export class AvailabilityBlocksController {
  constructor(private readonly availabilityBlocksService: AvailabilityBlocksService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('listingId') listingId: string,
    @CurrentUser() user: User,
    @Body() createDto: CreateAvailabilityBlockDto,
  ) {
    return this.availabilityBlocksService.create(listingId, user.id, createDto);
  }

  @Get()
  findAll(
    @Param('listingId') listingId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.availabilityBlocksService.findAll(listingId, startDate, endDate);
  }

  @Post('check')
  @HttpCode(HttpStatus.OK)
  checkAvailability(
    @Param('listingId') listingId: string,
    @Body() checkDto: CheckAvailabilityDto,
  ) {
    return this.availabilityBlocksService.checkAvailability(listingId, checkDto);
  }

  @Get(':id')
  findOne(@Param('listingId') listingId: string, @Param('id') id: string) {
    return this.availabilityBlocksService.findOne(id, listingId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('listingId') listingId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateDto: UpdateAvailabilityBlockDto,
  ) {
    return this.availabilityBlocksService.update(id, listingId, user.id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('listingId') listingId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.availabilityBlocksService.remove(id, listingId, user.id);
  }
}
