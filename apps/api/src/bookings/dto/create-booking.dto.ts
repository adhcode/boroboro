import { IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @IsString()
  listingId: string;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;
}
