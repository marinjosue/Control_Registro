import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';



export const exportAsistenciasExcel = (horariosTabulados, getDayName, formatDateDisplay, formatDate) => {

    // Encabezado con estilos
    const header = [
        {
            v: 'Cédula',
            s: {
                font: { bold: true, color: { rgb: 'FFFFFFFF' } },
                fill: { fgColor: { rgb: 'FF4F81BD' } },
                alignment: { horizontal: 'center' }
            }
        },
        {
            v: 'Nombre Completo',
            s: {
                font: { bold: true, color: { rgb: 'FFFFFFFF' } },
                fill: { fgColor: { rgb: 'FF4F81BD' } },
                alignment: { horizontal: 'center' }
            }
        },
        ...horariosTabulados.columnas.map((fecha) => {
            return {
                v: `${getDayName(fecha).toUpperCase()} ${formatDateDisplay(fecha)}`,
                s: {
                    font: { bold: true, color: { rgb: 'FFFFFFFF' } },
                    fill: { fgColor: { rgb: 'FF4F81BD' } },
                    alignment: { horizontal: 'center' }
                }
            };
        })
    ];

    // Filas alternando blanco y gris claro
    const rows = horariosTabulados.datos.map((emp, idx) => {
        const bgColor = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF2F2F2'; // blanco o gris claro
        return [
            {
                v: emp.cedula,
                s: {
                    fill: { fgColor: { rgb: bgColor } },
                    alignment: { horizontal: 'center' }
                }
            },
            {
                v: emp.nombre,
                s: {
                    fill: { fgColor: { rgb: bgColor } },
                    alignment: { horizontal: 'center' }
                }
            },
            ...horariosTabulados.columnas.map((fecha) => {
                const celda = emp[fecha];
                // Si es día libre o 0, pinta de rojo
                if (celda && (celda.display === 'Descanso' )) {
                    return {
                        v: celda.display,
                        s: {
                            fill: { fgColor: { rgb: 'FFFF0000' } },
                            font: { color: { rgb: 'FFFFFFFF' }, bold: true },
                            alignment: { horizontal: 'center' }
                        }
                    };
                }
                // Si no, alterna blanco y gris claro
                return {
                    v: celda ? celda.display : '-',
                    s: {
                        fill: { fgColor: { rgb: bgColor } },
                        alignment: { horizontal: 'center' }
                    }
                };
            })
        ];
    });

    // Une encabezado y filas
    const data = [header, ...rows];

    // Crea la hoja y el libro
    const ws = XLSX.utils.aoa_to_sheet(data);

    ws['!cols'] = [
        { wch: 15 },
        { wch: 30 },
        ...horariosTabulados.columnas.map(() => ({ wch: 12 }))
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Horarios');

    // Genera el archivo y lo descarga
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `horarios_${formatDate(new Date())}.xlsx`);
};