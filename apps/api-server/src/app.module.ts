import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PresentationModule } from './presentation/presentation.module';
import { ImageAnalysisModule } from './image-analysis/image-analysis.module';
import { ImageToExcelModule } from './image-to-excel/image-to-excel.module';
import { InterviewModule } from './interview/interview.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    PresentationModule,
    ImageAnalysisModule,
    ImageToExcelModule,
    InterviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
