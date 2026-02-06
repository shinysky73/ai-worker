import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthResult {
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateGoogleUser(profile: GoogleProfile): Promise<AuthResult> {
    const user = await this.prisma.user.upsert({
      where: { googleId: profile.googleId },
      update: {
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
      },
      create: {
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture ?? undefined,
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
