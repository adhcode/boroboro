import { Module } from '@nestjs/common';
import { AvailabilityBlocksService } from './availability-blocks.service';
import { AvailabilityBlocksController } from './availability-blocks.controller';
import { ListingsModule } from '../listings/listings.module';

@Module({
  imports: [ListingsModule],
  controllers: [AvailabilityBlocksController],
  providers: [AvailabilityBlocksService],
  exports: [AvailabilityBlocksService],
})
export class AvailabilityBlocksModule {}
