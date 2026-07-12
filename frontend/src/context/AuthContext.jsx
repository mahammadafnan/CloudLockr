import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth state from localStorage and verify JWT validity with backend
  useEffect(() => {
    const verifyToken = async () => {
      const storedUser = localStorage.getItem('cloudlockr_user');
      const storedToken = localStorage.getItem('cloudlockr_token');

      if (storedUser && storedToken) {
        try {
          // Set authorization header globally for all axios requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Verify JWT with backend profile endpoint
          const res = await axios.get('/api/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
          } else {
            logout();
          }
        } catch (error) {
          console.error('[Auth Context] Token verification failed:', error.message);
          logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  // Real Backend Registration API Call
  const register = async (name, email, password, role) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', { name, email, password, role });
      
      const { token, user: sessionUser } = res.data;
      
      // Save session credentials in localStorage
      localStorage.setItem('cloudlockr_token', token);
      localStorage.setItem('cloudlockr_user', JSON.stringify(sessionUser));
      
      // Apply token header globally
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(sessionUser);
      setLoading(false);
      return { success: true, user: sessionUser };
    } catch (error) {
      setLoading(false);
      const message = error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : error.message;
      throw new Error(message);
    }
  };

  // Real Backend Login API Call
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      
      const { token, user: sessionUser } = res.data;
      
      // Save session credentials in localStorage
      localStorage.setItem('cloudlockr_token', token);
      localStorage.setItem('cloudlockr_user', JSON.stringify(sessionUser));
      
      // Apply token header globally
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(sessionUser);
      setLoading(false);
      return { success: true, user: sessionUser };
    } catch (error) {
      setLoading(false);
      const message = error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : error.message;
      throw new Error(message);
    }
  };

  // Logout Session cleaner
  const logout = () => {
    localStorage.removeItem('cloudlockr_user');
    localStorage.removeItem('cloudlockr_token');
    delete axios.defaults.headers.common['Authorization'];
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
