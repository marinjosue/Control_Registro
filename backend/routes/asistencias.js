const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const asistenciaController = require('../controllers/asistencia/asistenciaController');
const registroAsistencia = require('../controllers/asistencia/registroAsistencia');

// Consulta por empleado, fecha, rango y área
router.get('/', verificarToken, asistenciaController.consultarAsistencias);
// Registro de asistencia
router.post('/', verificarToken, registroAsistencia.registrarAsistencia);

module.exports = router;
