import React, { createContext, useContext, useState, useCallback } from 'react';

interface AuthState {
  userId: string | null;
  displayName: string | null;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (displayName: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  userId: null, displayName: null, isAuthenticated: false,
  signIn: () => {}, signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const stored = localStorage.getItem('nhc_player');
    if (stored) {
      try { const d = JSON.parse(stored); return { userId: d.userId, displayName: d.displayName, isAuthenticated: true }; }
      catch { /* ignore */ }
    }
    return { userId: null, displayName: null, isAuthenticated: false };
  });

  const signIn = useCallback((displayName: string) => {
    const userId = crypto.randomUUID();
    const ns = { userId, displayName, isAuthenticated: true };
    localStorage.setItem('nhc_player', JSON.stringify({ userId, displayName }));
    setState(ns);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('nhc_player');
    setState({ userId: null, displayName: null, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
