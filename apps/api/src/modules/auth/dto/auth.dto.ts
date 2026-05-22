import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

const PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/;

export class SendOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @Matches(PHONE_REGEX, { message: 'Enter a valid Indian mobile number' })
  phone!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @Matches(PHONE_REGEX, { message: 'Enter a valid Indian mobile number' })
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  otp!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'parent@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'secret123' })
  @IsString()
  @MinLength(1)
  password!: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'parent@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'secret123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Asha Sharma' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ enum: ['STUDENT', 'PARENT'], default: 'PARENT' })
  @IsEnum(['STUDENT', 'PARENT'])
  @IsOptional()
  role?: 'STUDENT' | 'PARENT';
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class AuthTokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}
