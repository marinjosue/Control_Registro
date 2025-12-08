import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  citasDB,
  doctores,
  pacientes,
  franjasHorariasDefault,
  autenticarDoctor,
  autenticarPaciente,
  getCitaCompleta,
} from '../data/citasData';

const CitasContext = createContext();

export const CitasProvider = ({ children }) => {
  // Estado del doctor logueado
  const [doctorLogueado, setDoctorLogueado] = useState(() => {
    const stored = localStorage.getItem('doctorCitas');
    return stored ? JSON.parse(stored) : null;
  });

  // Estado del paciente logueado (temporal para agendar cita)
  const [pacienteTemp, setPacienteTemp] = useState(null);

  // Notificaciones
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);

  // Cargar notificaciones del doctor
  useEffect(() => {
    if (doctorLogueado) {
      cargarNotificaciones();
    }
  }, [doctorLogueado]);

  const cargarNotificaciones = () => {
    if (!doctorLogueado) return;
    const notifs = citasDB.getNotificacionesByDoctor(doctorLogueado.id);
    setNotificaciones(notifs);
    const noLeidas = notifs.filter((n) => !n.leida).length;
    setNotificacionesNoLeidas(noLeidas);
  };

  // ============ AUTENTICACIÓN ============
  const loginDoctor = (usuario, password) => {
    const doctor = autenticarDoctor(usuario, password);
    if (doctor) {
      setDoctorLogueado(doctor);
      localStorage.setItem('doctorCitas', JSON.stringify(doctor));
      return { success: true, doctor };
    }
    return { success: false, message: 'Credenciales inválidas' };
  };

  const logoutDoctor = () => {
    setDoctorLogueado(null);
    localStorage.removeItem('doctorCitas');
  };

  const loginPaciente = (cedula, password) => {
    const paciente = autenticarPaciente(cedula, password);
    if (paciente) {
      setPacienteTemp(paciente);
      return { success: true, paciente };
    }
    return { success: false, message: 'Credenciales inválidas' };
  };

  // ============ HORARIOS ============
  const obtenerHorariosDoctor = (doctorId, fechaInicio, fechaFin) => {
    return citasDB.getHorariosByDoctor(doctorId, fechaInicio, fechaFin);
  };

  const obtenerHorarioDia = (doctorId, fecha) => {
    return citasDB.getHorarioByDoctorAndFecha(doctorId, fecha);
  };

  const actualizarHorarioDoctor = (doctorId, fecha, franjasDisponibles) => {
    const horario = citasDB.actualizarHorario(doctorId, fecha, franjasDisponibles);
    return horario;
  };

  const obtenerFranjasHorarias = () => {
    return franjasHorariasDefault;
  };

  // ============ CITAS ============
  const obtenerCitasDoctor = (doctorId) => {
    const citas = citasDB.getCitasByDoctor(doctorId);
    return citas.map((cita) => getCitaCompleta(cita.id));
  };

  const obtenerCitasPaciente = (pacienteId) => {
    const citas = citasDB.getCitasByPaciente(pacienteId);
    return citas.map((cita) => getCitaCompleta(cita.id));
  };

  const agendarCita = (citaData) => {
    // Verificar disponibilidad
    const disponible = citasDB.isFranjaDisponible(
      citaData.doctorId,
      citaData.fecha,
      citaData.franjaId
    );

    if (!disponible) {
      return { success: false, message: 'La franja horaria no está disponible' };
    }

    // Crear la cita
    const nuevaCita = citasDB.agregarCita(citaData);

    // Crear notificación para el doctor
    const doctor = doctores.find((d) => d.id === citaData.doctorId);
    const paciente = pacientes.find((p) => p.id === citaData.pacienteId);
    const franja = franjasHorariasDefault.find((f) => f.id === citaData.franjaId);

    citasDB.agregarNotificacion({
      doctorId: citaData.doctorId,
      tipo: 'nueva_cita',
      titulo: 'Nueva cita agendada',
      mensaje: `${paciente.nombre} ha agendado una cita para el ${new Date(
        citaData.fecha
      ).toLocaleDateString('es-ES')} a las ${franja.hora}`,
      citaId: nuevaCita.id,
    });

    // Recargar notificaciones si el doctor está logueado
    if (doctorLogueado?.id === citaData.doctorId) {
      cargarNotificaciones();
    }

    return { success: true, cita: nuevaCita };
  };

  const cambiarEstadoCita = (citaId, nuevoEstado) => {
    const cita = citasDB.actualizarEstadoCita(citaId, nuevoEstado);
    if (cita) {
      return { success: true, cita };
    }
    return { success: false, message: 'Cita no encontrada' };
  };

  const cancelarCita = (citaId) => {
    return cambiarEstadoCita(citaId, 'cancelada');
  };

  const verificarDisponibilidad = (doctorId, fecha, franjaId) => {
    return citasDB.isFranjaDisponible(doctorId, fecha, franjaId);
  };

  // ============ NOTIFICACIONES ============
  const marcarNotificacionLeida = (notificacionId) => {
    citasDB.marcarNotificacionLeida(notificacionId);
    cargarNotificaciones();
  };

  const marcarTodasLeidas = () => {
    if (doctorLogueado) {
      citasDB.marcarTodasLeidasDoctor(doctorLogueado.id);
      cargarNotificaciones();
    }
  };

  // ============ HELPERS ============
  const obtenerDoctorPorId = (doctorId) => {
    return doctores.find((d) => d.id === doctorId);
  };

  const obtenerTodosDoctores = () => {
    return doctores;
  };

  const obtenerEspecialidades = () => {
    return [...new Set(doctores.map((d) => d.especialidad))];
  };

  const contextValue = useMemo(
    () => ({
      // Estado
      doctorLogueado,
      pacienteTemp,
      notificaciones,
      notificacionesNoLeidas,
      isAuthenticated: !!doctorLogueado,

      // Autenticación
      loginDoctor,
      logoutDoctor,
      loginPaciente,

      // Horarios
      obtenerHorariosDoctor,
      obtenerHorarioDia,
      actualizarHorarioDoctor,
      obtenerFranjasHorarias,

      // Citas
      obtenerCitasDoctor,
      obtenerCitasPaciente,
      agendarCita,
      cambiarEstadoCita,
      cancelarCita,
      verificarDisponibilidad,

      // Notificaciones
      marcarNotificacionLeida,
      marcarTodasLeidas,
      cargarNotificaciones,

      // Helpers
      obtenerDoctorPorId,
      obtenerTodosDoctores,
      obtenerEspecialidades,
    }),
    [
      doctorLogueado,
      pacienteTemp,
      notificaciones,
      notificacionesNoLeidas,
    ]
  );

  return (
    <CitasContext.Provider value={contextValue}>
      {children}
    </CitasContext.Provider>
  );
};

CitasProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useCitas = () => {
  const context = useContext(CitasContext);
  if (!context) {
    throw new Error('useCitas debe ser usado dentro de un CitasProvider');
  }
  return context;
};
