import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { login as apiLogin, signup as apiSignup, setAuthToken } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  is_manager: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  sessionId: string;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  newSession: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function freshSessionId() {
  return crypto.randomUUID();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>(freshSessionId);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    if (storedToken && storedUser) {
      try {
        // Check JWT expiry without a library — exp is in seconds
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setAuthToken(storedToken);
        } else {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const handleAuth = (result: { token: string; user: AuthUser }) => {
    setToken(result.token);
    setUser(result.user);
    setSessionId(freshSessionId());
    setAuthToken(result.token);
    localStorage.setItem('auth_token', result.token);
    localStorage.setItem('auth_user', JSON.stringify(result.user));
  };

  const login = async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    handleAuth(result);
  };

  const signup = async (email: string, password: string) => {
    const result = await apiSignup(email, password);
    handleAuth(result);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const newSession = () => setSessionId(freshSessionId());

  return (
    <AuthContext.Provider value={{ user, token, sessionId, login, signup, logout, newSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
