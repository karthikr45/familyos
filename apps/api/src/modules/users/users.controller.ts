import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto, type UploadedFileLike } from './dto/user.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get the current user profile' })
  getProfile(@CurrentUser('userId') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update the current user profile' })
  updateProfile(@CurrentUser('userId') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('avatar')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an avatar image' })
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@CurrentUser('userId') userId: string, @UploadedFile() file: UploadedFileLike) {
    return this.usersService.uploadAvatar(userId, file);
  }

  @Delete('account')
  @ApiOperation({ summary: 'Soft-delete the current account' })
  deleteAccount(@CurrentUser('userId') userId: string) {
    return this.usersService.deleteAccount(userId);
  }

  @Get('family')
  @ApiOperation({ summary: 'Get the families the user belongs to' })
  getFamily(@CurrentUser('userId') userId: string) {
    return this.usersService.getFamily(userId);
  }
}
