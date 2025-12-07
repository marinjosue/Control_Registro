import api from "./token";

export const calcularHoras = async (params = {}) => {
  try {
    console.log('Calculando horas con params:', params);

    // Asegurar que enviamos todos los parámetros recibidos directamente
    const requestBody = {
      asistencias: params.asistencias,
      forzar_recalculo: params.forzar_recalculo || false,
      calcularExtrasAdministrativo: params.calcularExtrasAdministrativo || false,
      timeout: 0
    };

    console.log('Enviando request body:', requestBody);

    // Envía el array de asistencias y otros parámetros en el body
    const response = await api.post('/calculo-horas', requestBody);

    console.log('Horas calculadas:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al calcular horas:', error.response?.data || error.message);
    if (error.response?.status === 403) {
      throw new Error('No tienes permisos para calcular horas');
    }
    if (error.response?.status === 500) {
      throw new Error('Error interno del servidor al calcular horas');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.mensaje || 'Error en la petición');
    }
    throw error;
  }
}