const { Asistencia, HorarioEmpleado, Jornada } = require('../../models');
const { calcularHoras } = require('./calculoHoras');
const { emitirEventoAsistencia } = require('./asistenciaController');

// Registrar asistencia (entrada/salida)
const registrarAsistencia = async (req, res) => {
    const { id_empleado, fecha, hora_entrada, hora_salida } = req.body;

    // Buscar jornada asignada para ese día
    const horario = await HorarioEmpleado.findOne({ where: { id_empleado, fecha_horario: (new Date(fecha)).toLocaleDateString('es-EC', { weekday: 'long' }).toUpperCase() } });
    if (!horario) return res.status(404).json({ mensaje: 'No hay jornada asignada para este empleado en ese día' });

    const jornada = await Jornada.findByPk(horario.id_jornada);

    // Calcular horas
    const horas = await calcularHoras({ hora_entrada, hora_salida }, jornada, fecha);

    // Guardar asistencia
    const nuevaAsistencia = await Asistencia.create({
        id_empleado,
        fecha,
        hora_entrada,
        hora_salida,
        ...horas
    });

    // Emitir evento en tiempo real
    const io = req.app.get('io');
    emitirEventoAsistencia(nuevaAsistencia, io);

    res.status(201).json(nuevaAsistencia);
};

module.exports = {
    registrarAsistencia
};
