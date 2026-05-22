import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FamilyGuard } from '../../common/guards/family.guard';
import { StorageService } from '../storage/storage.service';
import type { UploadedFileLike } from '../users/dto/user.dto';
import { FamilyService } from './family.service';
import {
  CreateCalendarEventDto,
  CreateDinnerDto,
  CreateFamilyDto,
  CreateOutingDto,
  CreateVacationDto,
  LogFamilyActivityDto,
  PhotoCaptionDto,
  UpdateCalendarEventDto,
  UpdateVacationDto,
} from './dto/family.dto';

@ApiTags('family')
@ApiBearerAuth()
@Controller('family')
export class FamilyController {
  constructor(
    private readonly familyService: FamilyService,
    private readonly storage: StorageService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a family' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateFamilyDto) {
    return this.familyService.createFamily(userId, dto);
  }

  @Get(':id')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Get family details' })
  get(@Param('id') id: string) {
    return this.familyService.getFamily(id);
  }

  @Post(':id/members')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Add a family member' })
  addMember(@Param('id') id: string, @Body() dto: { userId: string; role: 'PARENT' | 'CHILD' }) {
    return this.familyService.addMember(id, dto.userId, dto.role);
  }

  @Delete(':id/members/:userId')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Remove a family member' })
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.familyService.removeMember(id, userId);
  }

  @Get(':id/calendar')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Get family calendar events' })
  calendar(@Param('id') id: string) {
    return this.familyService.getCalendar(id);
  }

  @Post(':id/calendar')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Add a calendar event (returns exam conflict warnings)' })
  addEvent(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateCalendarEventDto,
  ) {
    return this.familyService.addCalendarEvent(id, userId, dto);
  }

  @Patch(':id/calendar/:eventId')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Update a calendar event' })
  updateEvent(@Param('eventId') eventId: string, @Body() dto: UpdateCalendarEventDto) {
    return this.familyService.updateEvent(eventId, dto);
  }

  @Delete(':id/calendar/:eventId')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Delete a calendar event' })
  deleteEvent(@Param('eventId') eventId: string) {
    return this.familyService.deleteEvent(eventId);
  }

  @Post(':id/vacations')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Create a vacation plan' })
  createVacation(@Param('id') id: string, @Body() dto: CreateVacationDto) {
    return this.familyService.createVacation(id, dto);
  }

  @Get(':id/vacations')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Get vacation plans' })
  vacations(@Param('id') id: string) {
    return this.familyService.getVacations(id);
  }

  @Patch(':id/vacations/:planId')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Update a vacation plan' })
  updateVacation(@Param('planId') planId: string, @Body() dto: UpdateVacationDto) {
    return this.familyService.updateVacation(planId, dto);
  }

  @Post(':id/outings')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Create an outing plan' })
  createOuting(@Param('id') id: string, @Body() dto: CreateOutingDto) {
    return this.familyService.createOuting(id, dto);
  }

  @Get(':id/outings')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Get outing plans' })
  outings(@Param('id') id: string) {
    return this.familyService.getOutings(id);
  }

  @Post(':id/dinners')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Create a dinner plan' })
  createDinner(@Param('id') id: string, @Body() dto: CreateDinnerDto) {
    return this.familyService.createDinner(id, dto);
  }

  @Get(':id/dinners')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Get dinner plans (week view)' })
  dinners(@Param('id') id: string) {
    return this.familyService.getDinners(id);
  }

  @Post(':id/activities')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Log a bonding activity' })
  logActivity(@Param('id') id: string, @Body() dto: LogFamilyActivityDto) {
    return this.familyService.logActivity(id, dto);
  }

  @Get(':id/activities')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Get bonding activities' })
  activities(@Param('id') id: string) {
    return this.familyService.getActivities(id);
  }

  @Get(':id/bonding-score')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Bonding frequency score' })
  bondingScore(@Param('id') id: string) {
    return this.familyService.getBondingScore(id);
  }

  @Post(':id/photos')
  @UseGuards(FamilyGuard)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a family photo' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: UploadedFileLike,
    @Body() dto: PhotoCaptionDto,
  ) {
    const url = await this.storage.upload(`family/${id}/photos`, file);
    return this.familyService.uploadPhoto(id, url, userId, dto.caption, dto.eventId);
  }

  @Get(':id/photos')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Get the photo album (paginated)' })
  photos(@Param('id') id: string, @Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    return this.familyService.getPhotos(id, Number(page), Number(pageSize));
  }
}
