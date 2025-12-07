const express = require('express');
const router = express.Router();

//  IMPORTAR RUTAS TABLET
const empleadosRoutes = require('./empleados');
const asistenciasRoutes = require('./asistencias');
const horariosRoutes = require('./horarios');

//  USAR RUTAS
router.use('/empleados', empleadosRoutes);
router.use('/asistencias', asistenciasRoutes);
router.use('/horarios', horariosRoutes);

//  RUTA DE HEALTH CHECK
router.get('/health', (req, res) => {
    res.json({
        success: true,
        mensaje: 'Tablet API funcionando correctamente',
        timestamp: new Date().toISOString(),
        servidor: 'Backend Asistencias HealthyFood',
        version: '1.0.0'
    });
});

//  RUTA RAÍZ INFORMATIVA
router.get('/', (req, res) => {
    res.json({
        success: true,
        mensaje: 'API Tablet - Registro Asistencias HealthyFood',
        endpoints: {
            empleados: '/api/tablet/empleados',
            asistencias: '/api/tablet/asistencias',
            horarios: '/api/tablet/horarios',
            health: '/api/tablet/health'
        },
        timestamp: new Date().toISOString()
    });
});

module.exports = router;