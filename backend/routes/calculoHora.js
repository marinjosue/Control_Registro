const express = require('express');
const router = express.Router();
const calculoHora = require('../controllers/asistencia/calculoHoras');
const { verificarToken, soloRH } = require('../middlewares/authMiddleware');

// Ruta para calcular y actualizar horas de asistencia
router.post('/', verificarToken, soloRH, async (req, res) => {
    try {
        const { asistencias, calcularExtrasAdministrativo = false, forzar_recalculo = false } = req.body;
        
        if (!Array.isArray(asistencias) || asistencias.length === 0) {
            return res.status(400).json({ mensaje: 'Debes enviar un array de asistencias.' });
        }

        console.log(`[ROUTE] Recibido calcularExtrasAdministrativo: ${calcularExtrasAdministrativo}`);
        
        const opciones = {
            calcularExtrasAdministrativo: calcularExtrasAdministrativo
        };

        const resultado = await calculoHora.calcularYActualizarHoras(asistencias, forzar_recalculo, opciones);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el cálculo de horas', error: error.message });
    }
});

module.exports = router;