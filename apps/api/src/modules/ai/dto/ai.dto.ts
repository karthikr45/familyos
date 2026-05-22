import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class AskTutorDto {
  @ApiProperty()
  @IsString()
  studentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chapterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty()
  @IsString()
  question!: string;
}

export class StudyPlanRequestDto {
  @ApiProperty()
  @IsString()
  studentId!: string;
}

export class GenerateExamRequestDto {
  @ApiProperty()
  @IsString()
  subjectId!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  chapterIds!: string[];

  @ApiProperty({ enum: ['EASY', 'MEDIUM', 'HARD'] })
  @IsString()
  difficulty!: 'EASY' | 'MEDIUM' | 'HARD';

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  count?: number;
}

export class EvaluateAnswerDto {
  @ApiProperty()
  @IsString()
  question!: string;

  @ApiProperty()
  @IsString()
  studentAnswer!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceAnswer?: string;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @IsInt()
  maxMarks?: number;
}

export class AnalyzeFoodPhotoDto {
  @ApiProperty({ description: 'Base64-encoded JPEG/PNG image data (no data: prefix)' })
  @IsString()
  imageBase64!: string;
}

export class SuggestVacationDto {
  @ApiProperty()
  @IsString()
  familyId!: string;

  @ApiProperty()
  @IsNumber()
  budget!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  season?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}

export class SuggestOutingDto {
  @ApiProperty()
  @IsString()
  familyId!: string;

  @ApiProperty()
  @IsString()
  location!: string;
}

export class SuggestDinnerDto {
  @ApiProperty()
  @IsString()
  familyId!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferences?: string[];
}
