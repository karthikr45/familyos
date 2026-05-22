import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsObject, IsOptional, IsPositive, IsString } from 'class-validator';

export class AddTuitionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty()
  @IsString()
  tutorName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tutorPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  feesPerMonth!: number;

  @ApiPropertyOptional({ description: 'Weekly schedule, e.g. { "MON": "17:00", "WED": "17:00" }' })
  @IsOptional()
  @IsObject()
  schedule?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  startedAt?: Date;
}

export class UpdateTuitionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tutorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tutorPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  feesPerMonth?: number;
}

export class MarkAttendanceDto {
  @ApiProperty()
  @Type(() => Date)
  date!: Date;

  @ApiProperty({ enum: ['PRESENT', 'ABSENT', 'CANCELLED'] })
  @IsEnum(['PRESENT', 'ABSENT', 'CANCELLED'])
  status!: 'PRESENT' | 'ABSENT' | 'CANCELLED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordPaymentDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty()
  @Type(() => Date)
  dueDate!: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  paidAt?: Date;

  @ApiPropertyOptional({ enum: ['PAID', 'PENDING', 'OVERDUE'] })
  @IsOptional()
  @IsEnum(['PAID', 'PENDING', 'OVERDUE'])
  status?: 'PAID' | 'PENDING' | 'OVERDUE';
}
