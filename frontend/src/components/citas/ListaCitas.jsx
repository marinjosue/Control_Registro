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
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import styles from './styles/ListaCitas.module.css';

const ListaCitas = ({ doctorId }) => {
  const { obtenerCitasDoctor, cambiarEstadoCita, cancelarCita } = useCitas();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedCita, setSelectedCita] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
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

  const cancelarCitaConfirm = (cita) => {
    setSelectedCita(cita);
    setMotivoCancelacion('');
    setShowCancelDialog(true);
  };

  const handleCancelarCita = () => {
    if (!motivoCancelacion.trim()) {
      toastRef.current.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Debe ingresar el motivo de cancelación', 
        life: 3000 
      });
      return;
    }

    const result = cancelarCita(selectedCita.id, motivoCancelacion);
    if (result.success) {
      toastRef.current.show({ 
        severity: 'warn', 
        summary: 'Cancelada', 
        detail: 'Cita cancelada correctamente', 
        life: 3000 
      });
      setShowCancelDialog(false);
      setSelectedCita(null);
      setMotivoCancelacion('');
      cargarCitas();
    }
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
            tooltip="Confirmar cita"
            tooltipOptions={{ position: 'left', showDelay: 300 }}
            onClick={() => confirmarCita(rowData.id)}
            aria-label="Confirmar cita"
          />
        )}
        {rowData.estado === 'confirmada' && (
          <Button
            icon="pi pi-check-circle"
            rounded
            text
            severity="info"
            tooltip="Completar cita"
            tooltipOptions={{ position: 'left', showDelay: 300 }}
            onClick={() => completarCita(rowData.id)}
            aria-label="Completar cita"
          />
        )}
        {rowData.estado !== 'cancelada' && rowData.estado !== 'completada' && (
          <Button
            icon="pi pi-times"
            rounded
            text
            severity="danger"
            tooltip="Cancelar cita"
            tooltipOptions={{ position: 'left', showDelay: 300 }}
            onClick={() => cancelarCitaConfirm(rowData)}
            aria-label="Cancelar cita"
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

      <Dialog
        header="Cancelar Cita"
        visible={showCancelDialog}
        style={{ width: '450px' }}
        onHide={() => {
          setShowCancelDialog(false);
          setSelectedCita(null);
          setMotivoCancelacion('');
        }}
        footer={
          <div>
            <Button
              label="Cancelar"
              icon="pi pi-times"
              onClick={() => {
                setShowCancelDialog(false);
                setSelectedCita(null);
                setMotivoCancelacion('');
              }}
              className="p-button-text"
            />
            <Button
              label="Confirmar Cancelación"
              icon="pi pi-check"
              onClick={handleCancelarCita}
              severity="danger"
            />
          </div>
        }
      >
        <div className={styles.dialogContent}>
          <p className={styles.confirmMessage}>
            <i className="pi pi-exclamation-triangle" style={{ fontSize: '2rem', color: '#f59e0b' }}></i>
            <span>¿Está seguro que desea cancelar esta cita?</span>
          </p>
          
          {selectedCita && (
            <div className={styles.citaInfo}>
              <p><strong>Paciente:</strong> {selectedCita.paciente.nombre}</p>
              <p><strong>Fecha:</strong> {new Date(selectedCita.fecha).toLocaleDateString('es-ES')}</p>
              <p><strong>Hora:</strong> {selectedCita.franja.hora}</p>
            </div>
          )}

          <div className={styles.motivoField}>
            <label htmlFor="motivo"><strong>Motivo de cancelación *</strong></label>
            <InputTextarea
              id="motivo"
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              rows={4}
              placeholder="Ingrese el motivo por el cual cancela esta cita..."
              autoResize
              className={styles.textarea}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

ListaCitas.propTypes = {
  doctorId: PropTypes.number.isRequired,
};

export default ListaCitas;
