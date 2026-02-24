import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

jest.mock('../../generated/prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({})),
}));

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn().mockResolvedValue({ accessToken: 'mock-jwt-token' }),
            login: jest.fn().mockResolvedValue({ accessToken: 'mock-jwt-token' }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should call authService.register and return accessToken', async () => {
      const dto = { email: 'test@example.com', password: 'password123', name: 'Test User' };

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
      expect(result).toEqual({ accessToken: 'mock-jwt-token' });
    });
  });

  describe('login', () => {
    it('should call authService.login and return accessToken', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(result).toEqual({ accessToken: 'mock-jwt-token' });
    });
  });
});
