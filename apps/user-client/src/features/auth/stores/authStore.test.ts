import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './authStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('authStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useAuthStore.getState().logout();
  });

  it('shouldStartLoggedOut: 초기 상태는 로그아웃', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('shouldSetTokenAndDecodeUser: 토큰 설정 시 사용자 정보 디코딩', () => {
    // Create a mock JWT (header.payload.signature)
    const payload = {
      sub: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
    };
    const encodedPayload = btoa(JSON.stringify(payload));
    const mockToken = `header.${encodedPayload}.signature`;

    useAuthStore.getState().setToken(mockToken);

    const state = useAuthStore.getState();
    expect(state.token).toBe(mockToken);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
    });
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
  });

  it('shouldClearOnLogout: 로그아웃 시 토큰과 사용자 정보 삭제', () => {
    const payload = { sub: 'user-1', email: 'test@example.com', name: 'Test' };
    const mockToken = `h.${btoa(JSON.stringify(payload))}.s`;

    useAuthStore.getState().setToken(mockToken);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
  });

  it('shouldHandleUserWithoutPicture: picture 없는 사용자 처리', () => {
    const payload = { sub: 'user-1', email: 'test@example.com', name: 'Test' };
    const mockToken = `h.${btoa(JSON.stringify(payload))}.s`;

    useAuthStore.getState().setToken(mockToken);

    const state = useAuthStore.getState();
    expect(state.user?.picture).toBeUndefined();
  });
});
