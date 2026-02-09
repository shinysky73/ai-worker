import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import type { AuthUser } from '../auth/jwt.strategy';
import {
  PresentationService,
  UploadResult,
  StatusResult,
  PresentationResult,
  UploadedFile as UploadedFileType,
  UploadOptions,
} from './presentation.service';

@Controller('api/presentations')
@UseGuards(AuthGuard('jwt'))
export class PresentationController {
  constructor(private readonly presentationService: PresentationService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Req() req: Request & { user: AuthUser },
    @UploadedFile() file: UploadedFileType,
    @Body() options?: UploadOptions,
  ): Promise<UploadResult> {
    if (options) {
      this.validateOptions(options);
    }
    return this.presentationService.uploadFile(file, options, req.user.id);
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

  @Get('history')
  async getHistoryList(
    @Req() req: Request & { user: AuthUser },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.id;
    return this.presentationService.getHistoryList(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('history/:id')
  async getHistoryDetail(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    const userId = req.user.id;
    return this.presentationService.getHistoryDetail(userId, id);
  }

  @Delete('history/:id')
  async deleteHistory(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    const userId = req.user.id;
    return this.presentationService.deleteHistory(userId, id);
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
