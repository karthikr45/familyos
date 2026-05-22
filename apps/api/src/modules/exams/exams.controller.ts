import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types';
import { ExamsService } from './exams.service';
import {
  AiGenerateExamDto,
  CreateChallengeDto,
  CreateExamDto,
  RespondChallengeDto,
  StartAttemptDto,
  SubmitAnswerDto,
  UpdateExamDto,
} from './dto/exam.dto';

@ApiTags('exams')
@ApiBearerAuth()
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new exam' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateExamDto) {
    return this.examsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List exams (mine + public + challenges)' })
  list(@CurrentUser() user: AuthUser) {
    return this.examsService.list(user.userId, user.studentProfileId);
  }

  @Post('ai-generate')
  @ApiOperation({ summary: 'Generate an exam via AI' })
  aiGenerate(@CurrentUser('userId') userId: string, @Body() dto: AiGenerateExamDto) {
    return this.examsService.aiGenerate(userId, dto);
  }

  @Get('challenges')
  @ApiOperation({ summary: 'Get my peer challenges (sent + received)' })
  challenges(@CurrentUser() user: AuthUser) {
    return this.examsService.getChallenges(user.studentProfileId ?? '');
  }

  @Patch('challenges/:id')
  @ApiOperation({ summary: 'Accept or decline a challenge' })
  respondChallenge(@Param('id') id: string, @Body() dto: RespondChallengeDto) {
    return this.examsService.respondChallenge(id, dto);
  }

  @Patch('attempts/:attemptId')
  @ApiOperation({ summary: 'Submit an answer for a question' })
  submitAnswer(@Param('attemptId') attemptId: string, @Body() dto: SubmitAnswerDto) {
    return this.examsService.submitAnswer(attemptId, dto);
  }

  @Post('attempts/:attemptId/complete')
  @ApiOperation({ summary: 'Complete an attempt and finalise the score' })
  complete(@Param('attemptId') attemptId: string) {
    return this.examsService.completeAttempt(attemptId);
  }

  @Get('attempts/:attemptId/results')
  @ApiOperation({ summary: 'Get detailed results with AI insights' })
  results(@CurrentUser('userId') userId: string, @Param('attemptId') attemptId: string) {
    return this.examsService.getResults(attemptId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an exam with questions' })
  getById(@Param('id') id: string) {
    return this.examsService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an exam' })
  update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExamDto,
  ) {
    return this.examsService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an exam' })
  remove(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.examsService.remove(id, userId);
  }

  @Post(':id/attempt')
  @ApiOperation({ summary: 'Start an exam attempt' })
  startAttempt(@Param('id') id: string, @Body() dto: StartAttemptDto) {
    return this.examsService.startAttempt(id, dto.studentId);
  }

  @Post(':id/challenge')
  @ApiOperation({ summary: 'Send a peer challenge' })
  challenge(@Param('id') id: string, @Body() dto: CreateChallengeDto) {
    return this.examsService.createChallenge(id, dto);
  }
}
