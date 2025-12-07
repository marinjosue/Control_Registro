import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { login as loginService, logout as logoutService, isAuthenticated } from '../services/authService';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Intenta cargar el usuario desde localStorage al iniciar
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (isAuthenticated()) {
      // Si hay token pero no usuario, intenta cargar de localStorage
      if (!user) {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
      }
    } else {
      setUser(null);
      localStorage.removeItem('user');
    }
  }, [user]); 

  const login = async (credentials) => {
    const data = await loginService(credentials);
    setUser(data.usuario);
    localStorage.setItem('user', JSON.stringify(data.usuario)); 
  };

  const logout = () => {
    logoutService();
    setUser(null);
    localStorage.removeItem('user');

  };

  const contextValue = useMemo(() => ({
    user,
    login,
    logout,
    isAuthenticated: !!user
  }), [user]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);

