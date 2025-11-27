
import React, { useState, createContext, useContext, useMemo, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { loginUser, getUserInfo } from '../api/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: (callback: VoidFunction) => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize user on mount if tokens exist
  useEffect(() => {
    const initializeUserFromTokens = async () => {
      const hasAccessToken = typeof window !== 'undefined' && !!localStorage.getItem('access_token');
      const hasRefreshToken = typeof window !== 'undefined' && !!localStorage.getItem('refresh_token');
      if (!hasAccessToken && !hasRefreshToken) return;

      setIsLoading(true);
      setError(null);
      try {
        const userInfo = await getUserInfo();
        const userData: User = {
          name: userInfo.name || userInfo.full_name || userInfo.email?.split('@')[0] || 'کاربر',
          role: userInfo.role || userInfo.user_type || 'ناظر',
          employeeId: userInfo.employee_id || userInfo.id?.toString() || '981234',
          department: userInfo.department || 'فناوری اطلاعات',
        };
        setUser(userData);
      } catch (e) {
        // If user-info fails but token exists, keep user minimal to avoid flashes
        const emailFallback = 'user@example.com';
        setUser({ name: emailFallback.split('@')[0], role: 'ناظر', employeeId: '981234', department: 'فناوری اطلاعات' });
      } finally {
        setIsLoading(false);
      }
    };

    initializeUserFromTokens();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await loginUser({ email, password });
      
      // ذخیره توکن‌ها در localStorage
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      
      // دریافت اطلاعات کاربر از API
      try {
        const userInfo = await getUserInfo();
        const userData: User = {
          name: userInfo.name || userInfo.full_name || email.split('@')[0],
          role: userInfo.role || userInfo.user_type || 'ناظر',
          employeeId: userInfo.employee_id || userInfo.id?.toString() || '981234',
          department: userInfo.department || 'فناوری اطلاعات',
        };
        setUser(userData);
      } catch (userInfoError) {
        // اگر دریافت اطلاعات کاربر با خطا مواجه شد، از داده‌های موقت استفاده می‌کنیم
        console.warn('Could not fetch user info, using fallback data:', userInfoError);
        const mockUser: User = {
          name: email.split('@')[0],
          role: 'ناظر',
          employeeId: '981234',
          department: 'فناوری اطلاعات',
        };
        setUser(mockUser);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'خطا در ورود به سیستم';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (callback: VoidFunction) => {
    // حذف توکن‌ها از localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setError(null);
    callback();
  };

  const value = useMemo(() => ({ 
    user, 
    login, 
    logout, 
    isLoading, 
    error 
  }), [user, isLoading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
