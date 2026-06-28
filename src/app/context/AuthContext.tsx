import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 
  | 'Super Admin'
  | 'Hospital Administrator'
  | 'Doctor'
  | 'Nurse'
  | 'ICU Staff'
  | 'Emergency Staff'
  | 'Ambulance Staff'
  | 'Biomedical Engineer'
  | 'IoT Engineer'
  | 'Security Officer'
  | 'Housekeeping Staff'
  | 'Facility Manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock authentication - accept any email/password
    if (email && password) {
      const mockUser: User = {
        id: '1',
        name: role === 'Doctor' ? 'Dr. Sarah Mitchell' :
              role === 'Nurse' ? 'Emily Rodriguez' :
              role === 'ICU Staff' ? 'Dr. James Chen' :
              role === 'Emergency Staff' ? 'Michael Brown' :
              role === 'Biomedical Engineer' ? 'Alex Kumar' :
              role === 'IoT Engineer' ? 'David Park' :
              role === 'Facility Manager' ? 'Robert Johnson' :
              'Administrator',
        email,
        role,
        department: role === 'Doctor' ? 'Cardiology' :
                   role === 'Nurse' ? 'General Ward' :
                   role === 'ICU Staff' ? 'Intensive Care' :
                   role === 'Emergency Staff' ? 'Emergency Department' :
                   'Administration',
      };
      setUser(mockUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
