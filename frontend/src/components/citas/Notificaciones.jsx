import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useCitas } from '../../context/CitasContext';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Message } from 'primereact/message';
import styles from './styles/Notificaciones.module.css';

const Notificaciones = ({ doctorId, compact = false }) => {
  const { notificaciones, marcarNotificacionLeida, marcarTodasLeidas, cargarNotificaciones } = useCitas();
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    cargarNotificaciones();
  }, [doctorId]);

  useEffect(() => {
    setNotifs(notificaciones);
  }, [notificaciones]);

  const handleMarcarLeida = (notifId) => {
    marcarNotificacionLeida(notifId);
  };

  const handleMarcarTodasLeidas = () => {
    marcarTodasLeidas();
  };

  const getIcon = (tipo) => {
    switch (tipo) {
      case 'nueva_cita':
        return 'pi pi-calendar-plus';
      case 'cancelacion':
        return 'pi pi-times-circle';
      default:
        return 'pi pi-info-circle';
    }
  };

  const getSeverity = (tipo) => {
    switch (tipo) {
      case 'nueva_cita':
        return 'success';
      case 'cancelacion':
        return 'warn';
      default:
        return 'info';
    }
  };

  return (
    <div className={`${styles.notificacionesContainer} ${compact ? styles.compact : ''}`}>
      {!compact && (
        <Card className={styles.card}>
          <div className={styles.header}>
            <h2>Notificaciones</h2>
            {notifs.filter((n) => !n.leida).length > 0 && (
              <Button
                label="Marcar todas como leídas"
                icon="pi pi-check"
                size="small"
                severity="secondary"
                outlined
                onClick={handleMarcarTodasLeidas}
              />
            )}
          </div>
        </Card>
      )}

      <div className={styles.notifsList}>
        {notifs.length === 0 ? (
          <Message severity="info" text="No hay notificaciones" className={styles.emptyMessage} />
        ) : (
          notifs.map((notif) => (
            <div
              key={notif.id}
              className={`${styles.notifItem} ${!notif.leida ? styles.notifNoLeida : ''}`}
            >
              <div className={styles.notifIcon}>
                <i className={getIcon(notif.tipo)}></i>
              </div>
              <div className={styles.notifContent}>
                <div className={styles.notifHeader}>
                  <h4>{notif.titulo}</h4>
                  {!notif.leida && <Badge value="Nueva" severity="danger" />}
                </div>
                <p>{notif.mensaje}</p>
                <span className={styles.notifFecha}>
                  {new Date(notif.fecha).toLocaleString('es-ES')}
                </span>
              </div>
              {!notif.leida && (
                <Button
                  icon="pi pi-check"
                  rounded
                  text
                  severity="secondary"
                  tooltip="Marcar como leída"
                  onClick={() => handleMarcarLeida(notif.id)}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

Notificaciones.propTypes = {
  doctorId: PropTypes.number.isRequired,
  compact: PropTypes.bool,
};

export default Notificaciones;
