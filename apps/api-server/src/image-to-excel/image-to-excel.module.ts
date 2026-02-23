import { Module } from '@nestjs/common';
import { ImageToExcelController } from './image-to-excel.controller';
import { ImageToExcelService } from './image-to-excel.service';
import { DataExtractorService } from './data-extractor.service';
import { ExcelGeneratorService } from './excel-generator.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ImageToExcelController],
  providers: [ImageToExcelService, DataExtractorService, ExcelGeneratorService],
  exports: [ImageToExcelService],
})
export class ImageToExcelModule {}
