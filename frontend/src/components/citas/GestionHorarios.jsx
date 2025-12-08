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
import { Dropdown } from 'primereact/dropdown';
import { Divider } from 'primereact/divider';
import styles from './styles/GestionHorarios.module.css';

const GestionHorarios = ({ doctorId }) => {
  const { 
    obtenerHorariosDoctor, 
    actualizarHorarioDoctor, 
    obtenerFranjasHorarias, 
    obtenerHorarioDia,
    guardarConfiguracionHorarios,
    obtenerConfiguracionHorarios,
  } = useCitas();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [franjasHorarias, setFranjasHorarias] = useState([]);
  const [franjasSeleccionadas, setFranjasSeleccionadas] = useState([]);
  const [horarioActual, setHorarioActual] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Nuevos estados para configuración personalizada
  const [modoConfiguracion, setModoConfiguracion] = useState('estandar'); // 'estandar' o 'personalizado'
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('18:00');
  const [duracionCita, setDuracionCita] = useState(60);
  const [intervaloEntreCitas, setIntervaloEntreCitas] = useState(0);
  
  const toastRef = React.useRef(null);

  // Cargar configuración guardada al montar el componente
  useEffect(() => {
    const config = obtenerConfiguracionHorarios(doctorId);
    setModoConfiguracion(config.modoConfiguracion);
    setHoraInicio(config.horaInicio);
    setHoraFin(config.horaFin);
    setDuracionCita(config.duracionCita);
    setIntervaloEntreCitas(config.intervaloEntreCitas);
  }, [doctorId]);

  useEffect(() => {
    cargarFranjasHorarias();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      cargarHorarioDia();
    }
  }, [selectedDate]);

  useEffect(() => {
    if (modoConfiguracion === 'personalizado') {
      generarFranjasPersonalizadas();
    } else {
      cargarFranjasHorarias();
    }
  }, [modoConfiguracion, horaInicio, horaFin, duracionCita, intervaloEntreCitas]);

  const cargarFranjasHorarias = () => {
    const franjas = obtenerFranjasHorarias();
    setFranjasHorarias(franjas);
  };

  const generarFranjasPersonalizadas = () => {
    const franjas = [];
    let id = 1;
    
    // Convertir horas de texto a minutos
    const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
    const [horaFinH, horaFinM] = horaFin.split(':').map(Number);
    
    const minutosInicio = horaInicioH * 60 + horaInicioM;
    const minutosFin = horaFinH * 60 + horaFinM;
    
    let minutoActual = minutosInicio;
    
    while (minutoActual + duracionCita <= minutosFin) {
      const horaInicioFranja = Math.floor(minutoActual / 60);
      const minutoInicioFranja = minutoActual % 60;
      
      const minutoFinFranja = minutoActual + duracionCita;
      const horaFinFranja = Math.floor(minutoFinFranja / 60);
      const minutoFinFranjaMin = minutoFinFranja % 60;
      
      const horaStr = `${String(horaInicioFranja).padStart(2, '0')}:${String(minutoInicioFranja).padStart(2, '0')}`;
      const horaFinStr = `${String(horaFinFranja).padStart(2, '0')}:${String(minutoFinFranjaMin).padStart(2, '0')}`;
      
      franjas.push({
        id: id++,
        hora: horaStr,
        horaFin: horaFinStr,
        duracion: duracionCita,
      });
      
      // Agregar duración de cita + intervalo para la siguiente franja
      minutoActual += duracionCita + intervaloEntreCitas;
    }
    
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
      // Guardar configuración de horarios personalizada
      const config = {
        modoConfiguracion,
        horaInicio,
        horaFin,
        duracionCita,
        intervaloEntreCitas,
      };
      guardarConfiguracionHorarios(doctorId, config);
      
      // Guardar franjas seleccionadas para el día
      actualizarHorarioDoctor(doctorId, fechaStr, franjasSeleccionadas);
      
      toastRef.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Horario y configuración actualizados correctamente',
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
            <h2>
              <i className="pi pi-calendar-clock"></i>
              Gestión de Horarios Disponibles
            </h2>
            <p>Configure y seleccione las franjas horarias en las que estará disponible para atender pacientes</p>
          </div>
        </div>

        <div className={styles.content}>
          {/* Selector de Fecha */}
          <div className={styles.dateSelector}>
            <label>
              <i className="pi pi-calendar"></i>
              Seleccione el día a configurar
            </label>
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

          {/* Configuración de Horarios */}
          <Card className={styles.configCard}>
            <h3>
              <i className="pi pi-cog"></i> Configuración de Horarios
            </h3>
            
            <div className={styles.configModo}>
              <label>Modo de configuración:</label>
              <div className={styles.modoButtons}>
                <Button
                  label="Horario Estándar"
                  icon="pi pi-clock"
                  severity={modoConfiguracion === 'estandar' ? 'primary' : 'secondary'}
                  outlined={modoConfiguracion !== 'estandar'}
                  onClick={() => setModoConfiguracion('estandar')}
                  size="small"
                />
                <Button
                  label="Horario Personalizado"
                  icon="pi pi-sliders-h"
                  severity={modoConfiguracion === 'personalizado' ? 'primary' : 'secondary'}
                  outlined={modoConfiguracion !== 'personalizado'}
                  onClick={() => setModoConfiguracion('personalizado')}
                  size="small"
                />
              </div>
            </div>

            {modoConfiguracion === 'personalizado' && (
              <>
                <Divider />
                <div className={styles.configPersonalizada}>
                  <Message
                    severity="info"
                    text="Configure su horario de atención personalizado"
                    className={styles.configMessage}
                  />
                  
                  <div className={styles.configGrid}>
                    <div className={styles.configField}>
                      <label htmlFor="horaInicio">Hora de Inicio:</label>
                      <input
                        id="horaInicio"
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
                        className={styles.timeInput}
                      />
                    </div>

                    <div className={styles.configField}>
                      <label htmlFor="horaFin">Hora de Fin:</label>
                      <input
                        id="horaFin"
                        type="time"
                        value={horaFin}
                        onChange={(e) => setHoraFin(e.target.value)}
                        className={styles.timeInput}
                      />
                    </div>

                    <div className={styles.configField}>
                      <label htmlFor="duracionCita">Duración de cada cita (minutos):</label>
                      <InputNumber
                        id="duracionCita"
                        value={duracionCita}
                        onValueChange={(e) => setDuracionCita(e.value)}
                        min={15}
                        max={180}
                        step={5}
                        showButtons
                        suffix=" min"
                      />
                    </div>

                    <div className={styles.configField}>
                      <label htmlFor="intervaloCitas">Intervalo entre citas (minutos):</label>
                      <InputNumber
                        id="intervaloCitas"
                        value={intervaloEntreCitas}
                        onValueChange={(e) => setIntervaloEntreCitas(e.value)}
                        min={0}
                        max={60}
                        step={5}
                        showButtons
                        suffix=" min"
                      />
                      <small className={styles.fieldHelper}>
                        Tiempo de descanso entre consultas
                      </small>
                    </div>
                  </div>

                  <Message
                    severity="success"
                    text={`Se generarán ${franjasHorarias.length} franjas horarias disponibles`}
                    className={styles.configMessage}
                  />
                </div>
              </>
            )}

            {modoConfiguracion === 'estandar' && (
              <>
                <Divider />
                <Message
                  severity="info"
                  text="Horario estándar: Citas de 60 minutos desde las 08:00 hasta las 18:00 horas"
                  className={styles.configMessage}
                />
              </>
            )}
          </Card>
        </div>

        {/* Franjas Horarias */}
        <div className={styles.franjasSection}>
          <div className={styles.franjasHeader}>
            <h3>
              <i className="pi pi-clock"></i>
              {getDayName(selectedDate)}, {selectedDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
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
              severity="success"
              text={`${franjasSeleccionadas.length} ${franjasSeleccionadas.length === 1 ? 'franja configurada' : 'franjas configuradas'} para este día`}
              className={styles.infoMessage}
            />
          )}
          
          {!horarioActual && franjasSeleccionadas.length > 0 && (
            <Message
              severity="warn"
              text={`No olvide guardar los cambios: ${franjasSeleccionadas.length} ${franjasSeleccionadas.length === 1 ? 'franja seleccionada' : 'franjas seleccionadas'}`}
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
                        <i className="pi pi-clock"></i>
                        {franja.hora} - {franja.horaFin}
                      </span>
                      <span className={styles.franjaDuracion}>
                        <i className="pi pi-stopwatch"></i> {franja.duracion} min
                      </span>
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
