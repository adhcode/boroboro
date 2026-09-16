import { IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @MinLength(64) // SHA-256 hex string is 64 characters
  token: string;
}
