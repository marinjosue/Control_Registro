import api from './token';

export const obtenerTodosLosHorarios = async (params = {}) => {
  try {
    const response = await api.get('/horario-empleados/todos', { 
      params
    });
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('No tienes permisos para acceder a los horarios');
    }
    throw error;
  }
};

export const obtenerHorariosPorArea = async (areaId, params = {}) => {
  try {
    const response = await api.get(`/horario-empleados/area/${areaId}`, { 
      params: {
        ...params,
        area_id: areaId
      }
    });
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('No tienes permisos para acceder a los horarios de esta área');
    }
    throw error;
  }
};


export const modificarHorarioEmpleado = async (empleadoId, asignaciones) => {
  try {
    const resultados = {
      exitosos: [],
      errores: []
    };

    for (const asignacion of asignaciones) {
      try {
        // Modificar horario existente
        const response = await api.post('/horario-empleado/modificar', {
          id_empleado: empleadoId,
          id_jornada: asignacion.id_jornada,
          fecha_horario: asignacion.fecha_horario,
          es_dia_libre: asignacion.es_dia_libre ? 1 : 0,
          rol_usuario: asignacion.rol
        });
        resultados.exitosos.push(response.data);
      } catch (error) {
        if (error.response?.status === 403) {
          throw new Error('No tienes permisos para modificar este horario');
        }
        if (error.response?.status === 404) {
          throw new Error('Horario no encontrado');
        }
        resultados.errores.push({
          asignacion,
          error: error.response?.data?.mensaje || error.message
        });
      }
    }

    const totalExitosos = resultados.exitosos.length;

    if (resultados.errores.length === 0) {
      return { 
        message: `Horarios modificados correctamente: ${totalExitosos} asignaciones`, 
        total: totalExitosos,
        detalles: resultados
      };
    } else if (totalExitosos > 0) {
      return { 
        message: `Procesados parcialmente: ${totalExitosos} exitosos, ${resultados.errores.length} errores`, 
        total: totalExitosos,
        detalles: resultados,
        hasErrors: true
      };
    } else {
      throw new Error(`Error en todas las modificaciones: ${resultados.errores[0]?.error}`);
    }
  } catch (error) {
    throw error;
  }
};

export const asignarHorarioMultiple = async (asignaciones) => {
  try {
    const resultados = {
      exitosos: [],
      errores: [],
      actualizados: []
    };

    // Procesar cada asignación individualmente para manejar conflictos
    for (const asignacion of asignaciones) {
      try {
        const response = await api.post('/horario-empleado', {
          id_empleado: asignacion.id_empleado,
          id_jornada: asignacion.id_jornada,
          fecha_horario: asignacion.fecha_horario,
          es_dia_libre: asignacion.es_dia_libre
        });
        resultados.exitosos.push(response.data);
      } catch (error) {
        if (error.response?.status === 409) {
          // Si hay conflicto, intentar actualizar con PUT
          try {
            const horarioExistente = await verificarHorarioExistente(asignacion.id_empleado, asignacion.fecha_horario);
            if (horarioExistente) {
              const updateResponse = await api.put(`/horario-empleado/${horarioExistente.id_horario}`, {
                id_jornada: asignacion.id_jornada,
                fecha_horario: asignacion.fecha_horario,
                es_dia_libre: asignacion.es_dia_libre
              });
              resultados.actualizados.push(updateResponse.data);
            }
          } catch (updateError) {
            resultados.errores.push({
              asignacion,
              error: updateError.response?.data?.mensaje || 'Error al actualizar horario existente'
            });
          }
        } else {
          resultados.errores.push({
            asignacion,
            error: error.response?.data?.mensaje || error.message
          });
        }
      }
    }

    const totalExitosos = resultados.exitosos.length + resultados.actualizados.length;
    
    if (resultados.errores.length === 0) {
      return { 
        message: `Horarios procesados correctamente: ${totalExitosos} asignaciones`, 
        total: totalExitosos,
        detalles: resultados
      };
    } else if (totalExitosos > 0) {
      return { 
        message: `Procesados parcialmente: ${totalExitosos} exitosos, ${resultados.errores.length} errores`, 
        total: totalExitosos,
        detalles: resultados,
        hasErrors: true
      };
    } else {
      throw new Error(`Error en todas las asignaciones: ${resultados.errores[0]?.error}`);
    }
  } catch (error) {
    throw error;
  }
};

export const asignarHorarioIndividual = async (empleadoId, asignaciones) => {
  try {
    const resultados = {
      exitosos: [],
      errores: []
    };

    for (const asignacion of asignaciones) {
      try {
        // Siempre crear un nuevo registro, aunque ya exista uno para esa fecha
        const response = await api.post('/horario-empleado', {
          id_empleado: empleadoId,
          id_jornada: asignacion.id_jornada,
          fecha_horario: asignacion.fecha_horario,
          es_dia_libre: asignacion.es_dia_libre ? 1 : 0
        });
        resultados.exitosos.push(response.data);
      } catch (error) {
        resultados.errores.push({
          asignacion,
          error: error.response?.data?.mensaje || error.message
        });
      }
    }

    const totalExitosos = resultados.exitosos.length;

    if (resultados.errores.length === 0) {
      return { 
        message: `Horarios procesados correctamente: ${totalExitosos} asignaciones`, 
        total: totalExitosos,
        detalles: resultados
      };
    } else if (totalExitosos > 0) {
      return { 
        message: `Procesados parcialmente: ${totalExitosos} exitosos, ${resultados.errores.length} errores`, 
        total: totalExitosos,
        detalles: resultados,
        hasErrors: true
      };
    } else {
      throw new Error(`Error en todas las asignaciones: ${resultados.errores[0]?.error}`);
    }
  } catch (error) {
    throw error;
  }
};
// Función para verificar si existe un horario (mantener como está)
export const verificarHorarioExistente = async (empleadoId, fecha) => {
  try {
    const response = await api.get(`/horario-empleado/verificar/${empleadoId}/${fecha}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // No existe horario
    }
    throw error;
  }
};

// Simplificar función para obtener horario activo
export const obtenerHorarioActivoEnFecha = async (empleadoId, fecha) => {
  try {
    const response = await api.get(`/horario-empleado/${empleadoId}`, { 
      params: { 
        fecha_inicio: fecha,
        fecha_fin: fecha
      }
    });
    
    // Buscar el horario que coincida con la fecha específica
    const horarios = response.data.horarios || [];
    const horarioDelDia = horarios.find(h => h.fecha_horario === fecha);
    
    if (!horarioDelDia) {
      throw new Error('No se encontró horario activo para esta fecha');
    }
    
    return horarioDelDia;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('No se encontró horario activo para esta fecha');
    }
    throw error;
  }
};

