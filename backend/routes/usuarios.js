const express = require('express');
const router = express.Router();
const userController = require('../controllers/usuarios/usuarioController');
const { verificarToken,soloRH } = require('../middlewares/authMiddleware');

// Obtener todos los usuarios
router.get('/', verificarToken,soloRH,userController.obtenerUsuarios);

// Actualizar perfil de usuario
router.put('/update/:id', verificarToken,userController.editarUsuario);

// Crear nuevo usuario
router.post('/', verificarToken, soloRH, userController.crearUsuario);

// Eliminar usuario
router.delete('/:id',verificarToken, soloRH,userController.eliminarUsuario);

module.exports = router;