import { Module } from '@nestjs/common';
import { PresentationController } from './presentation.controller';
import { PresentationService } from './presentation.service';
import { ConverterService } from './converter.service';
import { ScriptGeneratorService } from './script-generator.service';

@Module({
  controllers: [PresentationController],
  providers: [PresentationService, ConverterService, ScriptGeneratorService],
  exports: [PresentationService],
})
export class PresentationModule {}
