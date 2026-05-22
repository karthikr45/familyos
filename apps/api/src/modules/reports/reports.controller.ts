import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FamilyGuard } from '../../common/guards/family.guard';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('student/:id/weekly')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Get the weekly student report' })
  studentWeekly(@Param('id') id: string) {
    return this.reportsService.getStudentWeekly(id);
  }

  @Get('family/:familyId/weekly')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Get weekly family reports' })
  familyWeekly(@Param('familyId') familyId: string) {
    return this.reportsService.getFamilyWeekly(familyId);
  }

  @Get('student/:id/monthly')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Monthly academic report' })
  studentMonthly(@Param('id') id: string) {
    return this.reportsService.getStudentMonthly(id);
  }

  @Get('student/:id/progress')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Overall progress report' })
  studentProgress(@Param('id') id: string) {
    return this.reportsService.getStudentProgress(id);
  }

  @Get('finance/:familyId/monthly')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Monthly finance report' })
  financeMonthly(
    @Param('familyId') familyId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.reportsService.getFinanceMonthly(
      familyId,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Get('finance/:familyId/annual')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Annual finance report' })
  financeAnnual(@Param('familyId') familyId: string, @Query('year') year?: string) {
    return this.reportsService.getFinanceAnnual(familyId, year ? Number(year) : undefined);
  }

  @Post('generate/:familyId')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Manually trigger report generation' })
  generate(
    @CurrentUser('userId') userId: string,
    @Param('familyId') familyId: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.reportsService.generate(familyId, userId, studentId);
  }
}
