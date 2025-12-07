const express = require('express');
const router = express.Router();
const horarioEmpleadoController = require('../controllers/horarios/horarioEmpleadoController');
const { verificarToken,soloRH } = require('../middlewares/authMiddleware');


// Ruta para asignar horario a un empleado
router.post('/horario-empleado', verificarToken, horarioEmpleadoController.asignarHorario);
// Ruta para modificar el horario asignado a un empleado
router.post('/horario-empleado/modificar', verificarToken,soloRH, horarioEmpleadoController.asignarHorario);
// Ruta para obtener TODOS los horarios sin filtro de área
router.get('/horario-empleados/todos', verificarToken, horarioEmpleadoController.obtenerTodosLosHorarios);
// Ruta para obtener todos los horarios de empleados
router.get('/horario-empleados', verificarToken, horarioEmpleadoController.obtenerHorarios);
// Ruta para obtener el horario de un empleado específico
router.get('/horario-empleado/:id', verificarToken, horarioEmpleadoController.obtenerHorarioEmpleado);
// Ruta para obtener horarios por Area
router.get('/horario-empleados/area/:id_area', verificarToken, horarioEmpleadoController.obtenerHorariosPorArea);


module.exports = router;