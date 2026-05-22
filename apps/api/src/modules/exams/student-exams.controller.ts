import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FamilyGuard } from '../../common/guards/family.guard';
import { ExamsService } from './exams.service';

/** Student-scoped exam analytics under the /students path. */
@ApiTags('exams')
@ApiBearerAuth()
@Controller('students')
export class StudentExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get(':id/exam-history')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Exam history with trends' })
  examHistory(@Param('id') id: string) {
    return this.examsService.examHistory(id);
  }

  @Get(':id/weak-areas')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'AI-detected weak areas' })
  weakAreas(@Param('id') id: string) {
    return this.examsService.weakAreas(id);
  }
}
