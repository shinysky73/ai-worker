import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy('test-secret');
  });

  it('should extract user info from valid JWT payload', async () => {
    const payload = {
      sub: 'user-uuid-1',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      id: 'user-uuid-1',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
    });
  });

  it('should handle payload without picture', async () => {
    const payload = {
      sub: 'user-uuid-2',
      email: 'nopic@example.com',
      name: 'No Pic',
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      id: 'user-uuid-2',
      email: 'nopic@example.com',
      name: 'No Pic',
      picture: undefined,
    });
  });
});
