import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface AuthState {
  token: string | null;
  userId: string | null;
  displayName: string | null;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (token: string, userId: string, displayName: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  token: null, userId: null, displayName: null, isAuthenticated: false,
  signIn: () => {}, signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const stored = localStorage.getItem('nhc_auth');
    if (stored) {
      try { return { ...JSON.parse(stored), isAuthenticated: true }; }
      catch { /* ignore */ }
    }
    return { token: null, userId: null, displayName: null, isAuthenticated: false };
  });

  const signIn = useCallback((token: string, userId: string, displayName: string) => {
    const newState = { token, userId, displayName, isAuthenticated: true };
    localStorage.setItem('nhc_auth', JSON.stringify(newState));
    setState(newState);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('nhc_auth');
    setState({ token: null, userId: null, displayName: null, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
