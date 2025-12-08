import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCitas } from '../../context/CitasContext';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Avatar } from 'primereact/avatar';
import GestionHorarios from '../../components/citas/GestionHorarios';
import ListaCitas from '../../components/citas/ListaCitas';
import Notificaciones from '../../components/citas/Notificaciones';
import EstadisticasDoctor from '../../components/citas/EstadisticasDoctor';
import styles from './styles/DashboardDoctor.module.css';

const DashboardDoctor = () => {
  const navigate = useNavigate();
  const {
    doctorLogueado,
    logoutDoctor,
    isAuthenticated,
    notificacionesNoLeidas,
    cargarNotificaciones,
  } = useCitas();

  const [activeTab, setActiveTab] = useState('estadisticas');
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !doctorLogueado) {
      navigate('/agenda/login-doctor');
    } else {
      cargarNotificaciones();
    }
  }, [isAuthenticated, doctorLogueado, navigate]);

  if (!doctorLogueado) {
    return null;
  }

  const handleLogout = () => {
    logoutDoctor();
    navigate('/');
  };

  const toggleNotificaciones = () => {
    setShowNotifPanel(!showNotifPanel);
  };

  const tabs = [
    {
      id: 'estadisticas',
      label: 'Estadísticas',
      icon: 'pi pi-chart-bar',
    },
    {
      id: 'horarios',
      label: 'Gestionar Horarios',
      icon: 'pi pi-clock',
    },
    {
      id: 'citas',
      label: 'Mis Citas',
      icon: 'pi pi-calendar',
    },
    {
      id: 'notificaciones',
      label: 'Notificaciones',
      icon: 'pi pi-bell',
      badge: notificacionesNoLeidas,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'estadisticas':
        return <EstadisticasDoctor doctorId={doctorLogueado.id} />;
      case 'horarios':
        return <GestionHorarios doctorId={doctorLogueado.id} />;
      case 'citas':
        return <ListaCitas doctorId={doctorLogueado.id} />;
      case 'notificaciones':
        return <Notificaciones doctorId={doctorLogueado.id} />;
      default:
        return <EstadisticasDoctor doctorId={doctorLogueado.id} />;
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Avatar
            image={doctorLogueado.imagen}
            size="large"
            shape="circle"
            className={styles.avatar}
          />
          <div>
            <h2>{doctorLogueado.nombre}</h2>
            <p>{doctorLogueado.especialidad}</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <Button
            icon="pi pi-bell"
            rounded
            text
            severity="secondary"
            onClick={toggleNotificaciones}
            className={`${styles.notifButton} p-button-lg`}
          >
            {notificacionesNoLeidas > 0 && (
              <Badge value={notificacionesNoLeidas} severity="danger" />
            )}
          </Button>

          <Button
            label="Cerrar Sesión"
            icon="pi pi-sign-out"
            severity="secondary"
            onClick={handleLogout}
          />
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className={styles.tabsNav}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={tab.icon}></i>
            <span>{tab.label}</span>
            {tab.badge > 0 && (
              <Badge value={tab.badge} severity="danger" className={styles.tabBadge} />
            )}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {renderContent()}
      </main>

      {/* Panel de Notificaciones Flotante */}
      {showNotifPanel && (
        <>
          <div
            className={styles.overlay}
            onClick={() => setShowNotifPanel(false)}
          ></div>
          <div className={styles.notifPanel}>
            <div className={styles.notifPanelHeader}>
              <h3>Notificaciones</h3>
              <Button
                icon="pi pi-times"
                rounded
                text
                severity="secondary"
                onClick={() => setShowNotifPanel(false)}
              />
            </div>
            <div className={styles.notifPanelContent}>
              <Notificaciones doctorId={doctorLogueado.id} compact />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardDoctor;
