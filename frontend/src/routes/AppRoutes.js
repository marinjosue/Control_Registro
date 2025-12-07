import React from 'react';
import PropTypes from 'prop-types';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import Principal from '../pages/principal';
import { useAuth } from '../context/AuthContext';

// Importar las rutas por área
import RegistroAsistenciaRoutes from './RegistroAsistenciaRoutes';
import AgendaRoutes from './AgendaRoutes';

export const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  // Si se especifican roles permitidos, verificar que el usuario tenga uno de ellos
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.rol)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.array,
};

const AppRoutes = () => (
  <Routes>
    {/* Ruta principal - Landing Page */}
    <Route path="/" element={<Principal />} />
    
    {/* Rutas públicas */}
    <Route path="/login" element={<Login />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password/:token" element={<ResetPassword />} />
    
    {/* Rutas de Agenda (público) */}
    {AgendaRoutes()}
    
    {/* Rutas de Registro de Asistencia (privado) */}
    {RegistroAsistenciaRoutes()}
    
    {/* Ruta por defecto */}
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);

export default AppRoutes;