import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../../backend/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Funcție pentru a obține statusul de admin din Firestore
  const fetchAdminStatus = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setIsAdmin(userData.isAdmin === true);
        console.log('[AuthContext] Admin status fetched:', userData.isAdmin === true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching admin status:', error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    console.log('[AuthContext] Setting up auth state listener...');
    try {
      // Subscribe to auth state changes
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log('[AuthContext] Auth state changed:', user ? `User: ${user.email}` : 'No user');
        setIsAuthenticated(!!user);
        setUser(user);

        // Fetch admin status dacă userul este logat
        if (user) {
          await fetchAdminStatus(user.uid);
        } else {
          setIsAdmin(false);
        }
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
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isAdmin, login, logout }}>
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
