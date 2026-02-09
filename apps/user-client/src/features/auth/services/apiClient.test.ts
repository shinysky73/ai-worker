import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { setupInterceptors } from './apiClient';

vi.mock('axios', () => {
  const requestHandlers: any[] = [];
  const responseHandlers: any[] = [];
  return {
    default: {
      interceptors: {
        request: {
          use: vi.fn((fn: any) => requestHandlers.push(fn)),
        },
        response: {
          use: vi.fn((ok: any, err: any) => responseHandlers.push({ ok, err })),
        },
      },
      _requestHandlers: requestHandlers,
      _responseHandlers: responseHandlers,
    },
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('apiClient', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useAuthStore.getState().logout();
    (axios as any)._requestHandlers.length = 0;
    (axios as any)._responseHandlers.length = 0;
  });

  it('shouldSetupRequestInterceptor: request 인터셉터가 등록된다', () => {
    setupInterceptors();
    expect(axios.interceptors.request.use).toHaveBeenCalled();
  });

  it('shouldSetupResponseInterceptor: response 인터셉터가 등록된다', () => {
    setupInterceptors();
    expect(axios.interceptors.response.use).toHaveBeenCalled();
  });

  it('shouldAttachAuthorizationHeader: 토큰이 있으면 Authorization 헤더 첨부', () => {
    setupInterceptors();
    const requestInterceptor = (axios as any)._requestHandlers[0];

    const payload = { sub: 'user-1', email: 'test@example.com', name: 'Test' };
    const token = `h.${btoa(JSON.stringify(payload))}.s`;
    useAuthStore.getState().setToken(token);

    const config = { headers: {} } as any;
    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBe(`Bearer ${token}`);
  });

  it('shouldNotAttachHeaderWhenNoToken: 토큰이 없으면 헤더 미첨부', () => {
    setupInterceptors();
    const requestInterceptor = (axios as any)._requestHandlers[0];

    const config = { headers: {} } as any;
    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('shouldLogoutOn401: 401 응답 시 로그아웃 호출', async () => {
    setupInterceptors();
    const errorInterceptor = (axios as any)._responseHandlers[0].err;

    const payload = { sub: 'user-1', email: 'test@example.com', name: 'Test' };
    const token = `h.${btoa(JSON.stringify(payload))}.s`;
    useAuthStore.getState().setToken(token);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    const error = { response: { status: 401 } };
    await expect(errorInterceptor(error)).rejects.toEqual(error);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
