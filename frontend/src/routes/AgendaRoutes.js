import React from 'react';
import { Route } from 'react-router-dom';
import Agenda from '../pages/agenda';

const AgendaRoutes = () => [
  <Route
    key="agenda"
    path="/agenda"
    element={<Agenda />}
  />,
];

export default AgendaRoutes;
