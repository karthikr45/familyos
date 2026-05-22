import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePreferenceDto {
  @ApiProperty()
  @IsString()
  type!: string;

  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;

  @ApiPropertyOptional({ example: '07:00' })
  @IsOptional()
  @IsString()
  timeOfDay?: string;
}
