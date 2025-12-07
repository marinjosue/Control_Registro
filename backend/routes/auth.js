const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth/authController');
const passwordController = require('../controllers/auth/passwordController');
const { verificarToken, soloRH } = require('../middlewares/authMiddleware');

// RH puede crear usuarios
router.post('/register', verificarToken, soloRH, authController.register);

// Login público
router.post('/login', authController.login);

// Recoperar contraseña (solo usuario autenticado)
router.post('/forgot-password', passwordController.forgotPassword);
router.post('/reset-password/:token', passwordController.resetPassword);
module.exports = router;
