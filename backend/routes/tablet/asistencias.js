const express = require('express');
const router = express.Router();
const asistenciaTabletController = require('../../controllers/tablet/asistenciaTabletController');


// POST /api/tablet/asistencias - Registrar asistencia
router.post('/', asistenciaTabletController.registrarAsistencia);

// GET /api/tablet/asistencias/hoy - Obtener asistencias de hoy
router.get('/hoy', asistenciaTabletController.obtenerAsistenciasHoy);

// GET /api/tablet/asistencias/:idEmpleado/ultimo - Obtener último registro
router.get('/:idEmpleado/ultimo', asistenciaTabletController.obtenerUltimoRegistro);

// GET /api/tablet/asistencias/estadisticas - Obtener estadísticas de hoy
router.get('/estadisticas', asistenciaTabletController.obtenerEstadisticasHoy);

module.exports = router;