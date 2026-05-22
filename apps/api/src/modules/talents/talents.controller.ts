import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FamilyGuard } from '../../common/guards/family.guard';
import { StorageService } from '../storage/storage.service';
import type { UploadedFileLike } from '../users/dto/user.dto';
import { TalentsService } from './talents.service';
import {
  AddAchievementDto,
  AddTalentDto,
  LogTalentSessionDto,
  UpdateTalentDto,
} from './dto/talent.dto';

@ApiTags('talents')
@ApiBearerAuth()
@Controller()
export class TalentsController {
  constructor(
    private readonly talentsService: TalentsService,
    private readonly storage: StorageService,
  ) {}

  @Get('talents/categories')
  @ApiOperation({ summary: 'Get all talent categories' })
  categories() {
    return this.talentsService.getCategories();
  }

  @Post('students/:id/talents')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Add a talent to a student' })
  addTalent(@Param('id') id: string, @Body() dto: AddTalentDto) {
    return this.talentsService.addTalent(id, dto);
  }

  @Get('students/:id/talents')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Get all student talents' })
  getTalents(@Param('id') id: string) {
    return this.talentsService.getTalents(id);
  }

  @Get('students/:id/talent-portfolio')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Full talent portfolio for a student' })
  portfolio(@Param('id') id: string) {
    return this.talentsService.getPortfolio(id);
  }

  @Patch('students/talents/:talentId')
  @ApiOperation({ summary: 'Update talent details' })
  updateTalent(@Param('talentId') talentId: string, @Body() dto: UpdateTalentDto) {
    return this.talentsService.updateTalent(talentId, dto);
  }

  @Post('students/talents/:talentId/sessions')
  @ApiOperation({ summary: 'Log a practice session' })
  logSession(@Param('talentId') talentId: string, @Body() dto: LogTalentSessionDto) {
    return this.talentsService.logSession(talentId, dto);
  }

  @Get('students/talents/:talentId/sessions')
  @ApiOperation({ summary: 'Get practice sessions' })
  getSessions(@Param('talentId') talentId: string) {
    return this.talentsService.getSessions(talentId);
  }

  @Post('students/talents/:talentId/achievements')
  @ApiOperation({ summary: 'Add an achievement' })
  addAchievement(@Param('talentId') talentId: string, @Body() dto: AddAchievementDto) {
    return this.talentsService.addAchievement(talentId, dto);
  }

  @Get('students/talents/:talentId/achievements')
  @ApiOperation({ summary: 'Get achievements' })
  getAchievements(@Param('talentId') talentId: string) {
    return this.talentsService.getAchievements(talentId);
  }

  @Post('students/talents/:talentId/achievements/:id/certificate')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an achievement certificate' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadCertificate(
    @Param('id') achievementId: string,
    @UploadedFile() file: UploadedFileLike,
  ) {
    const url = await this.storage.upload(`certificates/${achievementId}`, file);
    return this.talentsService.setCertificate(achievementId, url);
  }
}
