import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateParentProfileDto {
  @ApiProperty({ example: 'The Sharma Family' })
  @IsString()
  @MaxLength(120)
  familyName!: string;

  @ApiPropertyOptional({ example: 'Asha Sharma' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;
}
