const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const qrController = require('../controllers/qr/qrController');

router.get('/empleado/:id', verificarToken, qrController.obtenerQREmpleado);
router.post('/empleados/multiple', verificarToken, qrController.generarQRMultiplesEmpleados);
router.post('/validar', verificarToken, qrController.validarQR);

module.exports = router;