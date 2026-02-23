import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'dev-secret-change-me',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '24h') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: GoogleStrategy,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new GoogleStrategy(
          configService.get<string>('GOOGLE_CLIENT_ID')!,
          configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
          configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3002/api/auth/google/callback',
        ),
    },
    {
      provide: JwtStrategy,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new JwtStrategy(configService.get<string>('JWT_SECRET') || 'dev-secret-change-me'),
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
