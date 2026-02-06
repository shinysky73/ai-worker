import { GoogleStrategy } from './google.strategy';
import type { Profile } from 'passport-google-oauth20';

const makeProfile = (overrides: Partial<Profile> = {}): Profile =>
  ({
    id: 'google-123',
    displayName: 'Test User',
    emails: [{ value: 'test@example.com', verified: true }],
    photos: [{ value: 'https://example.com/photo.jpg' }],
    provider: 'google',
    profileUrl: '',
    _raw: '',
    _json: {},
    ...overrides,
  }) as Profile;

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(() => {
    strategy = new GoogleStrategy(
      'test-client-id',
      'test-client-secret',
      'http://localhost:3002/api/auth/google/callback',
    );
  });

  it('should transform Google profile into GoogleProfile', async () => {
    const done = jest.fn();
    await strategy.validate('access-token', 'refresh-token', makeProfile(), done);

    expect(done).toHaveBeenCalledWith(null, {
      googleId: 'google-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
    });
  });

  it('should handle profile without photo', async () => {
    const done = jest.fn();
    await strategy.validate(
      'access-token',
      'refresh-token',
      makeProfile({ id: 'google-456', displayName: 'No Pic', photos: [] }),
      done,
    );

    expect(done).toHaveBeenCalledWith(null, {
      googleId: 'google-456',
      email: 'test@example.com',
      name: 'No Pic',
      picture: undefined,
    });
  });

  it('should call done with error when email is missing', async () => {
    const done = jest.fn();
    await strategy.validate(
      'access-token',
      'refresh-token',
      makeProfile({ id: 'google-789', emails: [] as any }),
      done,
    );

    expect(done).toHaveBeenCalledWith(expect.any(Error), undefined);
  });
});
