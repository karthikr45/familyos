import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FamilyGuard } from '../../common/guards/family.guard';
import { TuitionsService } from './tuitions.service';
import {
  AddTuitionDto,
  MarkAttendanceDto,
  RecordPaymentDto,
  UpdateTuitionDto,
} from './dto/tuition.dto';

@ApiTags('tuitions')
@ApiBearerAuth()
@Controller()
export class TuitionsController {
  constructor(private readonly tuitionsService: TuitionsService) {}

  @Post('students/:id/tuitions')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Add a tuition' })
  add(@Param('id') id: string, @Body() dto: AddTuitionDto) {
    return this.tuitionsService.addTuition(id, dto);
  }

  @Get('students/:id/tuitions')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Get all tuitions' })
  list(@Param('id') id: string) {
    return this.tuitionsService.getTuitions(id);
  }

  @Get('students/:id/tuition-summary')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'All tuitions summary for a parent' })
  summary(@Param('id') id: string) {
    return this.tuitionsService.getSummary(id);
  }

  @Patch('students/tuitions/:id')
  @ApiOperation({ summary: 'Update tuition details' })
  update(@Param('id') id: string, @Body() dto: UpdateTuitionDto) {
    return this.tuitionsService.updateTuition(id, dto);
  }

  @Delete('students/tuitions/:id')
  @ApiOperation({ summary: 'Remove a tuition' })
  remove(@Param('id') id: string) {
    return this.tuitionsService.removeTuition(id);
  }

  @Post('students/tuitions/:id/attendance')
  @ApiOperation({ summary: 'Mark attendance' })
  markAttendance(@Param('id') id: string, @Body() dto: MarkAttendanceDto) {
    return this.tuitionsService.markAttendance(id, dto);
  }

  @Get('students/tuitions/:id/attendance')
  @ApiOperation({ summary: 'Get attendance history' })
  attendance(@Param('id') id: string) {
    return this.tuitionsService.getAttendance(id);
  }

  @Get('students/tuitions/:id/attendance/stats')
  @ApiOperation({ summary: 'Attendance percentage' })
  attendanceStats(@Param('id') id: string) {
    return this.tuitionsService.getAttendanceStats(id);
  }

  @Post('students/tuitions/:id/payments')
  @ApiOperation({ summary: 'Record a payment' })
  recordPayment(@Param('id') id: string, @Body() dto: RecordPaymentDto) {
    return this.tuitionsService.recordPayment(id, dto);
  }

  @Get('students/tuitions/:id/payments')
  @ApiOperation({ summary: 'Payment history' })
  payments(@Param('id') id: string) {
    return this.tuitionsService.getPayments(id);
  }

  @Get('students/tuitions/:id/effectiveness')
  @ApiOperation({ summary: 'Correlation: tuition attendance vs exam scores' })
  effectiveness(@Param('id') id: string) {
    return this.tuitionsService.getEffectiveness(id);
  }
}
