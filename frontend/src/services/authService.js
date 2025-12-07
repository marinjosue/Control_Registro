import api from './token';

export const login = async (credentials) => {
  // Mapear los campos del frontend a los que espera el backend
  const payload = {
    identificador: credentials.usuario, 
    contrasena: credentials.password
  };
  const response = await api.post('/auth/login', payload);
  // Guarda el token en localStorage
  localStorage.setItem('token', response.data.token);
  return response.data;
};



export const logout = () => {
  localStorage.removeItem('token');
  // Si tu backend requiere, puedes hacer una petición POST a /logout
};

export const isAuthenticated = () => !!localStorage.getItem('token');
