import * as XLSX from 'xlsx-js-style';
import { getAsistencias } from './asistenciasService';

export const exportarDetallesHoras = async (params = {}) => {
    try {
        // Obtener los datos de asistencias
        const asistencias = await getAsistencias(params);

        if (!asistencias || asistencias.length === 0) {
            throw new Error('No hay datos para exportar');
        }

        // Extraer fechas para el encabezado
        const fechaInicio = params.fecha_inicio || '';
        const fechaFin = params.fecha_fin || '';

        function calcularAlimentacion(asistencia) {
            let totalMinutos = 0;

            // Helper para calcular minutos entre dos horas tipo "HH:mm:ss"
            const minutosEntre = (inicio, fin) => {
                if (!inicio || !fin) return 0;
                const [h1, m1] = inicio.split(':').map(Number);
                const [h2, m2] = fin.split(':').map(Number);
                return ((h2 * 60 + m2) - (h1 * 60 + m1));
            };

            totalMinutos += minutosEntre(asistencia.hora_entrada_desayuno, asistencia.hora_salida_desayuno);
            totalMinutos += minutosEntre(asistencia.hora_entrada_almuerzo, asistencia.hora_salida_almuerzo);
            totalMinutos += minutosEntre(asistencia.hora_entrada_merienda, asistencia.hora_salida_merienda);

            // Convierte a formato HH:mm
            const horas = Math.floor(totalMinutos / 60);
            const minutos = totalMinutos % 60;
            return `${horas}:${minutos.toString().padStart(2, '0')}`;
        }

        // Procesar los datos para la exportación
        const reportData = asistencias.map(asistencia => {
            const empleado = asistencia.Empleado || {};
            // Asegurarse de que sueldo sea un número
            const sueldo = parseFloat(empleado.sueldo || 0);

            // Cálculos de pagos
            const valorPorHora = sueldo / 240; // Según tu fórmula
            const horasNormales = parseFloat(asistencia.horas_normales || 0);
            const horas25 = parseFloat(asistencia.horas_25 || 0);
            const horas50 = parseFloat(asistencia.horas_50 || 0);
            const horas100 = parseFloat(asistencia.horas_100 || 0);
            const horasFeriado = parseFloat(asistencia.horas_feriado || 0);

            // Cálculos de pagos por categoría
            const horasNormalesPagar = valorPorHora * horasNormales;
            const horas25Pagar = valorPorHora * 1.25 * horas25;
            const horas50Pagar = valorPorHora * 1.5 * horas50;
            const horas100Pagar = valorPorHora * 2 * horas100;
            const horasFeriadoPagar = valorPorHora * 2 * horasFeriado;

            // Total de horas extras a pagar
            const totalHorasExtrasPagar = horas25Pagar + horas50Pagar + horas100Pagar + horasFeriadoPagar;
            // Formato para entrada y salida
            const fechaEntrada = asistencia.fecha_entrada || '';
            const horaEntrada = asistencia.hora_entrada?.substring(0, 5) || '';
            const fechaSalida = asistencia.fecha_salida || '';
            const horaSalida = asistencia.hora_salida?.substring(0, 5) || '';

            // Crear objeto de datos para el reporte
            return {
                // Datos del empleado
                'Cédula': empleado.cedula || '',
                'Nombres': empleado.nombres || '',
                'Apellidos': empleado.apellidos || '',
                'Área': empleado.Area?.nombre || '',
                'Cargo': empleado.Cargo?.cargo || '',
                'PIN': empleado.pin || '',
                'Salario': sueldo,

                // Datos de entrada y salida detallados
                'Fecha Entrada': fechaEntrada ? fechaEntrada.split('-').reverse().join('/') : '',
                'Hora Entrada': horaEntrada,
                'Fecha Salida': fechaSalida ? fechaSalida.split('-').reverse().join('/') : '',
                'Hora Salida': horaSalida,
                'Alimentación': calcularAlimentacion(asistencia),
                'Estado': asistencia.estado || '',

                // Horas trabajadas - guardar como números
                'Horas Totales': parseFloat(asistencia.horas_trabajadas || 0),
                'Horas Normales': horasNormales,
                'Horas 25%': horas25,
                'Horas 50%': horas50,
                'Horas 100%': horas100,
                'Horas Feriado': horasFeriado,

                // Valor por hora - guardar como número
                'Valor/Hora': valorPorHora,

                // Pagos por categoría - guardar como números
                'Pago H. Normales ($)': horasNormalesPagar,
                'Pago H. 25% ($)': horas25Pagar,
                'Pago H. 50% ($)': horas50Pagar,
                'Pago H. 100% ($)': horas100Pagar,
                'Pago H. Feriado ($)': horasFeriadoPagar,

                // Totales - guardar como números
                'Total Horas Extras ($)': totalHorasExtrasPagar,
                'Total a Pagar ($)': (horasNormalesPagar + totalHorasExtrasPagar)
            };
        });

        // Crear libro de Excel
        const workbook = XLSX.utils.book_new();

        // Crear hoja de reporte principal
        const worksheet = XLSX.utils.json_to_sheet(reportData);

        // Establecer anchos de columna
        const columnWidths = [
            { wch: 12 },  // Cédula
            { wch: 20 },  // Nombres
            { wch: 20 },  // Apellidos
            { wch: 15 },  // Área
            { wch: 20 },  // Cargo
            { wch: 8 },   // PIN
            { wch: 12 },  // Salario
            { wch: 12 },  // Fecha Entrada
            { wch: 10 },  // Hora Entrada
            { wch: 12 },  // Fecha Salida
            { wch: 10 },  // Hora Salida
            { wch: 12 },  // Alimentación
            { wch: 12 },  // Estado
            { wch: 10 },  // Horas Totales
            { wch: 10 },  // Horas Normales
            { wch: 10 },  // Horas 25%
            { wch: 10 },  // Horas 50%
            { wch: 10 },  // Horas 100%
            { wch: 10 },  // Horas Feriado
            { wch: 12 },  // Valor/Hora
            { wch: 15 },  // Pago H. Normales
            { wch: 15 },  // Pago H. 25%
            { wch: 15 },  // Pago H. 50%
            { wch: 15 },  // Pago H. 100%
            { wch: 15 },  // Pago H. Feriado
            { wch: 18 },  // Total Horas Extras
            { wch: 18 },  // Total a Pagar
        ];
        worksheet['!cols'] = columnWidths;

        // Añadir encabezado con rango de fechas
        const mainHeaderRows = [
            ['REPORTE DE HORAS Y PAGOS'],
            [`Período: ${formatDateForReport(fechaInicio)} - ${formatDateForReport(fechaFin)}`],
            ['Fecha generación:', new Date().toLocaleDateString('es-EC')],
            [] // Fila vacía antes de los datos
        ];

        // Convertir el encabezado a hoja de cálculo
        const headerWorksheet = XLSX.utils.aoa_to_sheet(mainHeaderRows);

        // Obtener el rango de los datos y el encabezado
        const headerRange = XLSX.utils.decode_range(headerWorksheet['!ref']);
        const dataRange = XLSX.utils.decode_range(worksheet['!ref']);

        // Crear una nueva hoja combinada
        const finalWorksheet = {};

        // Copiar las celdas del encabezado
        for (let R = headerRange.s.r; R <= headerRange.e.r; ++R) {
            for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
                const headerAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (headerWorksheet[headerAddress]) {
                    const finalAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    finalWorksheet[finalAddress] = headerWorksheet[headerAddress];
                }
            }
        }

        // Copiar las celdas de datos con desplazamiento
        const rowOffset = headerRange.e.r + 1; // +1 para dejar una fila en blanco
        for (let R = dataRange.s.r; R <= dataRange.e.r; ++R) {
            for (let C = dataRange.s.c; C <= dataRange.e.c; ++C) {
                const dataAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (worksheet[dataAddress]) {
                    const finalAddress = XLSX.utils.encode_cell({ r: R + rowOffset, c: C });
                    finalWorksheet[finalAddress] = worksheet[dataAddress];
                }
            }
        }

        // Actualizar el rango de referencia
        finalWorksheet['!ref'] = XLSX.utils.encode_range({
            s: { r: 0, c: 0 },
            e: {
                r: dataRange.e.r + rowOffset,
                c: Math.max(headerRange.e.c, dataRange.e.c)
            }
        });

        // Mantener los anchos de columna
        finalWorksheet['!cols'] = worksheet['!cols'];

        // Aplicar formato al encabezado
        const titleCell = 'A1';
        finalWorksheet[titleCell].s = {
            font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '2C3E50' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        };

        // Merger la primera celda del título para que ocupe todo el ancho
        finalWorksheet['!merges'] = [{
            s: { r: 0, c: 0 },
            e: { r: 0, c: dataRange.e.c }
        }];

        // Estilos para los demás encabezados
        for (let i = 1; i < rowOffset; i++) {
            const cell = XLSX.utils.encode_cell({ r: i, c: 0 });
            if (finalWorksheet[cell]) {
                finalWorksheet[cell].s = {
                    font: { bold: true, sz: 11 },
                    alignment: { horizontal: 'left', vertical: 'center' }
                };
            }
        }

        // Estilos para encabezados de columnas
        for (let C = 0; C <= dataRange.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ r: rowOffset, c: C });
            if (finalWorksheet[address]) {
                // Diferentes colores para encabezados de datos de empleado vs otros datos
                const headerBgColor = C < 7 ? '2C3E50' : '3498DB'; // Azul más claro para columnas que no son datos de empleado

                finalWorksheet[address].s = {
                    font: { bold: true, color: { rgb: 'FFFFFF' } },
                    fill: { fgColor: { rgb: headerBgColor } },
                    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                    border: {
                        top: { style: 'thin', color: { rgb: '000000' } },
                        bottom: { style: 'thin', color: { rgb: '000000' } },
                        left: { style: 'thin', color: { rgb: '000000' } },
                        right: { style: 'thin', color: { rgb: '000000' } }
                    }
                };
            }
        }

        // Estilos para filas de datos
        for (let R = rowOffset + 1; R <= dataRange.e.r + rowOffset; ++R) {
            const isEvenRow = (R - rowOffset) % 2 === 0;

            for (let C = 0; C <= dataRange.e.c; ++C) {
                const address = XLSX.utils.encode_cell({ r: R, c: C });
                if (!finalWorksheet[address]) continue;

                // Colores diferentes para columnas de datos de empleado vs otras columnas
                let backgroundColor;
                if (C < 7) { // Datos del empleado
                    backgroundColor = isEvenRow ? 'F3F4F6' : 'FFFFFF';
                } else { // Otras columnas con color distintivo
                    backgroundColor = isEvenRow ? 'E1F5FE' : 'F0F9FF';
                }

                // Estilo base para todas las celdas de datos
                const baseStyle = {
                    fill: { fgColor: { rgb: backgroundColor } },
                    border: {
                        top: { style: 'thin', color: { rgb: 'E5E7EB' } },
                        bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
                        left: { style: 'thin', color: { rgb: 'E5E7EB' } },
                        right: { style: 'thin', color: { rgb: 'E5E7EB' } }
                    }
                };

                // Aplicar estilos según tipo de columna
                if (C === 6 || (C >= 18 && C <= 26)) {  // Columnas de salario y pagos
                    finalWorksheet[address].s = {
                        ...baseStyle,
                        alignment: { horizontal: 'right' },
                        font: { color: { rgb: '000000' } },
                        numFmt: '#,##0.00'  // Formato de número con comas y 2 decimales
                    };
                } else if (C >= 12 && C <= 19) { // Columnas de horas y valor/hora
                    finalWorksheet[address].s = {
                        ...baseStyle,
                        alignment: { horizontal: 'center' },
                        font: { color: { rgb: '000000' } },
                        numFmt: C === 19 ? '#,##0.00' : '#,##0.00'  // Formato de número con comas
                    };
                } else {
                    finalWorksheet[address].s = {
                        ...baseStyle,
                        alignment: { horizontal: 'left' },
                        font: { color: { rgb: '000000' } }
                    };
                }

                // Resaltar columnas de total
                if (C === 25 || C === 26) {  // Total Horas Extras y Total a Pagar
                    finalWorksheet[address].s.font = {
                        ...finalWorksheet[address].s.font,
                        bold: true
                    };
                    finalWorksheet[address].s.fill = {
                        fgColor: { rgb: 'BBDEFB' }
                    };
                }

                // Destacar columna de alimentación
                if (C === 10) {  // Columna de alimentación
                    finalWorksheet[address].s.fill = {
                        fgColor: { rgb: 'FFF9C4' } // Color amarillo claro
                    };
                    finalWorksheet[address].s.font = {
                        ...finalWorksheet[address].s.font,
                        bold: true
                    };
                }
            }
        }

        // Añadir la hoja al libro
        XLSX.utils.book_append_sheet(workbook, finalWorksheet, "Reporte Detallado");

        // Agregar hoja de resumen con los datos como números
        const resumen = calcularResumen(reportData);
        const resumenData = [
            ['RESUMEN DE REPORTE'],
            [],
            ['Total Empleados', resumen.totalEmpleados],
            ['Total Horas Normales', parseFloat(resumen.totalHorasNormales)],
            ['Total Horas 25%', parseFloat(resumen.totalHoras25)],
            ['Total Horas 50%', parseFloat(resumen.totalHoras50)],
            ['Total Horas 100%', parseFloat(resumen.totalHoras100)],
            ['Total Horas Feriado', parseFloat(resumen.totalHorasFeriado)],
            [],
            ['Total Pago Horas Normales', parseFloat(resumen.totalPagoHorasNormales)],
            ['Total Pago Horas 25%', parseFloat(resumen.totalPagoHoras25)],
            ['Total Pago Horas 50%', parseFloat(resumen.totalPagoHoras50)],
            ['Total Pago Horas 100%', parseFloat(resumen.totalPagoHoras100)],
            ['Total Pago Horas Feriado', parseFloat(resumen.totalPagoHorasFeriado)],
            [],
            ['TOTAL EXTRAS A PAGAR', parseFloat(resumen.totalExtras)],
            ['TOTAL A PAGAR', parseFloat(resumen.totalPagar)]
        ];

        const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);

        // Estilos para hoja de resumen
        wsResumen['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]; // Merge title row
        wsResumen['!cols'] = [{ wch: 25 }, { wch: 15 }]; // Column width

        // Estilo para título
        wsResumen['A1'].s = {
            font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '2C3E50' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        };

        // Estilo para las filas de totales
        const resumenHeaderRows = [0, 2, 9, 15, 16];
        const dataRows = [3, 4, 5, 6, 7, 10, 11, 12, 13, 14];

        resumenHeaderRows.forEach(r => {
            const cell = XLSX.utils.encode_cell({ r, c: 0 });
            if (wsResumen[cell]) {
                wsResumen[cell].s = {
                    font: { bold: true, color: r === 0 ? { rgb: 'FFFFFF' } : { rgb: '000000' } },
                    fill: { fgColor: { rgb: r === 0 ? '2C3E50' : 'E6F7FF' } }
                };
            }
        });

        dataRows.forEach(r => {
            for (let c = 0; c <= 1; c++) {
                const cell = XLSX.utils.encode_cell({ r, c });
                if (wsResumen[cell]) {
                    wsResumen[cell].s = {
                        alignment: c === 1 ? { horizontal: 'right' } : { horizontal: 'left' },
                        font: { color: { rgb: '000000' } },
                        fill: { fgColor: { rgb: r % 2 === 0 ? 'F3F4F6' : 'FFFFFF' } },
                        numFmt: c === 1 && r >= 9 ? '"$"#,##0.00' : (c === 1 ? '#,##0.00' : undefined)
                    };
                }
            }
        });

        // Estilos especiales para los totales finales
        for (let r = 15; r <= 16; r++) {
            for (let c = 0; c <= 1; c++) {
                const cell = XLSX.utils.encode_cell({ r, c });
                if (wsResumen[cell]) {
                    wsResumen[cell].s = {
                        font: { bold: true, color: { rgb: '000000' } },
                        fill: { fgColor: { rgb: '34D399' } },
                        alignment: c === 1 ? { horizontal: 'right' } : { horizontal: 'left' },
                        numFmt: c === 1 ? '"$"#,##0.00' : undefined
                    };
                }
            }
        }

        // --- RESUMEN POR EMPLEADO (AGREGADO POR NOMBRE) ---
        // Agrupar datos por empleado agregando todas sus horas
        const resumenPorEmpleado = {};
        asistencias.forEach(asistencia => {
            const empleado = asistencia.Empleado || {};
            const nombreCompleto = `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim();
            const area = empleado.Area?.nombre || 'Sin Área';
            const cargo = empleado.Cargo?.cargo || 'Sin Cargo';
            const sueldo = parseFloat(empleado.sueldo || 0);
            const valorPorHora = sueldo / 240;
            
            if (!resumenPorEmpleado[nombreCompleto]) {
                resumenPorEmpleado[nombreCompleto] = {
                    'Empleado': nombreCompleto,
                    'Área': area,
                    'Cargo': cargo,
                    'Fechas': new Set(),
                    'Horas Normales': 0,
                    'Horas 25%': 0,
                    'Horas 50%': 0,
                    'Horas 100%': 0,
                    'Horas Feriado': 0,
                    'Total Horas Extras': 0,
                    'Pago Normales': 0,
                    'Pago 25%': 0,
                    'Pago 50%': 0,
                    'Pago 100%': 0,
                    'Pago Feriado': 0,
                    'Total a Pagar Extras': 0,
                    'Total a Pagar General': 0
                };
            }
            
            // Agregar fecha al set
            if (asistencia.fecha_entrada) {
                const fecha = new Date(asistencia.fecha_entrada).toLocaleDateString('es-EC');
                resumenPorEmpleado[nombreCompleto]['Fechas'].add(fecha);
            }
            
            const horasNormales = parseFloat(asistencia.horas_normales || 0);
            const horas25 = parseFloat(asistencia.horas_25 || 0);
            const horas50 = parseFloat(asistencia.horas_50 || 0);
            const horas100 = parseFloat(asistencia.horas_100 || 0);
            const horasFeriado = parseFloat(asistencia.horas_feriado || 0);
            
            resumenPorEmpleado[nombreCompleto]['Horas Normales'] += horasNormales;
            resumenPorEmpleado[nombreCompleto]['Horas 25%'] += horas25;
            resumenPorEmpleado[nombreCompleto]['Horas 50%'] += horas50;
            resumenPorEmpleado[nombreCompleto]['Horas 100%'] += horas100;
            resumenPorEmpleado[nombreCompleto]['Horas Feriado'] += horasFeriado;
            resumenPorEmpleado[nombreCompleto]['Total Horas Extras'] += horas25 + horas50 + horas100 + horasFeriado;
            
            // Calcular pagos
            resumenPorEmpleado[nombreCompleto]['Pago Normales'] += valorPorHora * horasNormales;
            resumenPorEmpleado[nombreCompleto]['Pago 25%'] += valorPorHora * 1.25 * horas25;
            resumenPorEmpleado[nombreCompleto]['Pago 50%'] += valorPorHora * 1.5 * horas50;
            resumenPorEmpleado[nombreCompleto]['Pago 100%'] += valorPorHora * 2 * horas100;
            resumenPorEmpleado[nombreCompleto]['Pago Feriado'] += valorPorHora * 2 * horasFeriado;
            
            const pagoExtras = valorPorHora * 1.25 * horas25 + 
                              valorPorHora * 1.5 * horas50 + 
                              valorPorHora * 2 * horas100 + 
                              valorPorHora * 2 * horasFeriado;
            
            resumenPorEmpleado[nombreCompleto]['Total a Pagar Extras'] += pagoExtras;
            resumenPorEmpleado[nombreCompleto]['Total a Pagar General'] += valorPorHora * horasNormales + pagoExtras;
        });

        // Convertir a array y formatear fechas
        const resumenEmpleadoArray = Object.values(resumenPorEmpleado).map(row => ({
            'Empleado': row['Empleado'],
            'Área': row['Área'],
            'Cargo': row['Cargo'],
            'Fechas': Array.from(row['Fechas']).join(', '),
            'Suma Horas Normales': parseFloat(row['Horas Normales'].toFixed(2)),
            'Suma Horas 25%': parseFloat(row['Horas 25%'].toFixed(2)),
            'Suma Horas 50%': parseFloat(row['Horas 50%'].toFixed(2)),
            'Suma Horas 100%': parseFloat(row['Horas 100%'].toFixed(2)),
            'Suma Horas Feriado': parseFloat(row['Horas Feriado'].toFixed(2)),
            'Suma Total Horas Extras': parseFloat(row['Total Horas Extras'].toFixed(2)),
            'Suma Pago Normales': parseFloat(row['Pago Normales'].toFixed(2)),
            'Suma Pago 25%': parseFloat(row['Pago 25%'].toFixed(2)),
            'Suma Pago 50%': parseFloat(row['Pago 50%'].toFixed(2)),
            'Suma Pago 100%': parseFloat(row['Pago 100%'].toFixed(2)),
            'Suma Pago Feriado': parseFloat(row['Pago Feriado'].toFixed(2)),
            'Suma Total a Pagar Extras': parseFloat(row['Total a Pagar Extras'].toFixed(2)),
            'Suma Total a Pagar General': parseFloat(row['Total a Pagar General'].toFixed(2))
        }));

        // Crear estructura completa de datos para empleados
        const datosEmpleados = [
            ['RESUMEN POR EMPLEADO - SUMA TOTAL AGREGADO'],
            [],
            ['SUMA DE HORAS - NUMERO', '', '', '', '', '', '', '', '', '', 'SUMA VALOR DE HORAS ($)', '', '', '', '', '', ''],
            ['Empleado', 'Área', 'Cargo', 'Fechas', 'Suma H.Normal', 'Suma 25%', 'Suma 50%', 'Suma 100%', 'Suma H.Feriado', 'Suma Total Extras', 'Suma $ Normal', 'Suma $ 25%', 'Suma $ 50%', 'Suma $ 100%', 'Suma $ Feriado', 'SUMA $ EXTRAS', 'SUMA $ TOTAL']
        ];

        // Agregar datos de empleados
        resumenEmpleadoArray.forEach(row => {
            datosEmpleados.push([
                row['Empleado'],
                row['Área'],
                row['Cargo'],
                row['Fechas'],
                row['Suma Horas Normales'],
                row['Suma Horas 25%'],
                row['Suma Horas 50%'],
                row['Suma Horas 100%'],
                row['Suma Horas Feriado'],
                row['Suma Total Horas Extras'],
                row['Suma Pago Normales'],
                row['Suma Pago 25%'],
                row['Suma Pago 50%'],
                row['Suma Pago 100%'],
                row['Suma Pago Feriado'],
                row['Suma Total a Pagar Extras'],
                row['Suma Total a Pagar General']
            ]);
        });

        // Crear hoja de Excel para empleados
        const wsEmpleados = XLSX.utils.aoa_to_sheet(datosEmpleados);

        // Ajustar anchos de columna
        wsEmpleados['!cols'] = [
            { wch: 25 }, // Empleado
            { wch: 15 }, // Área
            { wch: 20 }, // Cargo
            { wch: 20 }, // Fechas
            { wch: 12 }, // Suma H.Normal
            { wch: 12 }, // Suma 25%
            { wch: 12 }, // Suma 50%
            { wch: 12 }, // Suma 100%
            { wch: 12 }, // Suma H.Feriado
            { wch: 15 }, // Suma Total Extras
            { wch: 15 }, // Suma $ Normal
            { wch: 15 }, // Suma $ 25%
            { wch: 15 }, // Suma $ 50%
            { wch: 15 }, // Suma $ 100%
            { wch: 15 }, // Suma $ Feriado
            { wch: 18 }, // Suma $ Extras
            { wch: 18 }  // Suma $ Total
        ];

        // Aplicar estilos a empleados
        // Estilo para título principal
        wsEmpleados['A1'].s = {
            font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '2C3E50' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        };

        // Merge título principal y secciones
        wsEmpleados['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 16 } }, // Título principal
            { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } },  // SUMA DE HORAS - NUMERO
            { s: { r: 2, c: 10 }, e: { r: 2, c: 16 } } // SUMA VALOR DE HORAS
        ];

        // Estilo para encabezados de sección
        wsEmpleados['A3'].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '3498DB' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        };
        wsEmpleados['K3'].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: 'E74C3C' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        };

        // Estilo para encabezados de columnas (fila 4)
        for (let C = 0; C <= 16; ++C) {
            const address = XLSX.utils.encode_cell({ r: 3, c: C });
            if (wsEmpleados[address]) {
                wsEmpleados[address].s = {
                    font: { bold: true, color: { rgb: 'FFFFFF' } },
                    fill: { fgColor: { rgb: '34495E' } },
                    alignment: { horizontal: 'center', vertical: 'center' }
                };
            }
        }

        // Aplicar formato a datos de empleados
        const inicioEmpleados = 4;
        const finEmpleados = inicioEmpleados + resumenEmpleadoArray.length - 1;
        
        for (let R = inicioEmpleados; R <= finEmpleados; ++R) {
            for (let C = 0; C <= 16; ++C) {
                const address = XLSX.utils.encode_cell({ r: R, c: C });
                if (wsEmpleados[address]) {
                    const isEvenRow = (R - inicioEmpleados) % 2 === 0;
                    wsEmpleados[address].s = {
                        fill: { fgColor: { rgb: isEvenRow ? 'F8F9FA' : 'FFFFFF' } },
                        alignment: { horizontal: C >= 4 ? 'center' : 'left' },
                        numFmt: C >= 4 && C <= 16 ? '#,##0.00' : undefined,
                        font: { bold: (C === 15 || C === 16) }
                    };
                    
                    // Resaltar totales
                    if (C === 15 || C === 16) {
                        wsEmpleados[address].s.fill = { fgColor: { rgb: 'FFE0B2' } };
                    }
                }
            }
        }

        XLSX.utils.book_append_sheet(workbook, wsEmpleados, "Por Empleado");

        // --- RESUMEN POR ÁREAS (HOJA SEPARADA) ---
        // Calcular resumen por áreas con totales de pago
        const resumenPorAreas = {};
        
        resumenEmpleadoArray.forEach(row => {
            const area = row['Área'];
            if (!resumenPorAreas[area]) {
                resumenPorAreas[area] = {
                    'Empleados': 0,
                    'Suma Horas Normales': 0,
                    'Suma Horas 25%': 0,
                    'Suma Horas 50%': 0,
                    'Suma Horas 100%': 0,
                    'Suma Horas Feriado': 0,
                    'Suma Total Horas Extras': 0,
                    'Suma Pago Normales': 0,
                    'Suma Pago 25%': 0,
                    'Suma Pago 50%': 0,
                    'Suma Pago 100%': 0,
                    'Suma Pago Feriado': 0,
                    'Suma Total a Pagar Extras': 0,
                    'Suma Total a Pagar General': 0
                };
            }
            
            resumenPorAreas[area]['Empleados']++;
            resumenPorAreas[area]['Suma Horas Normales'] += row['Suma Horas Normales'];
            resumenPorAreas[area]['Suma Horas 25%'] += row['Suma Horas 25%'];
            resumenPorAreas[area]['Suma Horas 50%'] += row['Suma Horas 50%'];
            resumenPorAreas[area]['Suma Horas 100%'] += row['Suma Horas 100%'];
            resumenPorAreas[area]['Suma Horas Feriado'] += row['Suma Horas Feriado'];
            resumenPorAreas[area]['Suma Total Horas Extras'] += row['Suma Total Horas Extras'];
            resumenPorAreas[area]['Suma Pago Normales'] += row['Suma Pago Normales'];
            resumenPorAreas[area]['Suma Pago 25%'] += row['Suma Pago 25%'];
            resumenPorAreas[area]['Suma Pago 50%'] += row['Suma Pago 50%'];
            resumenPorAreas[area]['Suma Pago 100%'] += row['Suma Pago 100%'];
            resumenPorAreas[area]['Suma Pago Feriado'] += row['Suma Pago Feriado'];
            resumenPorAreas[area]['Suma Total a Pagar Extras'] += row['Suma Total a Pagar Extras'];
            resumenPorAreas[area]['Suma Total a Pagar General'] += row['Suma Total a Pagar General'];
        });

        // Crear datos para resumen por áreas
        const datosAreas = [
            ['RESUMEN POR ÁREAS - SUMA HORAS Y PAGOS COMPLETO'],
            [],
            ['ÁREA', 'Empleados', 'Suma H.Normal', 'Suma H.25%', 'Suma H.50%', 'Suma H.100%', 'Suma H.Feriado', 'Suma H.Extras', 'Suma $.Normal', 'Suma $.25%', 'Suma $.50%', 'Suma $.100%', 'Suma $.Feriado', 'SUMA $ EXTRAS', 'SUMA $ TOTAL'],
            []
        ];

        // Agregar datos por área
        let totalGeneral = {
            empleados: 0, horasNormales: 0, horas25: 0, horas50: 0, horas100: 0, horasFeriado: 0, totalHorasExtras: 0,
            pagoNormales: 0, pago25: 0, pago50: 0, pago100: 0, pagoFeriado: 0, totalPagoExtras: 0, totalPagoGeneral: 0
        };

        Object.keys(resumenPorAreas).forEach(area => {
            const datos = resumenPorAreas[area];
            datosAreas.push([
                area,
                datos['Empleados'],
                parseFloat(datos['Suma Horas Normales'].toFixed(2)),
                parseFloat(datos['Suma Horas 25%'].toFixed(2)),
                parseFloat(datos['Suma Horas 50%'].toFixed(2)),
                parseFloat(datos['Suma Horas 100%'].toFixed(2)),
                parseFloat(datos['Suma Horas Feriado'].toFixed(2)),
                parseFloat(datos['Suma Total Horas Extras'].toFixed(2)),
                parseFloat(datos['Suma Pago Normales'].toFixed(2)),
                parseFloat(datos['Suma Pago 25%'].toFixed(2)),
                parseFloat(datos['Suma Pago 50%'].toFixed(2)),
                parseFloat(datos['Suma Pago 100%'].toFixed(2)),
                parseFloat(datos['Suma Pago Feriado'].toFixed(2)),
                parseFloat(datos['Suma Total a Pagar Extras'].toFixed(2)),
                parseFloat(datos['Suma Total a Pagar General'].toFixed(2))
            ]);
            
            // Acumular totales
            totalGeneral.empleados += datos['Empleados'];
            totalGeneral.horasNormales += datos['Suma Horas Normales'];
            totalGeneral.horas25 += datos['Suma Horas 25%'];
            totalGeneral.horas50 += datos['Suma Horas 50%'];
            totalGeneral.horas100 += datos['Suma Horas 100%'];
            totalGeneral.horasFeriado += datos['Suma Horas Feriado'];
            totalGeneral.totalHorasExtras += datos['Suma Total Horas Extras'];
            totalGeneral.pagoNormales += datos['Suma Pago Normales'];
            totalGeneral.pago25 += datos['Suma Pago 25%'];
            totalGeneral.pago50 += datos['Suma Pago 50%'];
            totalGeneral.pago100 += datos['Suma Pago 100%'];
            totalGeneral.pagoFeriado += datos['Suma Pago Feriado'];
            totalGeneral.totalPagoExtras += datos['Suma Total a Pagar Extras'];
            totalGeneral.totalPagoGeneral += datos['Suma Total a Pagar General'];
        });

        // Agregar total general
        datosAreas.push([]);
        datosAreas.push([
            'TOTAL GENERAL',
            totalGeneral.empleados,
            parseFloat(totalGeneral.horasNormales.toFixed(2)),
            parseFloat(totalGeneral.horas25.toFixed(2)),
            parseFloat(totalGeneral.horas50.toFixed(2)),
            parseFloat(totalGeneral.horas100.toFixed(2)),
            parseFloat(totalGeneral.horasFeriado.toFixed(2)),
            parseFloat(totalGeneral.totalHorasExtras.toFixed(2)),
            parseFloat(totalGeneral.pagoNormales.toFixed(2)),
            parseFloat(totalGeneral.pago25.toFixed(2)),
            parseFloat(totalGeneral.pago50.toFixed(2)),
            parseFloat(totalGeneral.pago100.toFixed(2)),
            parseFloat(totalGeneral.pagoFeriado.toFixed(2)),
            parseFloat(totalGeneral.totalPagoExtras.toFixed(2)),
            parseFloat(totalGeneral.totalPagoGeneral.toFixed(2))
        ]);

        // Crear hoja de Excel para resumen por áreas
        const wsAreas = XLSX.utils.aoa_to_sheet(datosAreas);

        // Ajustar anchos de columna para áreas
        wsAreas['!cols'] = [
            { wch: 20 }, // Área
            { wch: 10 }, // Empleados
            { wch: 12 }, // Suma H.Normal
            { wch: 12 }, // Suma H.25%
            { wch: 12 }, // Suma H.50%
            { wch: 12 }, // Suma H.100%
            { wch: 15 }, // Suma H.Feriado
            { wch: 15 }, // Suma H.Extras
            { wch: 15 }, // Suma $.Normal
            { wch: 15 }, // Suma $.25%
            { wch: 15 }, // Suma $.50%
            { wch: 15 }, // Suma $.100%
            { wch: 15 }, // Suma $.Feriado
            { wch: 18 }, // Suma $ Extras
            { wch: 18 }  // Suma $ Total
        ];

        // Aplicar estilos a resumen por áreas
        // Estilo para título
        wsAreas['A1'].s = {
            font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '27AE60' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        };

        // Merge título
        wsAreas['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } }
        ];

        // Estilo para encabezados
        for (let C = 0; C <= 14; ++C) {
            const address = XLSX.utils.encode_cell({ r: 2, c: C });
            if (wsAreas[address]) {
                wsAreas[address].s = {
                    font: { bold: true, color: { rgb: 'FFFFFF' } },
                    fill: { fgColor: { rgb: '16A085' } },
                    alignment: { horizontal: 'center', vertical: 'center' }
                };
            }
        }

        // Aplicar formato a datos de áreas
        const numAreas = Object.keys(resumenPorAreas).length;
        for (let R = 4; R < 4 + numAreas; ++R) {
            for (let C = 0; C <= 14; ++C) {
                const address = XLSX.utils.encode_cell({ r: R, c: C });
                if (wsAreas[address]) {
                    wsAreas[address].s = {
                        fill: { fgColor: { rgb: 'E8F8F5' } },
                        alignment: { horizontal: C === 0 ? 'left' : 'center' },
                        font: { bold: C === 0 },
                        numFmt: C >= 2 ? '#,##0.00' : undefined
                    };
                }
            }
        }

        // Estilo para total general
        const totalRow = 4 + numAreas + 1;
        for (let C = 0; C <= 14; ++C) {
            const address = XLSX.utils.encode_cell({ r: totalRow, c: C });
            if (wsAreas[address]) {
                wsAreas[address].s = {
                    font: { bold: true, color: { rgb: 'FFFFFF' } },
                    fill: { fgColor: { rgb: 'E74C3C' } },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    numFmt: C >= 2 ? '#,##0.00' : undefined
                };
            }
        }

        XLSX.utils.book_append_sheet(workbook, wsAreas, "Resumen por Areas");

        // Generar y descargar el archivo
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });



        return blob;
    } catch (error) {
        console.error('Error al exportar reporte detallado:', error);
        throw error;
    }
};

// Función para formatear fecha en reporte
function formatDateForReport(dateString) {
    if (!dateString) return '';
    try {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateString;
    }
}

// Función para calcular el resumen de los datos
function calcularResumen(reportData) {
    // Inicializar contadores
    const resumen = {
        totalEmpleados: new Set(),
        totalHorasNormales: 0,
        totalHoras25: 0,
        totalHoras50: 0,
        totalHoras100: 0,
        totalHorasFeriado: 0,
        totalPagoHorasNormales: 0,
        totalPagoHoras25: 0,
        totalPagoHoras50: 0,
        totalPagoHoras100: 0,
        totalPagoHorasFeriado: 0,
        totalExtras: 0,
        totalPagar: 0
    };

    reportData.forEach(row => {
        // Contar empleados únicos
        if (row['Cédula']) {
            resumen.totalEmpleados.add(row['Cédula']);
        }

        // Sumar horas (ahora son números directamente)
        resumen.totalHorasNormales += Number(row['Horas Normales']) || 0;
        resumen.totalHoras25 += Number(row['Horas 25%']) || 0;
        resumen.totalHoras50 += Number(row['Horas 50%']) || 0;
        resumen.totalHoras100 += Number(row['Horas 100%']) || 0;
        resumen.totalHorasFeriado += Number(row['Horas Feriado']) || 0;

        // Sumar pagos (ahora son números directamente)
        resumen.totalPagoHorasNormales += Number(row['Pago H. Normales ($)']) || 0;
        resumen.totalPagoHoras25 += Number(row['Pago H. 25% ($)']) || 0;
        resumen.totalPagoHoras50 += Number(row['Pago H. 50% ($)']) || 0;
        resumen.totalPagoHoras100 += Number(row['Pago H. 100% ($)']) || 0;
        resumen.totalPagoHorasFeriado += Number(row['Pago H. Feriado ($)']) || 0;

        // Totales (ahora son números directamente)
        resumen.totalExtras += Number(row['Total Horas Extras ($)']) || 0;
        resumen.totalPagar += Number(row['Total a Pagar ($)']) || 0;
    });

    return {
        ...resumen,
        totalEmpleados: resumen.totalEmpleados.size,
        totalHorasNormales: resumen.totalHorasNormales.toFixed(2),
        totalHoras25: resumen.totalHoras25.toFixed(2),
        totalHoras50: resumen.totalHoras50.toFixed(2),
        totalHoras100: resumen.totalHoras100.toFixed(2),
        totalHorasFeriado: resumen.totalHorasFeriado.toFixed(2),
        totalPagoHorasNormales: resumen.totalPagoHorasNormales.toFixed(2),
        totalPagoHoras25: resumen.totalPagoHoras25.toFixed(2),
        totalPagoHoras50: resumen.totalPagoHoras50.toFixed(2),
        totalPagoHoras100: resumen.totalPagoHoras100.toFixed(2),
        totalPagoHorasFeriado: resumen.totalPagoHorasFeriado.toFixed(2),
        totalExtras: resumen.totalExtras.toFixed(2),
        totalPagar: resumen.totalPagar.toFixed(2)
    };
}
