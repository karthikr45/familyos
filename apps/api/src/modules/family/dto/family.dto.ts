import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFamilyDto {
  @ApiProperty()
  @IsString()
  name!: string;
}

export class AddMemberDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty({ enum: ['PARENT', 'CHILD'] })
  @IsEnum(['PARENT', 'CHILD'])
  role!: 'PARENT' | 'CHILD';
}

export class CreateCalendarEventDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['EXAM', 'VACATION', 'OUTING', 'DINNER', 'ACTIVITY', 'OTHER'] })
  @IsEnum(['EXAM', 'VACATION', 'OUTING', 'DINNER', 'ACTIVITY', 'OTHER'])
  type!: 'EXAM' | 'VACATION' | 'OUTING' | 'DINNER' | 'ACTIVITY' | 'OTHER';

  @ApiProperty()
  @Type(() => Date)
  startDate!: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;
}

export class UpdateCalendarEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}

export class CreateVacationDto {
  @ApiProperty()
  @IsString()
  destination!: string;

  @ApiProperty()
  @Type(() => Date)
  startDate!: Date;

  @ApiProperty()
  @Type(() => Date)
  endDate!: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  budget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  itinerary?: Record<string, unknown>;
}

export class UpdateVacationDto {
  @ApiPropertyOptional({ enum: ['PLANNED', 'BOOKED', 'COMPLETED'] })
  @IsOptional()
  @IsEnum(['PLANNED', 'BOOKED', 'COMPLETED'])
  status?: 'PLANNED' | 'BOOKED' | 'COMPLETED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  itinerary?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  budget?: number;
}

export class CreateOutingDto {
  @ApiProperty()
  @IsString()
  destination!: string;

  @ApiProperty()
  @Type(() => Date)
  date!: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  budget?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  educationalTags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateDinnerDto {
  @ApiProperty()
  @Type(() => Date)
  date!: Date;

  @ApiProperty({ enum: ['HOME', 'RESTAURANT'] })
  @IsEnum(['HOME', 'RESTAURANT'])
  type!: 'HOME' | 'RESTAURANT';

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  mealPlan?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  restaurantName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedCost?: number;
}

export class LogFamilyActivityDto {
  @ApiProperty()
  @IsString()
  activityType!: string;

  @ApiProperty()
  @Type(() => Date)
  date!: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  durationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];
}

export class PhotoCaptionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventId?: string;
}
