import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types';
import { ParentsService } from './parents.service';
import { CreateParentProfileDto } from './dto/parent.dto';

@ApiTags('parents')
@ApiBearerAuth()
@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post('profile')
  @ApiOperation({ summary: 'Create a parent profile and family' })
  createProfile(@CurrentUser('userId') userId: string, @Body() dto: CreateParentProfileDto) {
    return this.parentsService.createProfile(userId, dto);
  }

  @Get(':id/children')
  @Roles('PARENT', 'ADMIN')
  @ApiOperation({ summary: 'Get all children profiles for a parent' })
  getChildren(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.parentsService.getChildren(user.userId, id, user.role);
  }

  @Get(':id/dashboard')
  @Roles('PARENT', 'ADMIN')
  @ApiOperation({ summary: 'Get aggregated parent dashboard data' })
  getDashboard(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.parentsService.getDashboard(user.userId, id, user.role);
  }

  @Get('child/:studentId/summary')
  @Roles('PARENT', 'ADMIN')
  @ApiOperation({ summary: 'Get a child summary for a parent' })
  getChildSummary(@Param('studentId') studentId: string, @CurrentUser() user: AuthUser) {
    return this.parentsService.getChildSummary(user.userId, studentId, user.role);
  }
}
