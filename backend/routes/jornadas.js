const express = require('express');
const router = express.Router();
const jornadaController = require('../controllers/jornadas/jornadaController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Ruta para crear una jornada
router.post('/', verificarToken, jornadaController.crearJornada);

// Ruta para obtener todas las jornadas
router.get('/', verificarToken, jornadaController.obtenerJornadas);

// Ruta para editar una jornada
router.put('/:id', verificarToken, jornadaController.editarJornada);

// Ruta para eliminar una jornada
router.delete('/:id', verificarToken, jornadaController.eliminarJornada);

module.exports = router;
