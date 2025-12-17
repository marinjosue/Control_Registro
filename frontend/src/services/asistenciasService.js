
import api from './token';

export const getAsistencias = async (params = {}) => {
  try {
    // Asegurarnos de que estamos solicitando incluir la información completa de Empleados y Áreas
    const includeParams = {
      ...params,
      include_empleado: true,
      include_area: true,
      include_cargo: true
    };

    const response = await api.get(`/asistencias`, {
      params: includeParams,
      timeout: 10000 // 10 segundos de timeout
    });

    if (response.data && Array.isArray(response.data)) {
      console.log(`Recibidas ${response.data.length} asistencias del servidor`);
      // Log para diagnosticar si las áreas vienen correctamente
      const primerEmpleado = response.data[0]?.Empleado;
      if (primerEmpleado) {
        console.log('Datos del primer empleado:', {
          nombre: `${primerEmpleado.nombres} ${primerEmpleado.apellidos}`,
          area: primerEmpleado.Area?.nombre || 'Sin área',
          cargo: primerEmpleado.Cargo?.cargo || 'Sin cargo'
        });
      }
      return response.data;
    }

    // Si no es un array, podría ser un objeto con paginación
    if (response.data && response.data.asistencias) {
      return response.data.asistencias;
    }

    return [];
  } catch (error) {
    console.error('Error fetching asistencias:', error);
    throw new Error(error.response?.data?.error || 'Error al cargar asistencias');
  }
};

export const createAsistencia = async (asistenciaData) => {
  try {
    const response = await api.post('/asistencias', asistenciaData);
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('No tienes permisos para crear asistencias');
    }
    throw error;
  }
};

export const updateAsistencia = async (id, asistenciaData) => {
  try {
    const response = await api.put(`/asistencias/${id}`, asistenciaData);
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('No tienes permisos para actualizar asistencias');
    }
    if (error.response?.status === 404) {
      throw new Error('Asistencia no encontrada');
    }
    throw error;
  }
};

export const deleteAsistencia = async (id) => {
  try {
    const response = await api.delete(`/asistencias/${id}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('No tienes permisos para eliminar asistencias');
    }
    if (error.response?.status === 404) {
      throw new Error('Asistencia no encontrada');
    }
    throw error;
  }
};
