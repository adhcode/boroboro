import { PartialType } from '@nestjs/mapped-types';
import { CreateAvailabilityBlockDto } from './create-availability-block.dto';

export class UpdateAvailabilityBlockDto extends PartialType(CreateAvailabilityBlockDto) {}
