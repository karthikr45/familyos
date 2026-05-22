import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class FoodItemDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quantity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  calories?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isJunk?: boolean;
}

export class LogFoodDto {
  @ApiProperty()
  @IsString()
  studentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @ApiProperty({ enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] })
  @IsEnum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'])
  mealType!: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

  @ApiProperty({ type: [FoodItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FoodItemDto)
  items!: FoodItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  calories?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isJunkFood?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class LogActivityDto {
  @ApiProperty()
  @IsString()
  studentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @ApiProperty()
  @IsString()
  activityType!: string;

  @ApiProperty({ minimum: 1, maximum: 600 })
  @IsInt()
  @Min(1)
  @Max(600)
  durationMinutes!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  calories?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class LogSleepDto {
  @ApiProperty()
  @IsString()
  studentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  bedTime?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  wakeTime?: Date;

  @ApiProperty({ minimum: 0, maximum: 24 })
  @IsNumber()
  @Min(0)
  @Max(24)
  hoursSlept!: number;

  @ApiPropertyOptional({ enum: ['POOR', 'FAIR', 'GOOD', 'EXCELLENT'] })
  @IsOptional()
  @IsEnum(['POOR', 'FAIR', 'GOOD', 'EXCELLENT'])
  quality?: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
}

export class LogMoodDto {
  @ApiProperty()
  @IsString()
  studentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @ApiProperty({ enum: ['VERY_SAD', 'SAD', 'NEUTRAL', 'HAPPY', 'VERY_HAPPY'] })
  @IsEnum(['VERY_SAD', 'SAD', 'NEUTRAL', 'HAPPY', 'VERY_HAPPY'])
  mood!: 'VERY_SAD' | 'SAD' | 'NEUTRAL' | 'HAPPY' | 'VERY_HAPPY';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

export class LogStressReliefDto {
  @ApiProperty()
  @IsString()
  studentId!: string;

  @ApiProperty({ enum: ['BREATHING', 'JOURNAL', 'BRAIN_BREAK', 'MEDITATION'] })
  @IsEnum(['BREATHING', 'JOURNAL', 'BRAIN_BREAK', 'MEDITATION'])
  sessionType!: 'BREATHING' | 'JOURNAL' | 'BRAIN_BREAK' | 'MEDITATION';

  @ApiProperty({ minimum: 1, maximum: 120 })
  @IsInt()
  @Min(1)
  @Max(120)
  durationMinutes!: number;
}

export class LogParentMoodDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @ApiProperty({ enum: ['VERY_SAD', 'SAD', 'NEUTRAL', 'HAPPY', 'VERY_HAPPY'] })
  @IsEnum(['VERY_SAD', 'SAD', 'NEUTRAL', 'HAPPY', 'VERY_HAPPY'])
  mood!: 'VERY_SAD' | 'SAD' | 'NEUTRAL' | 'HAPPY' | 'VERY_HAPPY';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ParentJournalDto {
  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  content!: string;
}

export class AnalyzeFoodPhotoDto {
  @ApiProperty()
  @IsString()
  studentId!: string;

  @ApiProperty()
  @IsString()
  imageBase64!: string;
}
