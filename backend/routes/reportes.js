const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const reportesController = require('../controllers/reportes/reportesController');

router.get('/asistencias/excel', verificarToken, reportesController.reporteAsistenciasExcel);
router.get('/asistencias/pdf', verificarToken, reportesController.reporteAsistenciasPDF);


module.exports = router;
