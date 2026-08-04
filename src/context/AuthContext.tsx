import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser, LoginCredentials } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: (googleId: string, googleEmail: string, fullName: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session
    const storedToken = localStorage.getItem('sem_auth_token');
    const storedUser = localStorage.getItem('sem_auth_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await apiService.login(credentials);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('sem_auth_token', response.token);
      localStorage.setItem('sem_auth_user', JSON.stringify(response.user));
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
    setIsLoading(false);
  };

  const loginWithGoogle = async (googleId: string, googleEmail: string, fullName: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.loginWithGoogle(googleId, googleEmail, fullName);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('sem_auth_token', response.token);
      localStorage.setItem('sem_auth_user', JSON.stringify(response.user));
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
    setIsLoading(false);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sem_auth_token');
    localStorage.removeItem('sem_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithGoogle, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


