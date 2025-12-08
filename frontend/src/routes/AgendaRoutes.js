import React from 'react';
import { Route } from 'react-router-dom';
import Agenda from '../pages/agenda';
import LoginDoctor from '../pages/agenda/LoginDoctor';
import DashboardDoctor from '../pages/agenda/DashboardDoctor';

const AgendaRoutes = () => [
  <Route
    key="agenda"
    path="/agenda"
    element={<Agenda />}
  />,
  <Route
    key="agenda-login-doctor"
    path="/agenda/login-doctor"
    element={<LoginDoctor />}
  />,
  <Route
    key="agenda-doctor-dashboard"
    path="/agenda/doctor/dashboard"
    element={<DashboardDoctor />}
  />,
];

export default AgendaRoutes;
