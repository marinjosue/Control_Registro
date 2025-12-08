import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useCitas } from '../../context/CitasContext';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
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
  
  const [filtroTiempo, setFiltroTiempo] = useState('todo');
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);

  const opcionesFiltro = [
    { label: 'Todo el tiempo', value: 'todo' },
    { label: 'Hoy', value: 'hoy' },
    { label: 'Esta semana', value: 'semana' },
    { label: 'Este mes', value: 'mes' },
    { label: 'Este año', value: 'anio' },
    { label: 'Rango personalizado', value: 'personalizado' },
  ];

  useEffect(() => {
    calcularEstadisticas();
  }, [doctorId, filtroTiempo, fechaInicio, fechaFin]);

  const filtrarCitasPorFecha = (citas) => {
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

    switch (filtroTiempo) {
      case 'hoy':
        return citas.filter((c) => {
          const fechaCita = new Date(c.fecha);
          return fechaCita.toDateString() === hoy.toDateString();
        });

      case 'semana':
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6);
        return citas.filter((c) => {
          const fechaCita = new Date(c.fecha);
          return fechaCita >= inicioSemana && fechaCita <= finSemana;
        });

      case 'mes':
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
        return citas.filter((c) => {
          const fechaCita = new Date(c.fecha);
          return fechaCita >= inicioMes && fechaCita <= finMes;
        });

      case 'anio':
        const inicioAnio = new Date(ahora.getFullYear(), 0, 1);
        const finAnio = new Date(ahora.getFullYear(), 11, 31);
        return citas.filter((c) => {
          const fechaCita = new Date(c.fecha);
          return fechaCita >= inicioAnio && fechaCita <= finAnio;
        });

      case 'personalizado':
        if (fechaInicio && fechaFin) {
          const inicio = new Date(fechaInicio);
          inicio.setHours(0, 0, 0, 0);
          const fin = new Date(fechaFin);
          fin.setHours(23, 59, 59, 999);
          return citas.filter((c) => {
            const fechaCita = new Date(c.fecha);
            return fechaCita >= inicio && fechaCita <= fin;
          });
        }
        return citas;

      case 'todo':
      default:
        return citas;
    }
  };

  const calcularEstadisticas = () => {
    const todasCitas = obtenerCitasDoctor(doctorId);
    const citas = filtrarCitasPorFecha(todasCitas);
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

  const limpiarFiltro = () => {
    setFiltroTiempo('todo');
    setFechaInicio(null);
    setFechaFin(null);
  };

  return (
    <div className={styles.estadisticasContainer}>
      <Card className={styles.filtrosCard}>
        <div className={styles.filtrosContainer}>
          <div className={styles.filtroItem}>
            <label htmlFor="filtro-tiempo">Periodo</label>
            <Dropdown
              id="filtro-tiempo"
              value={filtroTiempo}
              options={opcionesFiltro}
              onChange={(e) => setFiltroTiempo(e.value)}
              placeholder="Seleccionar periodo"
              className={styles.dropdown}
            />
          </div>

          {filtroTiempo === 'personalizado' && (
            <>
              <div className={styles.filtroItem}>
                <label htmlFor="fecha-inicio">Fecha inicio</label>
                <Calendar
                  id="fecha-inicio"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.value)}
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccionar fecha"
                  showIcon
                  maxDate={fechaFin || new Date()}
                />
              </div>

              <div className={styles.filtroItem}>
                <label htmlFor="fecha-fin">Fecha fin</label>
                <Calendar
                  id="fecha-fin"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.value)}
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccionar fecha"
                  showIcon
                  minDate={fechaInicio}
                  maxDate={new Date()}
                />
              </div>
            </>
          )}

          {filtroTiempo !== 'todo' && (
            <div className={styles.filtroItem}>
              <Button
                label="Limpiar filtro"
                icon="pi pi-times"
                className="p-button-text"
                onClick={limpiarFiltro}
              />
            </div>
          )}
        </div>
      </Card>
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
