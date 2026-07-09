import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('sentinel_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Mock registration
  const register = async (name, email, password, role) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise((res) => setTimeout(res, 800));

      const registeredUsers = JSON.parse(localStorage.getItem('sentinel_registered_users') || '[]');
      
      // Check if user already exists
      if (registeredUsers.some((u) => u.email === email)) {
        throw new Error('User already registered with this email address.');
      }

      const newUser = { id: Date.now().toString(), name, email, role, password };
      registeredUsers.push(newUser);
      localStorage.setItem('sentinel_registered_users', JSON.stringify(registeredUsers));

      // Auto log in after register
      const sessionUser = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
      localStorage.setItem('sentinel_user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      
      return { success: true, user: sessionUser };
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Mock login
  const login = async (email, password) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise((res) => setTimeout(res, 800));

      const registeredUsers = JSON.parse(localStorage.getItem('sentinel_registered_users') || '[]');
      const foundUser = registeredUsers.find((u) => u.email === email && u.password === password);

      if (!foundUser) {
        throw new Error('Invalid email or password credentials.');
      }

      const sessionUser = { id: foundUser.id, name: foundUser.name, email: foundUser.email, role: foundUser.role };
      localStorage.setItem('sentinel_user', JSON.stringify(sessionUser));
      setUser(sessionUser);

      return { success: true, user: sessionUser };
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('sentinel_user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be executed within an AuthProvider context');
  }
  return context;
};
