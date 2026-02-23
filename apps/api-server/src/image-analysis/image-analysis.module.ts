import { Module } from '@nestjs/common';
import { ImageAnalysisController } from './image-analysis.controller';
import { ImageAnalysisService } from './image-analysis.service';
import { ImageAnalyzerService } from './image-analyzer.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ImageAnalysisController],
  providers: [ImageAnalysisService, ImageAnalyzerService],
  exports: [ImageAnalysisService],
})
export class ImageAnalysisModule {}
