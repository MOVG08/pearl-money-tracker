import React, { createContext, useContext, useState } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading] = useState(false);

  // These will be replaced with real Supabase auth calls
  const signIn = async (_email: string, _password: string) => {
    // TODO: Replace with supabase.auth.signInWithPassword
    setUser({ id: '1', email: _email, name: 'Usuario' });
  };

  const signUp = async (_email: string, _password: string, _name: string) => {
    // TODO: Replace with supabase.auth.signUp
    setUser({ id: '1', email: _email, name: _name });
  };

  const signOut = () => {
    // TODO: Replace with supabase.auth.signOut
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
