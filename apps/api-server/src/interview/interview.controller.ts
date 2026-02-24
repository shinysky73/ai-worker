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
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import type { AuthUser } from '../auth/jwt.strategy';
import { InterviewService, type SubmitResult, type StatusResult } from './interview.service';

interface GenerateDto {
  jdText: string;
  jobCategory?: string;
}

@Controller('api/interview')
@UseGuards(AuthGuard('jwt'))
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post('generate')
  async generate(
    @Req() req: Request & { user: AuthUser },
    @Body() body: GenerateDto,
  ): Promise<SubmitResult> {
    const jobCategory = body.jobCategory || '일반/기타';
    return this.interviewService.submitJd(body.jdText, jobCategory, req.user.id);
  }

  @Get(':id/status')
  async getStatus(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ): Promise<StatusResult> {
    return this.interviewService.getStatus(id, req.user.id);
  }

  @Get(':id/download')
  async downloadExcel(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.interviewService.getExcelBuffer(id, req.user.id);
    if (!result) {
      throw new NotFoundException('Excel file not found');
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
    res.send(result.buffer);
  }

  @Get('history')
  async getHistoryList(
    @Req() req: Request & { user: AuthUser },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = Math.max(1, parseInt(page || '1', 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit || '10', 10) || 10));
    return this.interviewService.getHistoryList(req.user.id, parsedPage, parsedLimit);
  }

  @Get('history/:id')
  async getHistoryDetail(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.interviewService.getHistoryDetail(req.user.id, id);
  }

  @Delete('history/:id')
  async deleteHistory(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.interviewService.deleteHistory(req.user.id, id);
  }

  @Get('history/:id/download')
  async downloadHistoryExcel(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.interviewService.regenerateExcel(req.user.id, id);
    if (!result) {
      throw new NotFoundException('Excel file not found');
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
    res.send(result.buffer);
  }
}
