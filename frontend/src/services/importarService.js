import { createEmpleado } from './empleadosService';

// Map area names to area IDs for import functionality
export const areaNameToId = (areaName) => {
    const areasMap = {
        'CALIDAD': 1,
        'BODEGA': 2,
        'PRODUCCION': 3,
        'ADMINISTRACION': 4,
        'MANTENIMIENTO': 5
    };
    return areasMap[areaName?.toUpperCase()] || 4;
};

// Map cargo names to cargo IDs for import functionality
export const cargoNameToId = (cargoName) => {
    const cargosMap = {
        'ASISTENTE DE PRODUCCION': 1,
        'AUXILIAR DE BODEGA': 2,
        'ELECTROMECANICO': 3,
        'GERENTE DE CALIDAD': 4,
        'GERENTE DE OPERACIONES': 5,
        'GERENTE DE PRODUCCION': 6,
        'JEFE DE BODEGA': 7,
        'JEFE DE PRODUCCION': 8,
        'JEFE DE VENTAS': 9,
        'OPERADOR DE PRODUCCION': 10,
        'OPERATIVO DE BODEGA': 11,
        'SUPERVISOR DE CALIDAD': 12,
        'SUPERVISOR DE PRODUCCION': 13
    };
    return cargosMap[cargoName?.toUpperCase()] || 10;
};

// Function to validate and preprocess imported employee data
export const processImportedEmpleados = async (data) => {
    console.log('Datos recibidos para procesar:', data.slice(0, 2));
    const processedData = data.map((row, index) => {
        try {
            if (index < 3) {
                console.log(`Procesando fila ${index + 1}:`, row);
            }
            const fullName = row.NOMBRE || '';
            let nombres = '';
            let apellidos = '';
            const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
            if (nameParts.length >= 3) {
                apellidos = nameParts.slice(0, 2).join(' ');
                nombres = nameParts.slice(2).join(' ');
            } else if (nameParts.length === 2) {
                apellidos = nameParts[0];
                nombres = nameParts[1];
            } else {
                nombres = fullName;
            }
            const id_area = areaNameToId(row.AREA);
            const id_cargo = cargoNameToId(row.CARGO);
            const formatDate = (dateStr) => {
                if (!dateStr) return null;
                if (typeof dateStr === 'number') {
                    const date = new Date((dateStr - 25569) * 86400 * 1000);
                    return date.toISOString().split('T')[0];
                }
                if (typeof dateStr === 'string') {
                    const formats = [
                        {
                            regex: /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/,
                            formatter: (match) => `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
                        },
                        {
                            regex: /^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/,
                            formatter: (match) => `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
                        }
                    ];
                    for (const format of formats) {
                        const match = dateStr.match(format.regex);
                        if (match) {
                            return format.formatter(match);
                        }
                    }
                }
                if (dateStr instanceof Date) {
                    return dateStr.toISOString().split('T')[0];
                }
                return null;
            };
            const defaultCorreo = "example@correo.com";
            const defaultDireccion = "defecto-Itulcachi";
            const defaultFechaNacimiento = "12/12/2000";
            const defaultCelular = "099999999";
            const fecha_nacimiento = formatDate(row['FECHA DE NACIMIEN'] || row['FECHA DE NACIMIENTO'] || defaultFechaNacimiento);
            const fecha_ingreso = formatDate(row['INGRESO']);
            const calcularEdad = (fechaNac) => {
                if (!fechaNac) return null;
                const hoy = new Date();
                const nacimiento = new Date(fechaNac);
                let edad = hoy.getFullYear() - nacimiento.getFullYear();
                const m = hoy.getMonth() - nacimiento.getMonth();
                if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
                    edad--;
                }
                return edad;
            };
            const sueldo = parseFloat(row.SUELDO) || 0;
            const processedEmpleado = {
                cedula: String(row.CEDULA || '').trim(),
                nombres: nombres.trim(),
                apellidos: apellidos.trim(),
                id_cargo,
                id_area,
                correo: String(row.CORREO || defaultCorreo).trim(),
                direccion: String(row.DIRECCION || defaultDireccion).trim(),
                fecha_nacimiento,
                edad: fecha_nacimiento ? calcularEdad(fecha_nacimiento) : null,
                telefono: String(row.CELULAR || defaultCelular).trim(),
                estado: 'Activo',
                fecha_ingreso,
                sueldo
            };
            return processedEmpleado;
        } catch (error) {
            console.error('Error procesando fila:', error);
            return null;
        }
    }).filter(Boolean);
    try {
        const results = [];
        for (let i = 0; i < processedData.length; i++) {
            const empleado = processedData[i];
            try {
                const response = await createEmpleado(empleado);
                results.push({ success: true, empleado: response });
            } catch (error) {
                console.error('Error creando empleado:', error);
                results.push({
                    success: false,
                    empleado: { cedula: empleado.cedula, nombres: empleado.nombres },
                    message: error.message || 'Error al importar empleado'
                });
            }
        }
        return {
            totalProcessed: processedData.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            details: results
        };
    } catch (error) {
        throw new Error(`Error procesando datos: ${error.message}`);
    }
};

// Enhanced batch import function using individual create endpoint
export const batchImportEmpleados = async (data) => {
    try {
        console.log('Iniciando importación por lotes...');
        const processedData = await processImportedEmpleados(data);
        // processedData ya retorna el resultado final, así que solo lo devolvemos
        return processedData;
    } catch (error) {
        console.error('Error en batchImportEmpleados:', error);
        throw new Error(`Error procesando datos: ${error.message}`);
    }
};