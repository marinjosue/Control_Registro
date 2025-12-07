import api from './token';

export const getJornadas = async () => {
    const response = await api.get('/jornadas');
    return response.data;
};

export const createJornada = async (jornadaData) => {
    const response = await api.post('/jornadas', jornadaData);
    return response.data;
};

export const updateJornada = async (id, jornadaData) => {
    const response = await api.put(`/jornadas/${id}`, jornadaData);
    return response.data;
};

export const deleteJornada = async (id) => {
    const response = await api.delete(`/jornadas/${id}`);
    return response.data;
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
                    // Si hay conflicto, intentar actualizar
                    try {
                        const updateResponse = await api.put('/horario-empleado/fecha', {
                            id_empleado: asignacion.id_empleado,
                            id_jornada: asignacion.id_jornada,
                            fecha_horario: asignacion.fecha_horario,
                            es_dia_libre: asignacion.es_dia_libre
                        });
                        resultados.actualizados.push(updateResponse.data);
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

export const getAllJornadas = async () => {
    const response = await api.get('/jornadas');
    return response.data;
};
