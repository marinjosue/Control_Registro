const { Notificacion, Empleado, Area } = require('../../models');
const { Op } = require('sequelize');

const obtenerNotificacionesNoLeidas = async (req, res) => {
    try {
        console.log('[TABLET_NOTIFICACIONES] 📢 Obteniendo notificaciones no leídas');
        
        const limite = parseInt(req.query.limite) || 50;
        
        const notificaciones = await Notificacion.findAll({
            where: {
                leida: false
            },
            limit: limite,
            order: [['createdAt', 'DESC']],
            include: [{
                model: Empleado,
                attributes: ['nombres', 'apellidos', 'cedula'],
                include: [{
                    model: Area,
                    attributes: ['nombre'],
                    required: false
                }]
            }]
        });

        const notificacionesAdaptadas = notificaciones.map(notif => {
            const fechaCreacion = new Date(notif.createdAt);
            return {
                id_notificacion: notif.id_notificacion,
                tipo: notif.tipo,
                titulo: `${notif.tipo.toUpperCase()} - ${notif.Empleado?.nombres || 'Empleado'} ${notif.Empleado?.apellidos || ''}`,
                mensaje: notif.mensaje,
                fecha: fechaCreacion.toISOString().split('T')[0],
                hora: fechaCreacion.toTimeString().split(' ')[0],
                prioridad: notif.tipo === 'tardanza' ? 'alta' : 'media',
                leido: notif.leida,
                Empleado: notif.Empleado,
                datos_adicionales: notif.datos_adicionales || '{}'
            };
        });

        console.log(`[TABLET_NOTIFICACIONES] ✅ Encontradas ${notificacionesAdaptadas.length} notificaciones no leídas`);

        res.json({
            success: true,
            notificaciones: notificacionesAdaptadas,
            total: notificacionesAdaptadas.length
        });

    } catch (error) {
        console.error('[TABLET_NOTIFICACIONES] ❌ Error al obtener notificaciones no leídas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error del servidor',
            error: error.message
        });
    }
};

const obtenerTodasNotificaciones = async (req, res) => {
    try {
        console.log('[TABLET_NOTIFICACIONES] 📢 Obteniendo todas las notificaciones');
        
        const limite = parseInt(req.query.limite) || 100;
        
        const notificaciones = await Notificacion.findAll({
            limit: limite,
            order: [['createdAt', 'DESC']],
            include: [{
                model: Empleado,
                attributes: ['nombres', 'apellidos', 'cedula'],
                include: [{
                    model: Area,
                    attributes: ['nombre'],
                    required: false
                }]
            }]
        });

        const notificacionesAdaptadas = notificaciones.map(notif => {
            const fechaCreacion = new Date(notif.createdAt);
            return {
                id_notificacion: notif.id_notificacion,
                tipo: notif.tipo,
                titulo: `${notif.tipo.toUpperCase()} - ${notif.Empleado?.nombres || 'Empleado'} ${notif.Empleado?.apellidos || ''}`,
                mensaje: notif.mensaje,
                fecha: fechaCreacion.toISOString().split('T')[0],
                hora: fechaCreacion.toTimeString().split(' ')[0],
                prioridad: notif.tipo === 'tardanza' ? 'alta' : 'media',
                leido: notif.leida,
                Empleado: notif.Empleado,
                datos_adicionales: notif.datos_adicionales || '{}'
            };
        });

        console.log(`[TABLET_NOTIFICACIONES] ✅ Encontradas ${notificacionesAdaptadas.length} notificaciones totales`);

        res.json({
            success: true,
            notificaciones: notificacionesAdaptadas,
            total: notificacionesAdaptadas.length
        });

    } catch (error) {
        console.error('[TABLET_NOTIFICACIONES] ❌ Error al obtener notificaciones:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error del servidor',
            error: error.message
        });
    }
};

const marcarNotificacionLeida = async (req, res) => {
    try {
        const { idNotificacion } = req.params;
        
        console.log(`[TABLET_NOTIFICACIONES] 📖 Marcando notificación ${idNotificacion} como leída`);

        const notificacion = await Notificacion.findByPk(idNotificacion);
        
        if (!notificacion) {
            return res.status(404).json({
                success: false,
                mensaje: 'Notificación no encontrada'
            });
        }

        await notificacion.update({ leida: true });

        console.log(`[TABLET_NOTIFICACIONES] ✅ Notificación ${idNotificacion} marcada como leída`);

        res.json({
            success: true,
            mensaje: 'Notificación marcada como leída',
            notificacion: {
                id_notificacion: notificacion.id_notificacion,
                leida: true
            }
        });

    } catch (error) {
        console.error('[TABLET_NOTIFICACIONES] ❌ Error al marcar notificación como leída:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error del servidor',
            error: error.message
        });
    }
};

const eliminarNotificacion = async (req, res) => {
    try {
        const { idNotificacion } = req.params;
        
        console.log(`[TABLET_NOTIFICACIONES] 🗑️ Eliminando notificación ${idNotificacion}`);

        const notificacion = await Notificacion.findByPk(idNotificacion);
        
        if (!notificacion) {
            return res.status(404).json({
                success: false,
                mensaje: 'Notificación no encontrada'
            });
        }

        await notificacion.destroy();

        console.log(`[TABLET_NOTIFICACIONES] ✅ Notificación ${idNotificacion} eliminada correctamente`);

        res.json({
            success: true,
            mensaje: 'Notificación eliminada correctamente',
            id_notificacion: parseInt(idNotificacion)
        });

    } catch (error) {
        console.error('[TABLET_NOTIFICACIONES] ❌ Error al eliminar notificación:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error del servidor',
            error: error.message
        });
    }
};

const obtenerResumenDia = async (req, res) => {
    try {
        const hoy = new Date();
        const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const finDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

        const resumen = await Notificacion.findAll({
            where: {
                createdAt: {
                    [Op.between]: [inicioDelDia, finDelDia]
                }
            },
            attributes: [
                'tipo',
                [Notificacion.sequelize.fn('COUNT', Notificacion.sequelize.col('tipo')), 'cantidad']
            ],
            group: ['tipo']
        });

        const total = await Notificacion.count({
            where: {
                createdAt: {
                    [Op.between]: [inicioDelDia, finDelDia]
                }
            }
        });

        res.json({
            success: true,
            resumen: resumen,
            total: total,
            fecha: hoy.toISOString().split('T')[0]
        });

    } catch (error) {
        console.error('[TABLET_NOTIFICACIONES] ❌ Error al obtener resumen:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error del servidor',
            error: error.message
        });
    }
};

const obtenerNotificacionesEmpleado = async (req, res) => {
    try {
        const { idEmpleado } = req.params;
        const limite = parseInt(req.query.limite) || 20;

        const notificaciones = await Notificacion.findAll({
            where: {
                id_empleado: idEmpleado
            },
            limit: limite,
            order: [['createdAt', 'DESC']],
            include: [{
                model: Empleado,
                attributes: ['nombres', 'apellidos', 'cedula']
            }]
        });

        res.json({
            success: true,
            notificaciones: notificaciones,
            total: notificaciones.length
        });

    } catch (error) {
        console.error('[TABLET_NOTIFICACIONES] ❌ Error al obtener notificaciones del empleado:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error del servidor',
            error: error.message
        });
    }
};

module.exports = {
    obtenerNotificacionesNoLeidas,
    obtenerTodasNotificaciones,
    obtenerResumenDia,
    marcarNotificacionLeida,
    eliminarNotificacion, 
    obtenerNotificacionesEmpleado
};