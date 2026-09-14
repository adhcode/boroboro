import { IsDate, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAvailabilityBlockDto {
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}
