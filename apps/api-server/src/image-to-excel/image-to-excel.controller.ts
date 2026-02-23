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
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import type { AuthUser } from '../auth/jwt.strategy';
import {
  ImageToExcelService,
  type UploadedFile,
  type UploadResult,
  type StatusResult,
} from './image-to-excel.service';
import type { ImageToExcelType } from './types';

const VALID_TYPES: ImageToExcelType[] = ['receipt', 'namecard'];

@Controller('api/image-to-excel')
@UseGuards(AuthGuard('jwt'))
export class ImageToExcelController {
  constructor(private readonly imageToExcelService: ImageToExcelService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 20, {
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  async uploadFiles(
    @Req() req: Request & { user: AuthUser },
    @UploadedFiles() files: UploadedFile[],
    @Body('type') type: ImageToExcelType,
  ): Promise<UploadResult> {
    if (!VALID_TYPES.includes(type)) {
      throw new BadRequestException(`Invalid type. Allowed values: ${VALID_TYPES.join(', ')}`);
    }
    return this.imageToExcelService.uploadFiles(files, type, req.user.id);
  }

  @Get(':id/status')
  async getStatus(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ): Promise<StatusResult> {
    return this.imageToExcelService.getStatus(id, req.user.id);
  }

  @Get(':id/download')
  async downloadExcel(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.imageToExcelService.getExcelBuffer(id, req.user.id);
    if (!result) {
      throw new NotFoundException('Excel file not found');
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
    res.send(result.buffer);
  }

  @Get(':id/data')
  async getExtractedData(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    const result = await this.imageToExcelService.getExtractedData(id, req.user.id);
    if (!result) {
      throw new NotFoundException('Data not found');
    }
    return result;
  }

  @Get('history')
  async getHistoryList(
    @Req() req: Request & { user: AuthUser },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = Math.max(1, parseInt(page || '1', 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit || '10', 10) || 10));
    return this.imageToExcelService.getHistoryList(req.user.id, parsedPage, parsedLimit);
  }

  @Get('history/:id')
  async getHistoryDetail(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.imageToExcelService.getHistoryDetail(req.user.id, id);
  }

  @Delete('history/:id')
  async deleteHistory(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.imageToExcelService.deleteHistory(req.user.id, id);
  }

  @Get('history/:id/download')
  async downloadHistoryExcel(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.imageToExcelService.regenerateExcel(req.user.id, id);
    if (!result) {
      throw new NotFoundException('Excel file not found');
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
    res.send(result.buffer);
  }
}
