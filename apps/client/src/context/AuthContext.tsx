import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { AuthUser, LoginRequest, SignupRequest } from '@devmeet/shared';
import { authService } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<{ username: string; message: string }>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, try to restore session from httpOnly cookie
  useEffect(() => {
    authService
      .me()
      .then((u) => setUser(u))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (data: LoginRequest): Promise<void> => {
    const loggedInUser = await authService.login(data);
    setUser(loggedInUser);
  };

  const signup = async (data: SignupRequest): Promise<{ username: string; message: string }> => {
    return authService.signup(data);
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
