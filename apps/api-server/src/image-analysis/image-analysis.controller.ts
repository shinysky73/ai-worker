import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import * as path from 'path';
import type { AuthUser } from '../auth/jwt.strategy';
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
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  }))
  async uploadFile(
    @Req() req: Request & { user: AuthUser },
    @UploadedFile() file: UploadedFileType,
    @Body() options?: UploadOptions,
  ): Promise<UploadResult> {
    if (options) {
      this.validateOptions(options);
    }
    return this.imageAnalysisService.uploadFile(file, options, req.user.id);
  }

  @Get('history')
  async getHistoryList(
    @Req() req: Request & { user: AuthUser },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = Math.max(1, parseInt(page || '1', 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    return this.imageAnalysisService.getHistoryList(
      req.user.id,
      parsedPage,
      parsedLimit,
    );
  }

  @Get('history/:id')
  async getHistoryDetail(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.imageAnalysisService.getHistoryDetail(req.user.id, id);
  }

  @Delete('history/:id')
  async deleteHistory(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.imageAnalysisService.deleteHistory(req.user.id, id);
  }

  @Get('history/:id/image')
  async getHistoryImage(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const imagePath = await this.imageAnalysisService.getHistoryImagePath(req.user.id, id);
    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    res.setHeader('Content-Type', mimeTypes[ext] || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.sendFile(imagePath);
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
  async getStatus(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ): Promise<StatusResult> {
    return this.imageAnalysisService.getStatus(id, req.user.id);
  }

  @Get(':id/result')
  async getResult(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ): Promise<AnalysisResultWithId> {
    const result = await this.imageAnalysisService.getResult(id, req.user.id);
    if (!result) {
      throw new NotFoundException(`Analysis with ID ${id} not found`);
    }
    return result;
  }
}
