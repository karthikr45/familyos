import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateExamDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  subjectId!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(360)
  timeLimit?: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  questionIds!: string[];
}

export class UpdateExamDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  timeLimit?: number;
}

export class AiGenerateExamDto {
  @ApiProperty()
  @IsString()
  title!: string;

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

  @ApiProperty({ description: 'Student profile id taking ownership of the attempt context' })
  @IsString()
  studentId!: string;
}

export class StartAttemptDto {
  @ApiProperty()
  @IsString()
  studentId!: string;
}

export class SubmitAnswerDto {
  @ApiProperty()
  @IsString()
  questionId!: string;

  @ApiProperty()
  @IsString()
  selectedAnswer!: string;
}

export class CreateChallengeDto {
  @ApiProperty()
  @IsString()
  challengerStudentId!: string;

  @ApiProperty()
  @IsString()
  challengedStudentId!: string;
}

export class RespondChallengeDto {
  @ApiProperty({ enum: ['ACCEPTED', 'DECLINED'] })
  @IsString()
  status!: 'ACCEPTED' | 'DECLINED';
}
