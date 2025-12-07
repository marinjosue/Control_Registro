const express = require('express');
const router = express.Router();

const { 
    obtenerEmpleados, 
    obtenerEmpleadoPorPin, 
    obtenerEmpleadoPorId 
} = require('../../controllers/tablet/empleadoTabletController');

// GET /api/tablet/empleados/pin/:pin - Buscar por PIN (específica)
router.get('/pin/:pin', obtenerEmpleadoPorPin);

// GET /api/tablet/empleados/:id - Buscar por ID (específica)
router.get('/:id', obtenerEmpleadoPorId);

// GET /api/tablet/empleados - Obtener todos los empleados activos (general)
router.get('/', obtenerEmpleados);

module.exports = router;