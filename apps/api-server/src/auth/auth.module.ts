import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: JWT_EXPIRES_IN as any },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: GoogleStrategy,
      useFactory: () =>
        new GoogleStrategy(
          process.env.GOOGLE_CLIENT_ID || '',
          process.env.GOOGLE_CLIENT_SECRET || '',
          process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3002/api/auth/google/callback',
        ),
    },
    {
      provide: JwtStrategy,
      useFactory: () => new JwtStrategy(JWT_SECRET),
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
