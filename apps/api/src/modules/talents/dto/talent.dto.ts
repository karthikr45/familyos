import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddTalentDto {
  @ApiProperty()
  @IsString()
  talentCategoryId!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coach?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  startedAt?: Date;
}

export class UpdateTalentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coach?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue?: string;
}

export class LogTalentSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddAchievementDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @Type(() => Date)
  date!: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certificateUrl?: string;
}
