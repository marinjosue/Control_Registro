class NotificacionesWebSocket {
    static setupWebSocket(io) {
        console.log('🔔 [NOTIFICACIONES_WS] Configurando WebSocket para notificaciones...');
        
        io.on('connection', (socket) => {
            console.log('🔔 [NOTIFICACIONES_WS] Cliente conectado:', socket.id);

            //  UNIRSE A SALA DE NOTIFICACIONES
            socket.on('join_notificaciones', () => {
                socket.join('notificaciones_room');
                console.log(`🔔 [NOTIFICACIONES_WS] Cliente ${socket.id} unido a sala notificaciones`);
                
                socket.emit('notificaciones_connected', {
                    message: 'Conectado a notificaciones en tiempo real',
                    timestamp: new Date()
                });
            });

            socket.on('disconnect', () => {
                console.log('🔔 [NOTIFICACIONES_WS] Cliente desconectado:', socket.id);
            });

            socket.on('error', (error) => {
                console.error('🔔 [NOTIFICACIONES_WS] Error en socket:', error);
            });
        });

        console.log(' [NOTIFICACIONES_WS] WebSocket configurado correctamente');
    }

    static emitirNotificacion(io, notificacion) {
        try {
            console.log('🔔 [NOTIFICACIONES_WS] Emitiendo nueva notificación...');
            console.log('🔔 [NOTIFICACIONES_WS] Datos:', {
                id: notificacion.id_notificacion,
                tipo: notificacion.tipo,
                empleado: notificacion.empleado?.nombres
            });

            const notificacionFormateada = {
                id_notificacion: notificacion.id_notificacion,
                tipo: notificacion.tipo,
                titulo: `${notificacion.tipo.toUpperCase()} - ${notificacion.empleado?.nombres || 'Empleado'} ${notificacion.empleado?.apellidos || ''}`,
                mensaje: notificacion.mensaje,
                fecha: new Date().toISOString().split('T')[0],
                hora: new Date().toTimeString().split(' ')[0],
                empleado: {
                    nombres: notificacion.empleado?.nombres,
                    apellidos: notificacion.empleado?.apellidos,
                    cedula: notificacion.empleado?.cedula,
                    area: notificacion.empleado?.area
                },
                timestamp: new Date()
            };

            //  EMITIR A TODOS LOS CLIENTES EN SALA DE NOTIFICACIONES
            io.to('notificaciones_room').emit('nueva_notificacion', notificacionFormateada);
            
            console.log('✅ [NOTIFICACIONES_WS] Notificación emitida correctamente');
            
            //  TAMBIÉN EMITIR CONTADOR ACTUALIZADO
            NotificacionesWebSocket.emitirContadorActualizado(io);

        } catch (error) {
            console.error('❌ [NOTIFICACIONES_WS] Error al emitir notificación:', error);
        }
    }

    static async emitirContadorActualizado(io) {
        try {
            // Obtener contador de notificaciones no leídas
            const { Notificacion } = require('../../models');
            
            const noLeidas = await Notificacion.count({
                where: { leida: false }
            });

            io.to('notificaciones_room').emit('contador_actualizado', {
                no_leidas: noLeidas,
                timestamp: new Date()
            });

            console.log(`🔔 [NOTIFICACIONES_WS] Contador actualizado: ${noLeidas} no leídas`);

        } catch (error) {
            console.error('❌ [NOTIFICACIONES_WS] Error al actualizar contador:', error);
        }
    }
}

module.exports = NotificacionesWebSocket;