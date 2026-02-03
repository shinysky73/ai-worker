import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  PresentationService,
  UploadResult,
  StatusResult,
  PresentationResult,
  UploadedFile as UploadedFileType,
  UploadOptions,
} from './presentation.service';

@Controller('api/presentations')
export class PresentationController {
  constructor(private readonly presentationService: PresentationService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: UploadedFileType,
    @Body() options?: UploadOptions,
  ): Promise<UploadResult> {
    if (options) {
      this.validateOptions(options);
    }
    return this.presentationService.uploadFile(file, options);
  }

  private validateOptions(options: UploadOptions): void {
    const validTones = ['formal', 'casual'];
    if (options.tone && !validTones.includes(options.tone)) {
      throw new BadRequestException(
        `Invalid tone. Allowed values: ${validTones.join(', ')}`,
      );
    }

    if (options.targetMinutes !== undefined) {
      if (options.targetMinutes < 1 || options.targetMinutes > 120) {
        throw new BadRequestException(
          'targetMinutes must be between 1 and 120',
        );
      }
    }
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string): Promise<StatusResult> {
    return this.presentationService.getStatus(id);
  }

  @Get(':id/result')
  async getResult(@Param('id') id: string): Promise<PresentationResult> {
    const result = await this.presentationService.getResult(id);
    if (!result) {
      throw new NotFoundException(`Presentation with ID ${id} not found`);
    }
    return result;
  }
}
