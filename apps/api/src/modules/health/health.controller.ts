import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { FamilyGuard } from '../../common/guards/family.guard';
import type { AuthUser } from '../../common/types';
import { HealthService } from './health.service';
import {
  AnalyzeFoodPhotoDto,
  LogActivityDto,
  LogFoodDto,
  LogMoodDto,
  LogParentMoodDto,
  LogSleepDto,
  LogStressReliefDto,
  ParentJournalDto,
} from './dto/health.dto';

@ApiTags('health')
@ApiBearerAuth()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Post('food-log')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Log a food entry' })
  logFood(@Body() dto: LogFoodDto) {
    return this.healthService.logFood(dto);
  }

  @Get('food-log')
  @ApiOperation({ summary: 'Get food logs in a date range' })
  getFood(
    @Query('studentId') studentId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.healthService.getFoodLogs(studentId, from, to);
  }

  @Post('food-log/photo')
  @ApiOperation({ summary: 'Identify food from a photo via AI' })
  analyzePhoto(@CurrentUser('userId') userId: string, @Body() dto: AnalyzeFoodPhotoDto) {
    return this.healthService.analyzeFoodPhoto(userId, dto.imageBase64);
  }

  @Post('activity')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Log an activity' })
  logActivity(@Body() dto: LogActivityDto) {
    return this.healthService.logActivity(dto);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get activity logs' })
  getActivity(
    @Query('studentId') studentId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.healthService.getActivity(studentId, from, to);
  }

  @Post('sleep')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Log sleep' })
  logSleep(@Body() dto: LogSleepDto) {
    return this.healthService.logSleep(dto);
  }

  @Get('sleep')
  @ApiOperation({ summary: 'Get sleep logs' })
  getSleep(
    @Query('studentId') studentId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.healthService.getSleep(studentId, from, to);
  }

  @Post('mood')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Log mood (student — private)' })
  logMood(@Body() dto: LogMoodDto) {
    return this.healthService.logMood(dto);
  }

  @Get('mood/trend')
  @ApiOperation({ summary: 'Aggregated mood trend for a parent (no raw entries)' })
  moodTrend(@Query('studentId') studentId: string) {
    return this.healthService.getMoodTrend(studentId);
  }

  @Post('stress-relief')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Log a stress relief session' })
  logStressRelief(@Body() dto: LogStressReliefDto) {
    return this.healthService.logStressRelief(dto);
  }

  @Get('summary/:studentId')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Weekly health summary for a parent' })
  summary(@Param('studentId') studentId: string) {
    return this.healthService.getSummary(studentId);
  }

  @Get('nutrition-score/:studentId')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Nutrition score for a student' })
  nutritionScore(@Param('studentId') studentId: string) {
    return this.healthService.getNutritionScore(studentId);
  }

  @Post('parent/mood')
  @Roles('PARENT', 'ADMIN')
  @ApiOperation({ summary: 'Log parent mood (completely private)' })
  parentMood(@CurrentUser() user: AuthUser, @Body() dto: LogParentMoodDto) {
    return this.healthService.logParentMood(user.userId, dto);
  }

  @Post('parent/journal')
  @Roles('PARENT', 'ADMIN')
  @ApiOperation({ summary: 'Parent journal entry (completely private)' })
  parentJournal(@CurrentUser() user: AuthUser, @Body() dto: ParentJournalDto) {
    return this.healthService.logParentJournal(user.userId, dto);
  }
}
