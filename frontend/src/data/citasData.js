// Base de datos en memoria para el sistema de citas médicas
// Clínica de Cirugías Plásticas

// Doctores de la clínica
export const doctores = [
  {
    id: 1,
    nombre: 'Dr. Carlos Méndez',
    especialidad: 'Cirugía Facial',
    email: 'carlos.mendez@clinica.com',
    usuario: 'cmendez',
    password: 'doctor123',
    imagen: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400',
  },
  {
    id: 2,
    nombre: 'Dra. María Rodríguez',
    especialidad: 'Cirugía Corporal',
    email: 'maria.rodriguez@clinica.com',
    usuario: 'mrodriguez',
    password: 'doctor123',
    imagen: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400',
  },
  {
    id: 3,
    nombre: 'Dr. Luis Fernández',
    especialidad: 'Rinoplastia',
    email: 'luis.fernandez@clinica.com',
    usuario: 'lfernandez',
    password: 'doctor123',
    imagen: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400',
  },
  {
    id: 4,
    nombre: 'Dra. Ana Gómez',
    especialidad: 'Medicina Estética',
    email: 'ana.gomez@clinica.com',
    usuario: 'agomez',
    password: 'doctor123',
    imagen: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
  },
];

// Pacientes registrados
export const pacientes = [
  {
    id: 1,
    nombre: 'Juan Pérez García',
    cedula: '1234567890',
    password: 'paciente123',
    email: 'juan.perez@email.com',
    telefono: '0987654321',
  },
  {
    id: 2,
    nombre: 'María López Sánchez',
    cedula: '0987654321',
    password: 'paciente123',
    email: 'maria.lopez@email.com',
    telefono: '0912345678',
  },
  {
    id: 3,
    nombre: 'Pedro Martínez Ruiz',
    cedula: '1122334455',
    password: 'paciente123',
    email: 'pedro.martinez@email.com',
    telefono: '0923456789',
  },
];

// Franjas horarias estándar (duración de 1 hora por defecto)
export const franjasHorariasDefault = [
  { id: 1, hora: '08:00', horaFin: '09:00', duracion: 60 },
  { id: 2, hora: '09:00', horaFin: '10:00', duracion: 60 },
  { id: 3, hora: '10:00', horaFin: '11:00', duracion: 60 },
  { id: 4, hora: '11:00', horaFin: '12:00', duracion: 60 },
  { id: 5, hora: '12:00', horaFin: '13:00', duracion: 60 },
  { id: 6, hora: '14:00', horaFin: '15:00', duracion: 60 },
  { id: 7, hora: '15:00', horaFin: '16:00', duracion: 60 },
  { id: 8, hora: '16:00', horaFin: '17:00', duracion: 60 },
  { id: 9, hora: '17:00', horaFin: '18:00', duracion: 60 },
];

// Clase para gestionar la base de datos en memoria
class CitasDatabase {
  constructor() {
    this.horarios = this.initHorarios();
    this.citas = this.initCitas();
    this.notificaciones = this.initNotificaciones();
    this.idCitaCounter = 10;
    this.idNotificacionCounter = 10;
  }

  // Inicializar horarios de ejemplo para la semana actual
  initHorarios() {
    const horarios = [];
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - diaSemana + 1); // Lunes de la semana actual

    // Generar horarios para los próximos 7 días para cada doctor
    doctores.forEach((doctor) => {
      for (let dia = 0; dia < 7; dia++) {
        const fecha = new Date(inicioSemana);
        fecha.setDate(inicioSemana.getDate() + dia);
        const fechaStr = fecha.toISOString().split('T')[0];

        // Horario de ejemplo: Lunes a Viernes con algunas franjas disponibles
        if (dia >= 1 && dia <= 5) { // Lunes a Viernes
          const franjasDisponibles = dia % 2 === 0 
            ? [1, 2, 3, 6, 7, 8] // Días pares
            : [2, 3, 4, 7, 8, 9]; // Días impares

          horarios.push({
            id: `h${doctor.id}_${dia}`,
            doctorId: doctor.id,
            fecha: fechaStr,
            diaSemana: dia,
            franjasDisponibles,
            activo: true,
          });
        }
      }
    });

    return horarios;
  }

  // Inicializar algunas citas de ejemplo
  initCitas() {
    const citas = [];
    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);
    const mananaStr = manana.toISOString().split('T')[0];

    // Cita de ejemplo
    citas.push({
      id: 1,
      doctorId: 1,
      pacienteId: 1,
      fecha: mananaStr,
      franjaId: 2,
      estado: 'confirmada', // pendiente, confirmada, cancelada, completada
      motivo: 'Consulta inicial rinoplastia',
      createdAt: new Date().toISOString(),
    });

    return citas;
  }

  // Inicializar notificaciones de ejemplo
  initNotificaciones() {
    return [
      {
        id: 1,
        doctorId: 1,
        tipo: 'nueva_cita',
        titulo: 'Nueva cita agendada',
        mensaje: 'Juan Pérez García ha agendado una cita para mañana',
        citaId: 1,
        leida: false,
        fecha: new Date().toISOString(),
      },
    ];
  }

  // =============== HORARIOS ===============
  getHorariosByDoctor(doctorId, fechaInicio = null, fechaFin = null) {
    let horarios = this.horarios.filter((h) => h.doctorId === doctorId);
    
    if (fechaInicio) {
      horarios = horarios.filter((h) => h.fecha >= fechaInicio);
    }
    if (fechaFin) {
      horarios = horarios.filter((h) => h.fecha <= fechaFin);
    }
    
    return horarios;
  }

  getHorarioByDoctorAndFecha(doctorId, fecha) {
    return this.horarios.find((h) => h.doctorId === doctorId && h.fecha === fecha);
  }

  actualizarHorario(doctorId, fecha, franjasDisponibles) {
    const index = this.horarios.findIndex(
      (h) => h.doctorId === doctorId && h.fecha === fecha
    );

    if (index !== -1) {
      this.horarios[index].franjasDisponibles = franjasDisponibles;
      return this.horarios[index];
    } else {
      // Crear nuevo horario
      const nuevoHorario = {
        id: `h${doctorId}_${fecha}`,
        doctorId,
        fecha,
        diaSemana: new Date(fecha).getDay(),
        franjasDisponibles,
        activo: true,
      };
      this.horarios.push(nuevoHorario);
      return nuevoHorario;
    }
  }

  // =============== CITAS ===============
  getCitas() {
    return this.citas;
  }

  getCitasByDoctor(doctorId) {
    return this.citas.filter((c) => c.doctorId === doctorId);
  }

  getCitasByPaciente(pacienteId) {
    return this.citas.filter((c) => c.pacienteId === pacienteId);
  }

  getCitaById(citaId) {
    return this.citas.find((c) => c.id === citaId);
  }

  agregarCita(cita) {
    const nuevaCita = {
      ...cita,
      id: this.idCitaCounter++,
      createdAt: new Date().toISOString(),
    };
    this.citas.push(nuevaCita);
    return nuevaCita;
  }

  actualizarEstadoCita(citaId, nuevoEstado) {
    const index = this.citas.findIndex((c) => c.id === citaId);
    if (index !== -1) {
      this.citas[index].estado = nuevoEstado;
      return this.citas[index];
    }
    return null;
  }

  eliminarCita(citaId) {
    const index = this.citas.findIndex((c) => c.id === citaId);
    if (index !== -1) {
      this.citas.splice(index, 1);
      return true;
    }
    return false;
  }

  // Verificar si una franja está disponible
  isFranjaDisponible(doctorId, fecha, franjaId) {
    const horario = this.getHorarioByDoctorAndFecha(doctorId, fecha);
    if (!horario) return false;

    // Verificar que la franja esté en el horario disponible
    if (!horario.franjasDisponibles.includes(franjaId)) return false;

    // Verificar que no haya una cita ya agendada en esa franja
    const citaExistente = this.citas.find(
      (c) =>
        c.doctorId === doctorId &&
        c.fecha === fecha &&
        c.franjaId === franjaId &&
        c.estado !== 'cancelada'
    );

    return !citaExistente;
  }

  // =============== NOTIFICACIONES ===============
  getNotificacionesByDoctor(doctorId) {
    return this.notificaciones
      .filter((n) => n.doctorId === doctorId)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  getNotificacionesNoLeidas(doctorId) {
    return this.notificaciones.filter(
      (n) => n.doctorId === doctorId && !n.leida
    );
  }

  agregarNotificacion(notificacion) {
    const nuevaNotificacion = {
      ...notificacion,
      id: this.idNotificacionCounter++,
      fecha: new Date().toISOString(),
      leida: false,
    };
    this.notificaciones.push(nuevaNotificacion);
    return nuevaNotificacion;
  }

  marcarNotificacionLeida(notificacionId) {
    const index = this.notificaciones.findIndex((n) => n.id === notificacionId);
    if (index !== -1) {
      this.notificaciones[index].leida = true;
      return this.notificaciones[index];
    }
    return null;
  }

  marcarTodasLeidasDoctor(doctorId) {
    this.notificaciones
      .filter((n) => n.doctorId === doctorId)
      .forEach((n) => (n.leida = true));
  }
}

// Instancia única de la base de datos
export const citasDB = new CitasDatabase();

// Helper para autenticar doctor
export const autenticarDoctor = (usuario, password) => {
  const doctor = doctores.find(
    (d) => d.usuario === usuario && d.password === password
  );
  return doctor || null;
};

// Helper para autenticar paciente
export const autenticarPaciente = (cedula, password) => {
  const paciente = pacientes.find(
    (p) => p.cedula === cedula && p.password === password
  );
  return paciente || null;
};

// Helper para obtener información completa de una cita
export const getCitaCompleta = (citaId) => {
  const cita = citasDB.getCitaById(citaId);
  if (!cita) return null;

  const doctor = doctores.find((d) => d.id === cita.doctorId);
  const paciente = pacientes.find((p) => p.id === cita.pacienteId);
  const franja = franjasHorariasDefault.find((f) => f.id === cita.franjaId);

  return {
    ...cita,
    doctor,
    paciente,
    franja,
  };
};
