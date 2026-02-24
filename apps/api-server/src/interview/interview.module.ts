import { Module } from '@nestjs/common';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { QuestionGeneratorService } from './question-generator.service';
import { InterviewExcelGeneratorService } from './excel-generator.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InterviewController],
  providers: [InterviewService, QuestionGeneratorService, InterviewExcelGeneratorService],
  exports: [InterviewService],
})
export class InterviewModule {}
