import { Module } from '@nestjs/common';
import { TuitionsController } from './tuitions.controller';
import { TuitionsService } from './tuitions.service';

@Module({
  controllers: [TuitionsController],
  providers: [TuitionsService],
  exports: [TuitionsService],
})
export class TuitionsModule {}
