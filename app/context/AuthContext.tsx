import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../../backend/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    console.log('[AuthContext] Setting up auth state listener...');
    try {
      // Subscribe to auth state changes
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('[AuthContext] Auth state changed:', user ? `User: ${user.email}` : 'No user');
        setIsAuthenticated(!!user);
        setUser(user);
      }, (error) => {
        console.error('[AuthContext] Auth state change error:', error);
      });

      console.log('[AuthContext] Auth state listener set up successfully');

      // Cleanup subscription on unmount
      return () => {
        console.log('[AuthContext] Cleaning up auth state listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('[AuthContext] Error setting up auth state listener:', error);
    }
  }, []);

  const login = () => {
    console.log('[AuthContext] login called');
    setIsAuthenticated(true);
  };

  const logout = () => {
    console.log('[AuthContext] logout called');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;
