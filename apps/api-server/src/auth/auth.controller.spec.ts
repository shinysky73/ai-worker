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
            validateGoogleUser: jest.fn().mockResolvedValue({
              accessToken: 'mock-jwt-token',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('googleCallback', () => {
    it('should redirect to frontend with JWT token on success', async () => {
      const mockReq = {
        user: {
          googleId: 'google-123',
          email: 'test@example.com',
          name: 'Test User',
          picture: 'https://example.com/photo.jpg',
        },
      };

      const mockRes = {
        redirect: jest.fn(),
      };

      await controller.googleCallback(mockReq as any, mockRes as any);

      expect(authService.validateGoogleUser).toHaveBeenCalledWith(mockReq.user);
      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining('token=mock-jwt-token'),
      );
    });

    it('should redirect to login with error when user is not in request', async () => {
      const mockReq = { user: null };
      const mockRes = { redirect: jest.fn() };

      await controller.googleCallback(mockReq as any, mockRes as any);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/login?error='),
      );
    });
  });
});
