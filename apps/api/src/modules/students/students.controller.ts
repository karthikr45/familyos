import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { FamilyGuard } from '../../common/guards/family.guard';
import { StudentsService } from './students.service';
import {
  CreateStudentProfileDto,
  LogStudySessionDto,
  UpdateStudentProfileDto,
} from './dto/student.dto';

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post('profile')
  @ApiOperation({ summary: 'Create a student profile for the current user' })
  createProfile(@CurrentUser('userId') userId: string, @Body() dto: CreateStudentProfileDto) {
    return this.studentsService.createProfile(userId, dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get the current student profile' })
  getProfile(@CurrentUser('userId') userId: string) {
    return this.studentsService.getProfileByUser(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update the current student profile' })
  updateProfile(@CurrentUser('userId') userId: string, @Body() dto: UpdateStudentProfileDto) {
    return this.studentsService.updateProfileByUser(userId, dto);
  }

  @Post('study-sessions')
  @ApiOperation({ summary: 'Log a study session' })
  @UseGuards(FamilyGuard)
  logStudySession(@Body() dto: LogStudySessionDto) {
    return this.studentsService.logStudySession(dto);
  }

  @Get(':id/dashboard')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Get the full student dashboard' })
  getDashboard(@Param('id') id: string) {
    return this.studentsService.getDashboard(id);
  }

  @Get(':id/study-sessions')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Get paginated study sessions' })
  getStudySessions(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.studentsService.getStudySessions(id, Number(page), Number(pageSize));
  }

  @Get(':id/progress')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Get academic progress summary' })
  getProgress(@Param('id') id: string) {
    return this.studentsService.getProgress(id);
  }

  @Get(':id/streaks')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Get study streak data' })
  @Roles('STUDENT', 'PARENT', 'ADMIN')
  getStreaks(@Param('id') id: string) {
    return this.studentsService.getStreaks(id);
  }
}
