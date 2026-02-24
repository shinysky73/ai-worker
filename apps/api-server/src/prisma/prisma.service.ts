import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: PrismaClient;
  private pool: Pool;

  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(this.pool);
    this.client = new PrismaClient({ adapter } as any);
  }

  get user() {
    return this.client.user;
  }

  get presentationHistory() {
    return this.client.presentationHistory;
  }

  get imageAnalysisHistory() {
    return this.client.imageAnalysisHistory;
  }

  get imageToExcelHistory() {
    return this.client.imageToExcelHistory;
  }

  get $transaction() {
    return this.client.$transaction.bind(this.client);
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
    await this.pool.end();
  }
}
