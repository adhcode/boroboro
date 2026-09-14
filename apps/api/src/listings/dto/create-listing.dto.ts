import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { ListingStatus } from '@rental-marketplace/shared';

export class CreateListingDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  description: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  category: string;

  @IsNumber()
  @Min(0)
  pricePerDay: number;

  @IsNumber()
  @Min(0)
  depositAmount: number;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  images: string[];

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  location: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;
}
