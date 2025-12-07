const { Notificacion, Empleado, Area } = require('../../models');
const NotificacionesWebSocket = require('../../controllers/tablet/notificacionesWebSocket');

class NotificacionTabletService {

    static async crearNotificacion(datos) {
        try {
            console.log('[NOTIFICACIÓN_SERVICE] 📝 Creando nueva notificación:', datos.tipo);
            
            const notificacion = await Notificacion.create({
                id_empleado: datos.id_empleado,
                tipo: datos.tipo,
                mensaje: datos.mensaje,
                leida: false,
                datos_adicionales: datos.datos_adicionales ? JSON.stringify(datos.datos_adicionales) : null
            });

            // OBTENER DATOS COMPLETOS PARA WEBSOCKET
            const notificacionCompleta = await Notificacion.findByPk(notificacion.id_notificacion, {
                include: [{
                    model: Empleado,
                    attributes: ['nombres', 'apellidos', 'cedula'],
                    include: [{ 
                        model: Area, 
                        as: 'Area',
                        attributes: ['nombre'], 
                        required: false 
                    }]
                }]
            });

            console.log('[NOTIFICACIÓN_SERVICE] ✅ Notificación creada con ID:', notificacion.id_notificacion);

            // EMITIR WEBSOCKET SI HAY CONEXIÓN IO DISPONIBLE
            if (global.io) {
                console.log('[NOTIFICACIÓN_SERVICE] 🔌 Emitiendo WebSocket...');
                
                NotificacionesWebSocket.emitirNotificacion(global.io, {
                    id_notificacion: notificacionCompleta.id_notificacion,
                    tipo: notificacionCompleta.tipo,
                    mensaje: notificacionCompleta.mensaje,
                    empleado: {
                        nombres: notificacionCompleta.Empleado?.nombres,
                        apellidos: notificacionCompleta.Empleado?.apellidos,
                        cedula: notificacionCompleta.Empleado?.cedula,
                        area: notificacionCompleta.Empleado?.Area?.nombre || 'Sin área'
                    }
                });
            } else {
                console.warn('[NOTIFICACIÓN_SERVICE] ⚠️ No hay conexión WebSocket disponible');
            }

            return notificacion;
        } catch (error) {
            console.error('[NOTIFICACIÓN_SERVICE] ❌ Error al crear notificación:', error);
            throw error;
        }
    }

    static async crearNotificacionTardanza(empleado, minutosRetraso, horaEsperada, horaLlegada) {
        try {
            console.log('[NOTIFICACIÓN_SERVICE] ⏰ Creando notificación de tardanza');
            
            return await this.crearNotificacion({
                id_empleado: empleado.id_empleado,
                tipo: 'tardanza',
                mensaje: `${empleado.nombres} ${empleado.apellidos} llegó ${minutosRetraso} minutos tarde`,
                datos_adicionales: { 
                    minutos_retraso: minutosRetraso, 
                    hora_esperada: horaEsperada, 
                    hora_llegada: horaLlegada 
                }
            });
        } catch (error) {
            console.error('[NOTIFICACIÓN_SERVICE] ❌ Error al crear notificación de tardanza:', error);
            throw error;
        }
    }

    static async crearNotificacionTiempoExcedido(empleado, tipoComida, tiempoInfo, horaSalida, horaRegreso) {
        try {
            console.log('[NOTIFICACIÓN_SERVICE] ⏱️ Creando notificación de tiempo excedido');
            
            return await this.crearNotificacion({
                id_empleado: empleado.id_empleado,
                tipo: 'tiempo_excedido',
                mensaje: `${empleado.nombres} ${empleado.apellidos} excedió tiempo de ${tipoComida} por ${tiempoInfo.tiempoExcedido} minutos`,
                datos_adicionales: { 
                    tipo_comida: tipoComida, 
                    tiempo_excedido: tiempoInfo.tiempoExcedido,
                    hora_salida: horaSalida,
                    hora_regreso: horaRegreso
                }
            });
        } catch (error) {
            console.error('[NOTIFICACIÓN_SERVICE] ❌ Error al crear notificación de tiempo excedido:', error);
            throw error;
        }
    }

    static async crearNotificacionFueraHorario(empleado, tipoComida, accion, franja, hora) {
        try {
            console.log('[NOTIFICACIÓN_SERVICE] ⚠️ Creando notificación fuera de horario');
            
            return await this.crearNotificacion({
                id_empleado: empleado.id_empleado,
                tipo: 'fuera_horario',
                mensaje: `${empleado.nombres} ${empleado.apellidos} registró ${accion} de ${tipoComida} fuera de horario`,
                datos_adicionales: { 
                    tipo_comida: tipoComida, 
                    accion: accion,
                    franja_permitida: `${franja.inicio} - ${franja.fin}`,
                    hora_registro: hora
                }
            });
        } catch (error) {
            console.error('[NOTIFICACIÓN_SERVICE] ❌ Error al crear notificación fuera de horario:', error);
            throw error;
        }
    }

    static async crearNotificacionDiaLibre(empleado, accion) {
        try {
            console.log('[NOTIFICACIÓN_SERVICE] 📅 Creando notificación de día libre');
            
            return await this.crearNotificacion({
                id_empleado: empleado.id_empleado,
                tipo: 'dia_libre',
                mensaje: `${empleado.nombres} ${empleado.apellidos} trabajó en día libre`,
                datos_adicionales: { 
                    accion: accion,
                    fecha: new Date().toISOString().split('T')[0]
                }
            });
        } catch (error) {
            console.error('[NOTIFICACIÓN_SERVICE] ❌ Error al crear notificación de día libre:', error);
            throw error;
        }
    }

    static async obtenerNotificacionesNoLeidas(limite = 50) {
        try {
            console.log('[NOTIFICACIÓN_SERVICE] 📢 Obteniendo notificaciones no leídas');
            
            return await Notificacion.findAll({
                where: { leida: false },
                order: [['createdAt', 'DESC']],
                limit: limite,
                include: [{
                    model: Empleado,
                    attributes: ['nombres', 'apellidos', 'cedula'],
                    include: [{ 
                        model: Area, 
                        as: 'Area',
                        attributes: ['nombre'], 
                        required: false 
                    }]
                }]
            });
        } catch (error) {
            console.error('[NOTIFICACIÓN_SERVICE] ❌ Error al obtener notificaciones no leídas:', error);
            throw error;
        }
    }

    static async marcarComoLeida(idNotificacion) {
        try {
            console.log(`[NOTIFICACIÓN_SERVICE] 📝 Marcando notificación ${idNotificacion} como leída`);
            
            const [filasActualizadas] = await Notificacion.update(
                { leida: true },
                { where: { id_notificacion: idNotificacion } }
            );
            
            // ✅ EMITIR CONTADOR ACTUALIZADO VÍA WEBSOCKET
            if (filasActualizadas > 0 && global.io) {
                NotificacionesWebSocket.emitirContadorActualizado(global.io);
            }
            
            return filasActualizadas > 0;
        } catch (error) {
            console.error('[NOTIFICACIÓN_SERVICE] ❌ Error al marcar notificación como leída:', error);
            throw error;
        }
    }
}

module.exports = NotificacionTabletService;