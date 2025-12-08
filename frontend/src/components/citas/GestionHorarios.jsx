import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useCitas } from '../../context/CitasContext';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import styles from './styles/GestionHorarios.module.css';

const GestionHorarios = ({ doctorId }) => {
  const { obtenerHorariosDoctor, actualizarHorarioDoctor, obtenerFranjasHorarias, obtenerHorarioDia } = useCitas();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [franjasHorarias, setFranjasHorarias] = useState([]);
  const [franjasSeleccionadas, setFranjasSeleccionadas] = useState([]);
  const [horarioActual, setHorarioActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const toastRef = React.useRef(null);

  useEffect(() => {
    cargarFranjasHorarias();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      cargarHorarioDia();
    }
  }, [selectedDate]);

  const cargarFranjasHorarias = () => {
    const franjas = obtenerFranjasHorarias();
    setFranjasHorarias(franjas);
  };

  const cargarHorarioDia = () => {
    const fechaStr = selectedDate.toISOString().split('T')[0];
    const horario = obtenerHorarioDia(doctorId, fechaStr);
    
    if (horario) {
      setHorarioActual(horario);
      setFranjasSeleccionadas(horario.franjasDisponibles);
    } else {
      setHorarioActual(null);
      setFranjasSeleccionadas([]);
    }
  };

  const handleFranjaToggle = (franjaId) => {
    setFranjasSeleccionadas((prev) => {
      if (prev.includes(franjaId)) {
        return prev.filter((id) => id !== franjaId);
      } else {
        return [...prev, franjaId];
      }
    });
  };

  const handleSeleccionarTodas = () => {
    const todasIds = franjasHorarias.map((f) => f.id);
    setFranjasSeleccionadas(todasIds);
  };

  const handleDeseleccionarTodas = () => {
    setFranjasSeleccionadas([]);
  };

  const handleGuardarHorario = () => {
    setLoading(true);
    const fechaStr = selectedDate.toISOString().split('T')[0];
    
    try {
      actualizarHorarioDoctor(doctorId, fechaStr, franjasSeleccionadas);
      toastRef.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Horario actualizado correctamente',
        life: 3000,
      });
      cargarHorarioDia();
    } catch (error) {
      toastRef.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el horario',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  };

  return (
    <div className={styles.gestionHorariosContainer}>
      <Toast ref={toastRef} />
      
      <Card className={styles.card}>
        <div className={styles.header}>
          <div>
            <h2>Gestión de Horarios Disponibles</h2>
            <p>Seleccione las franjas horarias en las que estará disponible</p>
          </div>
        </div>

        <div className={styles.content}>
          {/* Selector de Fecha */}
          <div className={styles.dateSelector}>
            <label>Seleccione una fecha:</label>
            <Calendar
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              minDate={new Date()}
              className={styles.calendar}
              inline
              showWeek
            />
          </div>

          {/* Franjas Horarias */}
          <div className={styles.franjasSection}>
            <div className={styles.franjasHeader}>
              <h3>
                {getDayName(selectedDate)} - {selectedDate.toLocaleDateString('es-ES')}
              </h3>
              <div className={styles.franjasActions}>
                <Button
                  label="Seleccionar Todas"
                  icon="pi pi-check"
                  size="small"
                  severity="secondary"
                  outlined
                  onClick={handleSeleccionarTodas}
                />
                <Button
                  label="Deseleccionar Todas"
                  icon="pi pi-times"
                  size="small"
                  severity="secondary"
                  outlined
                  onClick={handleDeseleccionarTodas}
                />
              </div>
            </div>

            {horarioActual && (
              <Message
                severity="info"
                text={`Actualmente tiene ${franjasSeleccionadas.length} franjas disponibles este día`}
                className={styles.infoMessage}
              />
            )}

            <div className={styles.franjasGrid}>
              {franjasHorarias.map((franja) => {
                const isSelected = franjasSeleccionadas.includes(franja.id);
                
                return (
                  <div
                    key={franja.id}
                    className={`${styles.franjaItem} ${isSelected ? styles.franjaSelected : ''}`}
                    onClick={() => handleFranjaToggle(franja.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleFranjaToggle(franja.id)}
                    />
                    <div className={styles.franjaInfo}>
                      <span className={styles.franjaHora}>
                        {franja.hora} - {franja.horaFin}
                      </span>
                      <span className={styles.franjaDuracion}>{franja.duracion} min</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.saveActions}>
              <Button
                label="Guardar Horario"
                icon="pi pi-save"
                onClick={handleGuardarHorario}
                loading={loading}
                className={styles.saveButton}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Información Adicional */}
      <Card className={`${styles.card} ${styles.infoCard}`}>
        <h3>
          <i className="pi pi-info-circle"></i> Información
        </h3>
        <ul>
          <li>Seleccione las franjas horarias en las que estará disponible para consultas</li>
          <li>Puede modificar el horario de cualquier día con anticipación</li>
          <li>Los pacientes solo podrán agendar en las franjas que usted habilite</li>
          <li>Las franjas ya reservadas no podrán ser eliminadas</li>
        </ul>
      </Card>
    </div>
  );
};

GestionHorarios.propTypes = {
  doctorId: PropTypes.number.isRequired,
};

export default GestionHorarios;
