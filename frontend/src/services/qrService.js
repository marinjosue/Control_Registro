import api from './token';

export const getEmpleadoQR = async (empleadoId) => {
  const response = await api.get(`/qr/empleado/${empleadoId}`);
  return response.data;
};

export const getMultipleEmpleadosQR = async (empleadosIds) => {
  const response = await api.post('/qr/empleados/multiple', { empleadosIds });
  return response.data;
};

