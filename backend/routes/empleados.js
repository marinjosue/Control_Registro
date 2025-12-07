const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleado/empleadoController');
const { verificarToken,soloRH } = require('../middlewares/authMiddleware');

// Rutas CRUD de empleados
router.post('/', verificarToken,soloRH, empleadoController.crearEmpleado);
router.put('/:id', verificarToken,soloRH, empleadoController.editarEmpleado);
router.delete('/:id', verificarToken,soloRH, empleadoController.eliminarEmpleado);
router.get('/', verificarToken,soloRH, empleadoController.obtenerEmpleados);
router.get('/area/:area_id', verificarToken, empleadoController.obtenerEmpleadosPorArea);

module.exports = router;
