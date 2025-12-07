const { HorarioEmpleado, Empleado, Jornada, Area } = require('../../models');

const validateRecord = (record) => {
  // id_empleado siempre es requerido
  if (!record.id_empleado) {
    return false;
  }
  if (!record.fecha_horario) {
    return false;
  }

  if (record.es_dia_libre === 1) {
    return true;
  }

  return !!record.id_jornada;
};

const asignarHorario = async (req, res) => {
  const { id_empleado, id_jornada, fecha_horario, es_dia_libre } = req.body;

  try {
    // Usar la misma validación
    const record = { id_empleado, id_jornada, fecha_horario, es_dia_libre };
    
    if (!validateRecord(record)) {
      return res.status(400).json({ 
        mensaje: 'Datos inválidos: verifique los campos requeridos' 
      });
    }

    const empleado = await Empleado.findByPk(id_empleado);
    if (!empleado) {
      return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    }

    // Solo validar jornada si no es día libre
    if (es_dia_libre !== 1 && id_jornada) {
      const jornada = await Jornada.findByPk(id_jornada);
      if (!jornada) {
        return res.status(404).json({ mensaje: 'Jornada no encontrada' });
      }
    }

    // Verificar si ya existe un horario para este empleado en esta fecha
    const horarioExistente = await HorarioEmpleado.findOne({
      where: { 
        id_empleado, 
        fecha_horario 
      }
    });

    const horario = await HorarioEmpleado.create({
      id_empleado,
      id_jornada: es_dia_libre === 1 ? null : id_jornada,
      fecha_horario,
      es_dia_libre: es_dia_libre === 1 ? true : false
    });

    // Obtener el horario creado con las relaciones
    const horarioCompleto = await HorarioEmpleado.findByPk(horario.id_horario, {
      include: [
        {
          model: Empleado,
          attributes: ['nombres', 'apellidos', 'pin', 'cedula']
        },
        {
          model: Jornada,
          attributes: ['nombre_jornada', 'hora_inicio', 'hora_fin'],
          required: false // LEFT JOIN para incluir días libres
        }
      ]
    });

    res.status(201).json({ 
      mensaje: 'Horario asignado con éxito', 
      horario: horarioCompleto 
    });
  } catch (error) {
    console.error('Error al asignar horario:', error);
    res.status(500).json({ 
      error: 'Error al asignar horario', 
      detalles: error.message 
    });
  }
};


// Obtener todos los horarios de empleados
const obtenerHorarios = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, id_empleado } = req.query;
    
    let whereClause = {};
    
    // Filtrar por rango de fechas si se proporciona
    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_horario = {
        [require('sequelize').Op.between]: [fecha_inicio, fecha_fin]
      };
    } else if (fecha_inicio) {
      whereClause.fecha_horario = {
        [require('sequelize').Op.gte]: fecha_inicio
      };
    } else if (fecha_fin) {
      whereClause.fecha_horario = {
        [require('sequelize').Op.lte]: fecha_fin
      };
    }

    // Filtrar por empleado si se proporciona
    if (id_empleado) {
      whereClause.id_empleado = id_empleado;
    }

    const horarios = await HorarioEmpleado.findAll({
      where: whereClause,
      include: [
        {
          model: Empleado,
          attributes: ['nombres', 'apellidos', 'pin', 'cedula', 'id_area'],
          include: [
            {
              model: Area,
              attributes: ['nombre']
            }
          ]
        },
        {
          model: Jornada,
          attributes: ['nombre_jornada', 'hora_inicio', 'hora_fin', 'tipo_turno']
        }
      ],
      order: [['fecha_horario', 'ASC'], ['id_empleado', 'ASC']]
    });

    res.json({
      total: horarios.length,
      horarios
    });
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    res.status(500).json({ 
      error: 'Error al obtener horarios', 
      detalles: error.message 
    });
  }
};

// Obtener horario de un empleado específico
const obtenerHorarioEmpleado = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;

    // Verificar si el empleado existe
    const empleado = await Empleado.findByPk(id, {
      include: [
        {
          model: Area,
          attributes: ['nombre']
        }
      ]
    });

    if (!empleado) {
      return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    }

    let whereClause = { id_empleado: parseInt(id) };

    // Filtrar por rango de fechas si se proporciona
    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_horario = {
        [require('sequelize').Op.between]: [fecha_inicio, fecha_fin]
      };
    } else if (fecha_inicio) {
      whereClause.fecha_horario = {
        [require('sequelize').Op.gte]: fecha_inicio
      };
    } else if (fecha_fin) {
      whereClause.fecha_horario = {
        [require('sequelize').Op.lte]: fecha_fin
      };
    }

    // Buscar horarios del empleado
    const horarios = await HorarioEmpleado.findAll({
      where: whereClause,
      include: [
        {
          model: Jornada,
          attributes: ['nombre_jornada', 'hora_inicio', 'hora_fin', 'tipo_turno']
        }
      ],
      order: [['fecha_horario', 'ASC']]
    });

    res.json({
      empleado: {
        id: empleado.id_empleado,
        nombres: empleado.nombres,
        apellidos: empleado.apellidos,
        pin: empleado.pin,
        cedula: empleado.cedula,
        area: empleado.Area?.nombre
      },
      total_horarios: horarios.length,
      horarios
    });
  } catch (error) {
    console.error('Error al obtener horario del empleado:', error);
    res.status(500).json({ 
      error: 'Error al obtener horario del empleado', 
      detalles: error.message 
    });
  }
};

// Eliminar horario
const eliminarHorario = async (req, res) => {
  try {
    const { id_horario } = req.params;

    const horario = await HorarioEmpleado.findByPk(id_horario);

    if (!horario) {
      return res.status(404).json({ mensaje: 'Horario no encontrado' });
    }

    await horario.destroy();

    res.json({ mensaje: 'Horario eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    res.status(500).json({ 
      error: 'Error al eliminar horario', 
      detalles: error.message 
    });
  }
};
const obtenerHorariosPorArea = async (req, res) => {
  try {
    const { id_area } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;
    
    // Ensure id_area is provided and is a valid number
    if (!id_area) {
      return res.status(400).json({ 
        mensaje: 'ID de área no proporcionado',
        debug: { 
          params: req.params,
          id_recibido: id_area, 
          tipo: typeof id_area,
          url: req.originalUrl
        }
      });
    }
    
    if (isNaN(parseInt(id_area, 10))) {
      return res.status(400).json({ 
        mensaje: 'ID de área inválido',
        debug: { 
          id_recibido: id_area, 
          tipo: typeof id_area 
        }
      });
    }
    
    const areaId = parseInt(id_area, 10);
    
    // Verificar si el área existe
    const area = await Area.findByPk(areaId);
    
    if (!area) {
      return res.status(404).json({ 
        mensaje: 'Área no encontrada',
        debug: { id_buscado: areaId }
      });
    }

    // Buscar empleados que pertenecen a esta área, explícitamente convertimos el id_area a número
    const empleados = await Empleado.findAll({
      where: { id_area: areaId }
    });
    
    if (empleados.length === 0) {
      return res.json({
        area: area.nombre,
        total: 0,
        horarios: []
      });
    }

    // Crear un array con los IDs de los empleados de esta área
    const empleadosIds = empleados.map(emp => emp.id_empleado);

    let whereClause = { 
      id_empleado: {
        [require('sequelize').Op.in]: empleadosIds
      }
    };

    // Filtrar por rango de fechas si se proporciona
    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_horario = {
        [require('sequelize').Op.between]: [fecha_inicio, fecha_fin]
      };
    } else if (fecha_inicio) {
      whereClause.fecha_horario = {
        [require('sequelize').Op.gte]: fecha_inicio
      };
    } else if (fecha_fin) {
      whereClause.fecha_horario = {
        [require('sequelize').Op.lte]: fecha_fin
      };
    }

    const horarios = await HorarioEmpleado.findAll({
      where: whereClause,
      include: [
        {
          model: Empleado,
          attributes: ['id_empleado', 'nombres', 'apellidos', 'cedula'],
          include: [{ model: Area, attributes: ['nombre'] }]
        },
        {
          model: Jornada,
          attributes: ['nombre_jornada', 'hora_inicio', 'hora_fin']
        }
      ],
      order: [['fecha_horario', 'ASC']]
    });

    // Formatear la respuesta según el formato deseado
    const formatoHorarios = horarios.map(horario => ({
      id_horario: horario.id_horario,
      empleado_id: horario.Empleado.id_empleado,
      empleado_nombre: horario.Empleado.nombres,
      empleado_apellido: horario.Empleado.apellidos,
      cedula: horario.Empleado.cedula,
      id_jornada: horario.id_jornada,
      fecha_horario: horario.fecha_horario,
      hora_inicio: horario.Jornada ? horario.Jornada.hora_inicio : null,
      hora_fin: horario.Jornada ? horario.Jornada.hora_fin : null,
      es_dia_libre: horario.es_dia_libre ? 1 : 0
    }));

    res.json({
      area: area.nombre,
      total: formatoHorarios.length,
      horarios: formatoHorarios
    });
  } catch (error) {
    console.error('Error al obtener horarios del área:', error);
  }
};

const obtenerTodosLosHorarios = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    let whereClause = {};

    // Filtrar por rango de fechas si se proporciona
    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_horario = {
        [require('sequelize').Op.between]: [fecha_inicio, fecha_fin]
      };
    } else if (fecha_inicio) {
      whereClause.fecha_horario = {
        [require('sequelize').Op.gte]: fecha_inicio
      };
    } else if (fecha_fin) {
      whereClause.fecha_horario = {
        [require('sequelize').Op.lte]: fecha_fin
      };
    }

    const horarios = await HorarioEmpleado.findAll({
      where: whereClause,
      include: [
        {
          model: Empleado,
          attributes: ['id_empleado', 'nombres', 'apellidos', 'cedula'],
          include: [{ model: Area, attributes: ['nombre'] }]
        },
        {
          model: Jornada,
          attributes: ['nombre_jornada', 'hora_inicio', 'hora_fin']
        }
      ],
      order: [['fecha_horario', 'ASC']]
    });

    // Formatear la respuesta según el formato deseado
    const formatoHorarios = horarios.map(horario => ({
      id_horario: horario.id_horario,
      empleado_id: horario.Empleado.id_empleado,
      empleado_nombre: horario.Empleado.nombres,
      empleado_apellido: horario.Empleado.apellidos,
      cedula: horario.Empleado.cedula,
      id_jornada: horario.id_jornada,
      fecha_horario: horario.fecha_horario,
      hora_inicio: horario.Jornada ? horario.Jornada.hora_inicio : null,
      hora_fin: horario.Jornada ? horario.Jornada.hora_fin : null,
      es_dia_libre: horario.es_dia_libre ? 1 : 0,
      createdAt: horario.createdAt
    }));

    res.json({
      total: formatoHorarios.length,
      horarios: formatoHorarios
    });
  } catch (error) {
    console.error('Error al obtener todos los horarios:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener horarios',
      error: error.message 
    });
  }
};

module.exports = {
  asignarHorario,
  obtenerHorarios,
  obtenerHorariosPorArea,
  obtenerTodosLosHorarios,
  obtenerHorarioEmpleado,
  eliminarHorario
};