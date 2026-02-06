import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService, GoogleProfile } from './auth.service';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5175';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as GoogleProfile | null;

    if (!profile) {
      res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
      return;
    }

    try {
      const { accessToken } = await this.authService.validateGoogleUser(profile);
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${accessToken}`);
    } catch {
      res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
    }
  }
}
