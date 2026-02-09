import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

function decodeJwtPayload(token: string): AuthUser | null {
  try {
    const base64 = token.split('.')[1];
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  setToken: (token: string) => {
    localStorage.setItem('token', token);
    const user = decodeJwtPayload(token);
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
