import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useCitas } from '../../context/CitasContext';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import styles from './styles/EstadisticasDoctor.module.css';

const EstadisticasDoctor = ({ doctorId }) => {
  const { obtenerCitasDoctor } = useCitas();
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    confirmadas: 0,
    completadas: 0,
    canceladas: 0,
  });

  useEffect(() => {
    calcularEstadisticas();
  }, [doctorId]);

  const calcularEstadisticas = () => {
    const citas = obtenerCitasDoctor(doctorId);
    setStats({
      total: citas.length,
      pendientes: citas.filter((c) => c.estado === 'pendiente').length,
      confirmadas: citas.filter((c) => c.estado === 'confirmada').length,
      completadas: citas.filter((c) => c.estado === 'completada').length,
      canceladas: citas.filter((c) => c.estado === 'cancelada').length,
    });
  };

  const chartData = {
    labels: ['Pendientes', 'Confirmadas', 'Completadas', 'Canceladas'],
    datasets: [
      {
        data: [stats.pendientes, stats.confirmadas, stats.completadas, stats.canceladas],
        backgroundColor: ['#fbbf24', '#3b82f6', '#10b981', '#ef4444'],
      },
    ],
  };

  return (
    <div className={styles.estadisticasContainer}>
      <div className={styles.statsGrid}>
        <Card className={`${styles.statCard} ${styles.statTotal}`}>
          <div className={styles.statIcon}>
            <i className="pi pi-calendar"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.total}</h3>
            <p>Total de Citas</p>
          </div>
        </Card>

        <Card className={`${styles.statCard} ${styles.statPendientes}`}>
          <div className={styles.statIcon}>
            <i className="pi pi-clock"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.pendientes}</h3>
            <p>Pendientes</p>
          </div>
        </Card>

        <Card className={`${styles.statCard} ${styles.statConfirmadas}`}>
          <div className={styles.statIcon}>
            <i className="pi pi-check"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.confirmadas}</h3>
            <p>Confirmadas</p>
          </div>
        </Card>

        <Card className={`${styles.statCard} ${styles.statCompletadas}`}>
          <div className={styles.statIcon}>
            <i className="pi pi-check-circle"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.completadas}</h3>
            <p>Completadas</p>
          </div>
        </Card>
      </div>

      <Card className={styles.chartCard}>
        <h3>Distribución de Citas</h3>
        <Chart type="doughnut" data={chartData} className={styles.chart} />
      </Card>
    </div>
  );
};

EstadisticasDoctor.propTypes = {
  doctorId: PropTypes.number.isRequired,
};

export default EstadisticasDoctor;
