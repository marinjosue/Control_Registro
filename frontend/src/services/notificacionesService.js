import api from './token';

export const obtenerNotificacionesNoLeidas = async (limite = 50) => {
    try {
        const response = await api.get(`/tablet/notificaciones/no-leidas?limite=${limite}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener notificaciones no leídas:', error);
        throw new Error(error.response?.data?.mensaje || 'Error al cargar notificaciones');
    }
};

export const obtenerTodasNotificaciones = async (limite = 100) => {
    try {
        const response = await api.get(`/tablet/notificaciones/todas?limite=${limite}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener todas las notificaciones:', error);
        throw new Error(error.response?.data?.mensaje || 'Error al cargar notificaciones');
    }
};

export const marcarNotificacionLeida = async (idNotificacion) => {
    try {
        const response = await api.put(`/tablet/notificaciones/${idNotificacion}/leida`);
        return response.data;
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
        throw new Error(error.response?.data?.mensaje || 'Error al marcar notificación');
    }
};

export const eliminarNotificacion = async (idNotificacion) => {
    try {
        const response = await api.delete(`/tablet/notificaciones/${idNotificacion}`);
        return response.data;
    } catch (error) {
        console.error('Error al eliminar notificación:', error);
        throw new Error(error.response?.data?.mensaje || 'Error al eliminar notificación');
    }
};

export const obtenerResumenNotificaciones = async () => {
    try {
        const response = await api.get('/tablet/notificaciones/resumen');
        return response.data;
    } catch (error) {
        console.error('Error al obtener resumen:', error);
        throw new Error(error.response?.data?.mensaje || 'Error al obtener resumen');
    }
};