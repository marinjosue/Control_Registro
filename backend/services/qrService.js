const QRCode = require('qrcode');
const { Empleado } = require('../models');

// Generar QR dinámicamente basado en el PIN del empleado
async function generateQRForEmployee(empleado) {
    try {
        const qrData = {
            employeeId: empleado.id_empleado,
            pin: empleado.pin,
            cedula: empleado.cedula,
            fullName: `${empleado.nombres} ${empleado.apellidos}`,
            hash: generateQRHash(empleado)
        };

        const qrBase64 = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
        });

        return {
            qrBase64,
            qrData,
            employeeData: qrData
        };
    } catch (error) {
        throw new Error(`Error generando código QR: ${error.message}`);
    }
}

function generateQRHash(empleado) {
    const crypto = require('crypto');
    const dataToHash = `${empleado.id_empleado}-${empleado.pin}-${empleado.cedula}`;
    return crypto.createHash('sha256').update(dataToHash).digest('hex').substring(0, 16);
}

async function validateEmployeeQR(qrDataString) {
    try {
        const qrData = JSON.parse(qrDataString);
        
        const empleado = await Empleado.findOne({
            where: {
                id_empleado: qrData.employeeId,
                pin: qrData.pin,
                cedula: qrData.cedula
            }
        });

        if (!empleado) {
            return { isValid: false, error: 'Empleado no encontrado' };
        }

        const expectedHash = generateQRHash(empleado);
        if (qrData.hash !== expectedHash) {
            return { isValid: false, error: 'QR inválido o modificado' };
        }

        return {
            isValid: true,
            empleado: {
                id_empleado: empleado.id_empleado,
                nombres: empleado.nombres,
                apellidos: empleado.apellidos,
                cedula: empleado.cedula,
                pin: empleado.pin,
                id_area: empleado.id_area
            }
        };
    } catch (error) {
        return { isValid: false, error: 'Formato de QR inválido' };
    }
}

module.exports = {
    generateQRForEmployee,
    validateEmployeeQR
};