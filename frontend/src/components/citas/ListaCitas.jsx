import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useCitas } from '../../context/CitasContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { confirmDialog } from 'primereact/confirmdialog';
import styles from './styles/ListaCitas.module.css';

const ListaCitas = ({ doctorId }) => {
  const { obtenerCitasDoctor, cambiarEstadoCita, cancelarCita } = useCitas();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const toastRef = React.useRef(null);

  useEffect(() => {
    cargarCitas();
  }, [doctorId]);

  const cargarCitas = () => {
    setLoading(true);
    const citasDoctor = obtenerCitasDoctor(doctorId);
    // Ordenar por fecha y hora
    const citasOrdenadas = citasDoctor.sort((a, b) => {
      if (a.fecha === b.fecha) {
        return a.franja.hora.localeCompare(b.franja.hora);
      }
      return a.fecha.localeCompare(b.fecha);
    });
    setCitas(citasOrdenadas);
    setLoading(false);
  };

  const confirmarCita = (citaId) => {
    confirmDialog({
      message: '¿Desea confirmar esta cita?',
      header: 'Confirmación',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, confirmar',
      rejectLabel: 'Cancelar',
      accept: () => {
        const result = cambiarEstadoCita(citaId, 'confirmada');
        if (result.success) {
          toastRef.current.show({ severity: 'success', summary: 'Éxito', detail: 'Cita confirmada', life: 3000 });
          cargarCitas();
        }
      },
    });
  };

  const completarCita = (citaId) => {
    confirmDialog({
      message: '¿Marcar esta cita como completada?',
      header: 'Completar Cita',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, completar',
      rejectLabel: 'Cancelar',
      accept: () => {
        const result = cambiarEstadoCita(citaId, 'completada');
        if (result.success) {
          toastRef.current.show({ severity: 'success', summary: 'Éxito', detail: 'Cita completada', life: 3000 });
          cargarCitas();
        }
      },
    });
  };

  const cancelarCitaConfirm = (citaId) => {
    confirmDialog({
      message: '¿Está seguro de cancelar esta cita?',
      header: 'Cancelar Cita',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar',
      rejectLabel: 'No',
      acceptClassName: 'p-button-danger',
      accept: () => {
        const result = cancelarCita(citaId);
        if (result.success) {
          toastRef.current.show({ severity: 'warn', summary: 'Cancelada', detail: 'Cita cancelada', life: 3000 });
          cargarCitas();
        }
      },
    });
  };

  const estadoBodyTemplate = (rowData) => {
    const severityMap = {
      pendiente: 'warning',
      confirmada: 'info',
      completada: 'success',
      cancelada: 'danger',
    };

    return <Tag value={rowData.estado.toUpperCase()} severity={severityMap[rowData.estado]} />;
  };

  const fechaBodyTemplate = (rowData) => {
    return new Date(rowData.fecha).toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const horaBodyTemplate = (rowData) => {
    return `${rowData.franja.hora} - ${rowData.franja.horaFin}`;
  };

  const accionesBodyTemplate = (rowData) => {
    return (
      <div className={styles.actions}>
        {rowData.estado === 'pendiente' && (
          <Button
            icon="pi pi-check"
            rounded
            text
            severity="success"
            tooltip="Confirmar"
            onClick={() => confirmarCita(rowData.id)}
          />
        )}
        {rowData.estado === 'confirmada' && (
          <Button
            icon="pi pi-check-circle"
            rounded
            text
            severity="info"
            tooltip="Completar"
            onClick={() => completarCita(rowData.id)}
          />
        )}
        {rowData.estado !== 'cancelada' && rowData.estado !== 'completada' && (
          <Button
            icon="pi pi-times"
            rounded
            text
            severity="danger"
            tooltip="Cancelar"
            onClick={() => cancelarCitaConfirm(rowData.id)}
          />
        )}
      </div>
    );
  };

  return (
    <div className={styles.listaCitasContainer}>
      <Toast ref={toastRef} />
      
      <Card className={styles.card}>
        <h2>Mis Citas Agendadas</h2>
        
        <DataTable
          value={citas}
          loading={loading}
          paginator
          rows={10}
          dataKey="id"
          emptyMessage="No hay citas agendadas"
          className={styles.tabla}
        >
          <Column field="paciente.nombre" header="Paciente" sortable />
          <Column field="paciente.cedula" header="Cédula" sortable />
          <Column body={fechaBodyTemplate} header="Fecha" sortable field="fecha" />
          <Column body={horaBodyTemplate} header="Hora" />
          <Column field="motivo" header="Motivo" />
          <Column body={estadoBodyTemplate} header="Estado" sortable field="estado" />
          <Column body={accionesBodyTemplate} header="Acciones" />
        </DataTable>
      </Card>
    </div>
  );
};

ListaCitas.propTypes = {
  doctorId: PropTypes.number.isRequired,
};

export default ListaCitas;
