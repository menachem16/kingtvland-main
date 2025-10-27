import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { googleSheets, type GoogleSheetsUser } from '@/integrations/google-sheets/client';

interface User {
  id: string;
  email: string;
}

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  session: { user: User } | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ user: User } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const checkSession = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedProfile = localStorage.getItem('profile');
        
        if (storedUser && storedProfile) {
          const parsedUser = JSON.parse(storedUser);
          const parsedProfile = JSON.parse(storedProfile);
          
          setUser(parsedUser);
          setSession({ user: parsedUser });
          setProfile(parsedProfile);
        }
      } catch (error) {
        console.error('Error loading session:', error);
        // Clear corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('profile');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { user: googleSheetsUser, error } = await googleSheets.signIn(email, password);
      
      if (error || !googleSheetsUser) {
        return { error };
      }

      // Create user and profile objects
      const userObj: User = {
        id: googleSheetsUser.id,
        email: googleSheetsUser.email,
      };

      const profileObj: Profile = {
        id: googleSheetsUser.id,
        user_id: googleSheetsUser.id,
        first_name: googleSheetsUser.firstName,
        last_name: googleSheetsUser.lastName,
        phone: googleSheetsUser.phone,
        avatar_url: googleSheetsUser.avatarUrl,
        is_admin: googleSheetsUser.isAdmin,
      };

      // Store in state
      setUser(userObj);
      setSession({ user: userObj });
      setProfile(profileObj);

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(userObj));
      localStorage.setItem('profile', JSON.stringify(profileObj));

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const { user: googleSheetsUser, error } = await googleSheets.signUp(email, password, firstName, lastName);
      
      if (error || !googleSheetsUser) {
        return { error };
      }

      // Create user and profile objects
      const userObj: User = {
        id: googleSheetsUser.id,
        email: googleSheetsUser.email,
      };

      const profileObj: Profile = {
        id: googleSheetsUser.id,
        user_id: googleSheetsUser.id,
        first_name: googleSheetsUser.firstName,
        last_name: googleSheetsUser.lastName,
        phone: googleSheetsUser.phone,
        avatar_url: googleSheetsUser.avatarUrl,
        is_admin: googleSheetsUser.isAdmin,
      };

      // Store in state
      setUser(userObj);
      setSession({ user: userObj });
      setProfile(profileObj);

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(userObj));
      localStorage.setItem('profile', JSON.stringify(profileObj));

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    // Clear state
    setUser(null);
    setSession(null);
    setProfile(null);

    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
  };

  const value = {
    user,
    session,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
