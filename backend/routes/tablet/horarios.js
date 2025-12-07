const express = require('express');
const router = express.Router();
const horarioTabletController = require('../../controllers/tablet/horarioTabletController');

// GET /api/tablet/horarios/:id_empleado/:fecha
router.get('/:id_empleado/:fecha', horarioTabletController.obtenerHorarioEmpleado);

// GET /api/tablet/horarios/:id_empleado - Para obtener horario del día actual
router.get('/:id_empleado', horarioTabletController.obtenerHorarioEmpleado);

module.exports = router;