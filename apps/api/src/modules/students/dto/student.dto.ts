import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStudentProfileDto {
  @ApiProperty()
  @IsString()
  familyId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  dateOfBirth?: Date;

  @ApiProperty({ minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  class!: number;

  @ApiProperty({ enum: ['CBSE', 'ICSE', 'STATE'] })
  @IsEnum(['CBSE', 'ICSE', 'STATE'])
  board!: 'CBSE' | 'ICSE' | 'STATE';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  school?: string;
}

export class UpdateStudentProfileDto extends PartialType(CreateStudentProfileDto) {}

export class LogStudySessionDto {
  @ApiProperty()
  @IsString()
  studentId!: string;

  @ApiProperty()
  @IsString()
  subjectId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chapterId?: string;

  @ApiProperty({ minimum: 1, maximum: 720 })
  @IsInt()
  @Min(1)
  @Max(720)
  durationMinutes!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
