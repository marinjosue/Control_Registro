import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import QRManager from '../pages/registro_asistencia/QRManager';
import EmpleadosManagement from '../pages/registro_asistencia/EmpleadosManagement';
import UsuariosManagement from '../pages/registro_asistencia/UsuariosManagement';
import AsistenciasManagement from '../pages/registro_asistencia/AsistenciasManagement';
import ReportesManagement from '../pages/registro_asistencia/ReportesManagement';
import JornadaManagementRh from '../pages/registro_asistencia/JornadaManagementRh';
import NotificacionesRh from '../pages/registro_asistencia/NotificacionesRh';
import HorariosRegistradosRh from '../pages/registro_asistencia/HorariosRegistradosRh';
import { PrivateRoute } from './AppRoutes';

const RegistroAsistenciaRoutes = () => [
  <Route
    key="qr-manager"
    path="/rh/qr-manager"
    element={
      <PrivateRoute allowedRoles={['RH']}>
        <QRManager />
      </PrivateRoute>
    }
  />,
  <Route
    key="empleados"
    path="/rh/empleado-management"
    element={
      <PrivateRoute allowedRoles={['RH']}>
        <EmpleadosManagement />
      </PrivateRoute>
    }
  />,
  <Route
    key="empleados"
    path="/rh/reportes"
    element={
      <PrivateRoute allowedRoles={['RH']}>
        <ReportesManagement />
      </PrivateRoute>
    }
  />,
  <Route
    key="empleados"
    path="/rh/user-management"
    element={
      <PrivateRoute allowedRoles={['RH']}>
        <UsuariosManagement />
      </PrivateRoute>
    }
  />,
  <Route
    key="empleados"
    path="/rh/asistencias"
    element={
      <PrivateRoute allowedRoles={['RH']}>
        <AsistenciasManagement />
      </PrivateRoute>
    }
  />,
  <Route
    key="jornada-management"
    path="/rh/jornada-management"
    element={
      <PrivateRoute allowedRoles={['RH']}>
        <JornadaManagementRh />
      </PrivateRoute>
    }
  />,
  <Route
    key="horarios-registrados"
    path="/rh/horarios-registrados"
    element={
      <PrivateRoute allowedRoles={['RH']}>
        <HorariosRegistradosRh />
      </PrivateRoute>
    }
  />,
    <Route
    key="nofificaciones"
    path="/rh/notificaciones"
    element={
      <PrivateRoute allowedRoles={['RH']}>
        <NotificacionesRh />
      </PrivateRoute>
    }
  />,
  <Route
    key="rh"
    path="/rh"
    element={
      <PrivateRoute allowedRoles={['RH']}>
        <Navigate to="/rh/empleado-management" replace />
      </PrivateRoute>
    }
  />,

];

export default RegistroAsistenciaRoutes;