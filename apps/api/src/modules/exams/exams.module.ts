import { Module } from '@nestjs/common';
import { ExamsController } from './exams.controller';
import { StudentExamsController } from './student-exams.controller';
import { ExamsService } from './exams.service';

@Module({
  controllers: [ExamsController, StudentExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
