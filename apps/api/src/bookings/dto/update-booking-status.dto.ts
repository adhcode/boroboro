import { IsEnum } from 'class-validator';
import { BookingStatus } from '@rental-marketplace/shared';

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
