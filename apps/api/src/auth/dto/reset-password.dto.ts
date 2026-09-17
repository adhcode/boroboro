import { IsString, MinLength, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Length(6, 6, { message: 'Reset code must be 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Reset code must be 6 digits' })
  code: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;
}
