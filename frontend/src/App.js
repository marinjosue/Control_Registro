import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import { ConfirmDialog } from 'primereact/confirmdialog';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { CitasProvider } from './context/CitasContext';

function App() {
  return (
    <AuthProvider>
      <CitasProvider>
        <BrowserRouter>
          <AppRoutes />
          <ConfirmDialog />
        </BrowserRouter>
      </CitasProvider>
    </AuthProvider>
  );
}

export default App;