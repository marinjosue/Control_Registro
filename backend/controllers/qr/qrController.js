const { generateQRForEmployee, validateEmployeeQR } = require('../../services/qrService');
const { Empleado } = require('../../models');

const obtenerQREmpleado = async (req, res) => {
    const { id } = req.params;

    try {
        const empleado = await Empleado.findByPk(id);
        
        if (!empleado) {
            return res.status(404).json({ mensaje: 'Empleado no encontrado' });
        }

        if (!empleado.pin) {
            return res.status(400).json({ mensaje: 'El empleado no tiene PIN asignado' });
        }

        const qrResult = await generateQRForEmployee(empleado);
        
        res.json({
            mensaje: 'QR generado exitosamente',
            empleado: {
                id_empleado: empleado.id_empleado,
                nombres: empleado.nombres,
                apellidos: empleado.apellidos,
                pin: empleado.pin
            },
            qrCode: qrResult.qrBase64
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Error al generar QR del empleado', 
            detalles: error.message 
        });
    }
};

const validarQR = async (req, res) => {
    const { qrData } = req.body;

    try {
        if (!qrData) {
            return res.status(400).json({ mensaje: 'Datos del QR requeridos' });
        }

        const validacion = await validateEmployeeQR(qrData);

        if (validacion.isValid) {
            res.json({
                mensaje: 'QR válido',
                empleado: validacion.empleado,
                valido: true
            });
        } else {
            res.status(400).json({
                mensaje: 'QR inválido',
                error: validacion.error,
                valido: false
            });
        }
    } catch (error) {
        res.status(500).json({ 
            error: 'Error al validar código QR', 
            detalles: error.message 
        });
    }
};

const generarQRMultiplesEmpleados = async (req, res) => {
    const { empleadosIds } = req.body;

    try {
        const empleados = await Empleado.findAll({
            where: {
                id_empleado: empleadosIds
            }
        });

        const qrResults = [];

        for (const empleado of empleados) {
            try {
                const qrResult = await generateQRForEmployee(empleado);
                qrResults.push({
                    empleado: {
                        id_empleado: empleado.id_empleado,
                        nombres: empleado.nombres,
                        apellidos: empleado.apellidos,
                        pin: empleado.pin
                    },
                    qrCode: qrResult.qrBase64,
                    status: 'success'
                });
            } catch (error) {
                qrResults.push({
                    empleado: {
                        id_empleado: empleado.id_empleado,
                        nombres: empleado.nombres,
                        apellidos: empleado.apellidos
                    },
                    status: 'error',
                    error: error.message
                });
            }
        }

        res.json({
            mensaje: 'QR generados exitosamente',
            total: qrResults.length,
            exitosos: qrResults.filter(r => r.status === 'success').length,
            resultados: qrResults
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Error generando QR múltiples', 
            detalles: error.message 
        });
    }
};

module.exports = {
    obtenerQREmpleado,
    validarQR,
    generarQRMultiplesEmpleados
};