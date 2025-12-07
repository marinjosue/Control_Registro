const express = require('express');
const router = express.Router();

const {
    obtenerNotificacionesNoLeidas,
    obtenerTodasNotificaciones,
    marcarNotificacionLeida,
    eliminarNotificacion,
    obtenerResumenDia,
    obtenerNotificacionesEmpleado
} = require('../../controllers/tablet/notificacionTabletController');

// RUTAS PARA OBTENER DATOS
router.get('/no-leidas', obtenerNotificacionesNoLeidas);
router.get('/todas', obtenerTodasNotificaciones);
router.get('/resumen', obtenerResumenDia);
router.get('/empleado/:idEmpleado', obtenerNotificacionesEmpleado);

// RUTAS PARA ACTUALIZAR
router.put('/:idNotificacion/leida', marcarNotificacionLeida);
router.delete('/:idNotificacion', eliminarNotificacion);

module.exports = router;