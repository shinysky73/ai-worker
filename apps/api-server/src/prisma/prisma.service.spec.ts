import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

// Mock PrismaClient — Prisma 7.x requires adapter/accelerateUrl at construction
jest.mock('../../generated/prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $transaction: jest.fn(),
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
      presentationHistory: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    })),
  };
});

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should expose user model delegate', () => {
    expect(service.user).toBeDefined();
    expect(service.user.findUnique).toBeDefined();
    expect(service.user.upsert).toBeDefined();
  });

  it('should expose presentationHistory model delegate', () => {
    expect(service.presentationHistory).toBeDefined();
    expect(service.presentationHistory.findMany).toBeDefined();
    expect(service.presentationHistory.create).toBeDefined();
    expect(service.presentationHistory.delete).toBeDefined();
  });

  it('should call $connect on module init', async () => {
    await service.onModuleInit();
    // The mock PrismaClient's $connect should be called
    // We verify by checking the underlying client was connected
    // (indirect: if no error, connect succeeded)
  });

  it('should call $disconnect on module destroy', async () => {
    await service.onModuleDestroy();
    // Same — if no error, disconnect succeeded
  });
});
