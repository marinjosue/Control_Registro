const { Empleado, Area, Asistencia, HorarioEmpleado, Jornada } = require('../../models');

//  FUNCIÓN 1: OBTENER TODOS LOS EMPLEADOS ACTIVOS
const obtenerEmpleados = async (req, res) => {
    try {
        console.log('[TABLET] Obteniendo lista de empleados - solo activos');
        
        const empleados = await Empleado.findAll({
            where: { estado: 'Activo' },
            include: [{
                model: Area,
                attributes: ['nombre'],
                required: false
            }],
            attributes: ['id_empleado', 'nombres', 'apellidos', 'cedula', 'pin', 'estado', 'id_area']
        });

        console.log(`[TABLET] ${empleados.length} empleados activos obtenidos`);

        const empleadosFormateados = empleados.map(empleado => ({
            id_empleado: empleado.id_empleado,
            nombres: empleado.nombres,
            apellidos: empleado.apellidos,
            cedula: empleado.cedula,
            pin: empleado.pin,
            estado: empleado.estado,
            area: empleado.Area ? empleado.Area.nombre : null
        }));

        res.json({
            success: true,
            empleados: empleadosFormateados,
            total: empleados.length
        });

    } catch (error) {
        console.error('[TABLET] Error obtenerEmpleados:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error del servidor',
            error: error.message
        });
    }
};

//  FUNCIÓN 2: BUSCAR EMPLEADO POR PIN - CORREGIDA PARA DÍAS LIBRES
const obtenerEmpleadoPorPin = async (req, res) => {
    try {
        const { pin } = req.params;
        
        console.log(`[TABLET] Buscando empleado con PIN: ${pin}`);

        if (!pin) {
            return res.status(400).json({
                success: false,
                mensaje: 'PIN requerido',
                error: 'PIN_REQUERIDO'
            });
        }

        // Buscar empleado
        const empleado = await Empleado.findOne({
            where: { pin: pin, estado: 'Activo' },
            include: [{
                model: Area,
                attributes: ['nombre'],
                required: false
            }],
            attributes: [
                'id_empleado', 
                'nombres', 
                'apellidos', 
                'cedula', 
                'pin', 
                'estado', 
                'id_area',
                'correo',
                'telefono'
            ]
        });

        if (!empleado) {
            console.log(`[TABLET] Empleado no encontrado con PIN: ${pin}`);
            return res.status(404).json({
                success: false,
                mensaje: 'Empleado no encontrado con PIN: ' + pin,
                error: 'EMPLEADO_NO_ENCONTRADO'
            });
        }

        //  BUSCAR HORARIO ACTUAL DEL EMPLEADO
        const fechaHoy = new Date().toISOString().split('T')[0];
        
        //  ESTRATEGIA 1: Buscar horario específico para hoy
        let horarioHoy = await HorarioEmpleado.findOne({
            where: {
                id_empleado: empleado.id_empleado,
                fecha_horario: fechaHoy
            },
            include: [{
                model: Jornada,
                attributes: ['hora_inicio', 'hora_fin', 'nombre_jornada'],
                required: false
            }]
        });

        //  ESTRATEGIA 2: Si no hay horario específico, buscar el más reciente
        if (!horarioHoy) {
            console.log(`[TABLET] 🔍 Buscando horario más reciente...`);
            
            horarioHoy = await HorarioEmpleado.findOne({
                where: {
                    id_empleado: empleado.id_empleado
                },
                include: [{
                    model: Jornada,
                    attributes: ['hora_inicio', 'hora_fin', 'nombre_jornada'],
                    required: false
                }],
                order: [['fecha_horario', 'DESC']]
            });
        }

        //  VALIDACIÓN CRÍTICA 1: DEBE TENER ALGÚN HORARIO ASIGNADO
        if (!horarioHoy) {
            console.log(`[TABLET] ❌ Empleado ${empleado.nombres} sin ningún horario asignado`);
            return res.status(400).json({
                success: false,
                mensaje: `Sin horario asignado.\n${empleado.nombres} ${empleado.apellidos}\nContacte al administrador para asignar horario.`,
                error: 'SIN_HORARIO'
            });
        }

        //  VERIFICAR SI ES DÍA LIBRE (PERMITIDO PERO CON ALERTA)
        let esDiaLibre = false;
        if (horarioHoy.es_dia_libre === 1 || horarioHoy.es_dia_libre === true) {
            esDiaLibre = true;
            console.log(`[TABLET] ⚠️ Empleado ${empleado.nombres} tiene día libre - PERMITIDO CON ALERTA`);
        }

        //  VALIDACIÓN CRÍTICA 2: SI NO ES DÍA LIBRE, DEBE TENER JORNADA
        if (!esDiaLibre && !horarioHoy.Jornada) {
            console.log(`[TABLET] ❌ Empleado ${empleado.nombres} sin jornada asignada`);
            return res.status(400).json({
                success: false,
                mensaje: `Sin jornada asignada.\n${empleado.nombres} ${empleado.apellidos}\nContacte al administrador.`,
                error: 'SIN_JORNADA'
            });
        }

        //  Verificar último registro del empleado
        const ultimoRegistro = await Asistencia.findOne({
            where: {
                id_empleado: empleado.id_empleado,
                fecha_entrada: fechaHoy
            },
            order: [['createdAt', 'DESC']]
        });

        //  Determinar estado actual y próximo registro
        let estadoActual = 'fuera';
        let proximoRegistro = 'entrada';

        if (ultimoRegistro) {
            if (ultimoRegistro.hora_entrada && !ultimoRegistro.hora_salida) {
                estadoActual = 'dentro';
                proximoRegistro = 'salida';
            } else if (ultimoRegistro.hora_entrada && ultimoRegistro.hora_salida) {
                estadoActual = 'fuera';
                proximoRegistro = 'completado';
            }
        }

        //  OBTENER HORARIOS (usar estándar si es día libre)
        let horaEntrada, horaSalida, nombreJornada;
        
        if (esDiaLibre) {
            // DÍA LIBRE: usar horario estándar
            horaEntrada = '08:00:00';
            horaSalida = '17:00:00';
            nombreJornada = 'DÍA LIBRE';
        } else {
            // DÍA NORMAL: usar horario de jornada
            horaEntrada = horarioHoy.Jornada.hora_inicio;
            horaSalida = horarioHoy.Jornada.hora_fin;
            nombreJornada = horarioHoy.Jornada.nombre_jornada;
        }

        //  RESPUESTA EXITOSA
        const response = {
            success: true,
            mensaje: 'Empleado encontrado',
            empleado: {
                id_empleado: empleado.id_empleado,
                nombres: empleado.nombres,
                apellidos: empleado.apellidos,
                cedula: empleado.cedula,
                pin: empleado.pin,
                estado: empleado.estado,
                hora_entrada: horaEntrada,
                hora_salida: horaSalida,
                nombre_jornada: nombreJornada,
                id_area: empleado.id_area,
                nombre_area: empleado.Area ? empleado.Area.nombre : null,
                correo: empleado.correo || null,
                telefono: empleado.telefono || null,
                es_dia_libre: esDiaLibre
            },
            estado_actual: estadoActual,
            proximo_registro: proximoRegistro,
            ultimo_registro: ultimoRegistro ? {
                fecha_entrada: ultimoRegistro.fecha_entrada,
                hora_entrada: ultimoRegistro.hora_entrada,
                fecha_salida: ultimoRegistro.fecha_salida,
                hora_salida: ultimoRegistro.hora_salida,
                tipo_registro: ultimoRegistro.tipo_registro
            } : null,
            alerta_dia_libre: esDiaLibre
        };

        console.log(`[TABLET] ✅ Empleado: ${empleado.nombres} - Horario: ${horaEntrada}-${horaSalida}${esDiaLibre ? ' (DÍA LIBRE)' : ''}`);
        
        return res.json(response);

    } catch (error) {
        console.error('[TABLET] ❌ Error obtenerEmpleadoPorPin:', error);
        return res.status(500).json({
            success: false,
            mensaje: 'Error del servidor',
            error: error.message
        });
    }
};

//  FUNCIÓN 3: BUSCAR EMPLEADO POR ID
const obtenerEmpleadoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`[TABLET] Buscando empleado con ID: ${id}`);

        if (!id) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID requerido',
                error: 'ID_REQUERIDO'
            });
        }

        const empleado = await Empleado.findOne({
            where: { id_empleado: id, estado: 'Activo' },
            include: [{
                model: Area,
                attributes: ['nombre'],
                required: false
            }],
            attributes: [
                'id_empleado', 
                'nombres', 
                'apellidos', 
                'cedula', 
                'pin', 
                'estado', 
                'id_area',
                'correo',
                'telefono'
            ]
        });

        if (!empleado) {
            console.log(`[TABLET] Empleado no encontrado con ID: ${id}`);
            return res.status(404).json({
                success: false,
                mensaje: 'Empleado no encontrado con ID: ' + id,
                error: 'EMPLEADO_NO_ENCONTRADO'
            });
        }

        const response = {
            success: true,
            mensaje: 'Empleado encontrado',
            empleado: {
                id_empleado: empleado.id_empleado,
                nombres: empleado.nombres,
                apellidos: empleado.apellidos,
                cedula: empleado.cedula,
                pin: empleado.pin,
                estado: empleado.estado,
                id_area: empleado.id_area,
                nombre_area: empleado.Area ? empleado.Area.nombre : null,
                correo: empleado.correo || null,
                telefono: empleado.telefono || null
            }
        };

        console.log(`[TABLET] ✅ Empleado encontrado: ${empleado.nombres} ${empleado.apellidos}`);
        
        return res.json(response);

    } catch (error) {
        console.error('[TABLET] ❌ Error obtenerEmpleadoPorId:', error);
        return res.status(500).json({
            success: false,
            mensaje: 'Error del servidor',
            error: error.message
        });
    }
};

module.exports = {
    obtenerEmpleados,
    obtenerEmpleadoPorPin,
    obtenerEmpleadoPorId
};