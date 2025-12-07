const { HorarioEmpleado, Jornada, Empleado, Area, Asistencia } = require('../../models');
const { Op } = require('sequelize');

// OBTENER HORARIO DE EMPLEADO
const obtenerHorarioEmpleado = async (req, res) => {
    try {
        const { id_empleado } = req.params;
        
        console.log(`[TABLET_HORARIO] Consultando horario empleado: ${id_empleado}`);

        // Validación básica
        if (!id_empleado) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de empleado requerido'
            });
        }

        // Verificar que el empleado existe y está activo
        const empleado = await Empleado.findOne({
            where: {
                id_empleado: parseInt(id_empleado),
                estado: 'Activo'
            },
            include: [{
                model: Area,
                attributes: ['nombre'],
                required: false
            }]
        });

        if (!empleado) {
            return res.status(404).json({
                success: false,
                mensaje: 'Empleado no encontrado o inactivo'
            });
        }

        // USAR FECHA ACTUAL DEL SERVIDOR
        const fechaHoy = new Date().toISOString().split('T')[0];
        
        console.log(`[TABLET_HORARIO] Buscando horario para fecha: ${fechaHoy}`);

        // Buscar horario del empleado para HOY
        const horario = await HorarioEmpleado.findOne({
            where: {
                id_empleado: parseInt(id_empleado),
                fecha_horario: fechaHoy
            },
            include: [
                {
                    model: Jornada,
                    attributes: ['id_jornada', 'nombre_jornada', 'hora_inicio', 'hora_fin', 'tipo_turno'],
                    required: false // LEFT JOIN para incluir días libres
                }
            ],
            order: [['createdAt', 'DESC']] // Obtener el más reciente si hay duplicados
        });

        // OBTENER ÚLTIMO REGISTRO DEL DÍA PARA DETERMINAR TIPO
        const ultimoRegistroHoy = await Asistencia.findOne({
            where: {
                id_empleado: parseInt(id_empleado),
                [Op.or]: [
                    { fecha_entrada: fechaHoy },
                    { fecha_salida: fechaHoy }
                ]
            },
            order: [['createdAt', 'DESC']],
            limit: 1
        });

        let ultimoTipoRegistro = null;
        if (ultimoRegistroHoy) {
            if (ultimoRegistroHoy.hora_entrada && !ultimoRegistroHoy.hora_salida) {
                ultimoTipoRegistro = 'entrada';
            } else if (ultimoRegistroHoy.hora_entrada && ultimoRegistroHoy.hora_salida) {
                ultimoTipoRegistro = 'salida';
            }
        }

        if (horario) {
            console.log(`[TABLET_HORARIO] ✅ Horario encontrado para ${empleado.nombres}`);
            
            const response = {
                success: true,
                horario: {
                    id_horario: horario.id_horario,
                    id_empleado: horario.id_empleado,
                    id_jornada: horario.id_jornada,
                    fecha_horario: horario.fecha_horario,
                    es_dia_libre: horario.es_dia_libre || false,
                    es_activo: !horario.es_dia_libre, // ACTIVO SI NO ES DÍA LIBRE
                    // DATOS DE LA JORNADA
                    hora_entrada: horario.Jornada?.hora_inicio || null,
                    hora_salida: horario.Jornada?.hora_fin || null,
                    nombre_jornada: horario.Jornada?.nombre_jornada || null,
                    tipo_turno: horario.Jornada?.tipo_turno || null,
                    tolerancia_minutos: 2, // TOLERANCIA
                    ultimo_tipo_registro: ultimoTipoRegistro 
                }
            };
            
            console.log(`[TABLET_HORARIO] ✅ Respuesta enviada para empleado ${empleado.nombres}`);
            res.json(response);
        } else {
            console.log(`[TABLET_HORARIO] ❌ Sin horario para empleado ${id_empleado} en fecha ${fechaHoy}`);
            res.status(404).json({
                success: false,
                mensaje: 'Sin horario asignado para hoy'
            });
        }
    } catch (error) {
        console.error('[TABLET_HORARIO] ❌ Error:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error del servidor',
            error: error.message
        });
    }
};

module.exports = {
    obtenerHorarioEmpleado
};