import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ImageAnalysisService,
  UploadResult,
  StatusResult,
  AnalysisResultWithId,
  UploadedFile as UploadedFileType,
  UploadOptions,
} from './image-analysis.service';

@Controller('api/image-analysis')
@UseGuards(AuthGuard('jwt'))
export class ImageAnalysisController {
  constructor(private readonly imageAnalysisService: ImageAnalysisService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: UploadedFileType,
    @Body() options?: UploadOptions,
  ): Promise<UploadResult> {
    if (options) {
      this.validateOptions(options);
    }
    return this.imageAnalysisService.uploadFile(file, options);
  }

  private validateOptions(options: UploadOptions): void {
    const validDetailLevels = ['brief', 'detailed'];
    if (options.detailLevel && !validDetailLevels.includes(options.detailLevel)) {
      throw new BadRequestException(
        `Invalid detailLevel. Allowed values: ${validDetailLevels.join(', ')}`,
      );
    }

    const validLanguages = ['ko', 'en'];
    if (options.language && !validLanguages.includes(options.language)) {
      throw new BadRequestException(
        `Invalid language. Allowed values: ${validLanguages.join(', ')}`,
      );
    }
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string): Promise<StatusResult> {
    return this.imageAnalysisService.getStatus(id);
  }

  @Get(':id/result')
  async getResult(@Param('id') id: string): Promise<AnalysisResultWithId> {
    const result = await this.imageAnalysisService.getResult(id);
    if (!result) {
      throw new NotFoundException(`Analysis with ID ${id} not found`);
    }
    return result;
  }
}
