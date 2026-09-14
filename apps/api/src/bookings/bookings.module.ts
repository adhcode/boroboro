import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { AvailabilityBlocksModule } from '../availability-blocks/availability-blocks.module';

@Module({
  imports: [AvailabilityBlocksModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
