import api from './token';


export const getAllUsers = async () => {
  try {
    const response = await api.get('/usuarios');
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('No tienes permisos para acceder a los usuarios');
    }
    throw error;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await api.post('/usuarios', userData);
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('No tienes permisos para crear usuarios');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.mensaje || 'Error en los datos enviados');
    }
    throw error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    // Solo enviar los campos que realmente han cambiado
    const response = await api.put(`/usuarios/update/${id}`, userData);
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('No tienes permisos para actualizar usuarios');
    }
    if (error.response?.status === 404) {
      throw new Error('Usuario no encontrado');
    }
    if (error.response?.status === 400) {
      if (error.response.data?.mensaje?.includes('correo')) {
        throw new Error('El correo ya está registrado para otro usuario');
      }
      throw new Error(error.response.data?.mensaje || 'Error en los datos enviados');
    }
    throw error;
  }
};
export const updateUserProfile = async (userId, data) => {
  try {
    const response = await api.put(`/usuarios/update/${userId}`, data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('No tienes permisos para actualizar el perfil de usuario');
    }
    if (error.response?.status === 404) {
      throw new Error('Usuario no encontrado');
    }
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('No tienes permisos para eliminar usuarios');
    }
    if (error.response?.status === 404) {
      throw new Error('Usuario no encontrado');
    }
    throw error;
  }
};

export const changeUserPassword = async (id, currentPassword, newPassword) => {
  try {
    const response = await api.put(`/usuarios/update/${id}`, {
      contrasena_actual: currentPassword,
      contrasena_nueva: newPassword
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.mensaje || 'Error al cambiar contraseña');
    }
    if (error.response?.status === 403) {
      throw new Error('No tienes permisos para cambiar la contraseña');
    }
    throw error;
  }
};
