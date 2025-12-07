const { Asistencia, Empleado, Area, Cargo} = require('../../models');
const { Op } = require('sequelize');

// Consulta por empleado, fecha, rango y área, con paginación y filtrado por fecha_entrada
const consultarAsistencias = async (req, res) => {
    try {
        const { id_empleado, fecha, fecha_inicio, fecha_fin, id_area, page = 1, limit } = req.query;
        const where = {};

        // Filtrado por empleado
        if (id_empleado) where.id_empleado = id_empleado;

        // Filtrado por fecha exacta (campo 'fecha')
        if (fecha && fecha.trim() !== '') where.fecha = fecha;

        // Filtrado por rango de fechas en 'fecha_entrada'
        // Si no hay rango de fechas, no aplica este filtro y trae todas las asistencias
        if (fecha_inicio && fecha_inicio.trim() !== '' && fecha_fin && fecha_fin.trim() !== '') {
            where.fecha_entrada = { [Op.between]: [fecha_inicio, fecha_fin] };
        } else if (fecha_inicio && fecha_inicio.trim() !== '') {
            where.fecha_entrada = { [Op.gte]: fecha_inicio };
        } else if (fecha_fin && fecha_fin.trim() !== '') {
            where.fecha_entrada = { [Op.lte]: fecha_fin };
        }

        // Si se filtra por área, buscar empleados de esa área
        if (id_area) {
            const empleados = await Empleado.findAll({ where: { id_area }, attributes: ['id_empleado'] });
            const empleadosIds = empleados.map(e => e.id_empleado);
            if (where.id_empleado) {
                // Si ya hay filtro por empleado, intersectar
                if (typeof where.id_empleado === 'object' && where.id_empleado[Op.in]) {
                    where.id_empleado[Op.in] = where.id_empleado[Op.in].filter(id => empleadosIds.includes(id));
                } else if (empleadosIds.includes(where.id_empleado)) {
                    // id_empleado ya es un valor único y está en el área
                    // no hacer nada
                } else {
                    // id_empleado no está en el área, no devolverá resultados
                    where.id_empleado = null;
                }
            } else {
                where.id_empleado = { [Op.in]: empleadosIds };
            }
        }

        const queryOptions = {
            where,
            include: [
                { 
                    model: Empleado,
                    attributes: { 
                        exclude: [
                            'correo',
                            'direccion',
                            'fecha_nacimiento',
                            'edad',
                            'telefono',
                            'estado',
                            'fecha_ingreso',
                            'createdAt',
                            'updatedAt',
                            'id_cargo'
                        ]
                    },
                    include: [
                        { model: Area },
                        { model: Cargo, attributes: ['cargo'] }
                    ]
                }
            ],
            order: [['fecha_entrada', 'DESC'], ['hora_entrada', 'DESC']]
        };

        if (limit) {
            queryOptions.limit = parseInt(limit);
            queryOptions.offset = (parseInt(page) - 1) * parseInt(limit);
        }

        const asistencias = await Asistencia.findAll(queryOptions);
        res.json(asistencias);
    } catch (error) {
        console.error('Error fetching asistencias:', error);
        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};

// Emitir evento en tiempo real cuando se crea/modifica asistencia
const emitirEventoAsistencia = (asistencia, io) => {
    // Puedes personalizar el filtro de la sala según tus necesidades
    io.emit('asistenciaActualizada', asistencia);
};

module.exports = {
    consultarAsistencias,
    emitirEventoAsistencia
};
