const { Asistencia, Empleado, HorarioEmpleado, Jornada, Area } = require('../../models');
const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');



// Reporte de asistencias en Excel
const reporteAsistenciasExcel = async (req, res) => {
    const asistencias = await Asistencia.findAll({ include: [{ model: Empleado, include: [Area] }] });
    const data = asistencias.map(a => ({
        Empleado: `${a.Empleado.nombres} ${a.Empleado.apellidos}`,
        Area: a.Empleado.Area ? a.Empleado.Area.nombre : '',
        Fecha: a.fecha,
        Entrada: a.hora_entrada,
        Salida: a.hora_salida,
        HorasNormales: a.horas_normales,
        HorasExtras: a.horas_extras,
        HorasExtraordinarias: a.horas_extraordinarias
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencias');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=asistencias.xlsx');
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
};

// Reporte de asistencias en PDF 
const reporteAsistenciasPDF = async (req, res) => {
    const asistencias = await Asistencia.findAll({ include: [{ model: Empleado, include: [Area] }] });
    const doc = new PDFDocument();
    res.setHeader('Content-Disposition', 'attachment; filename=asistencias.pdf');
    res.type('application/pdf');
    doc.pipe(res);
    doc.fontSize(14).text('Reporte de Asistencias', { align: 'center' });
    doc.moveDown();
    asistencias.forEach(a => {
        doc.fontSize(10).text(
            `${a.fecha} - ${a.Empleado.nombres} ${a.Empleado.apellidos} - Area: ${a.Empleado.Area ? a.Empleado.Area.nombre : ''} - Entrada: ${a.hora_entrada} - Salida: ${a.hora_salida} - Normales: ${a.horas_normales} - Extras: ${a.horas_extras} - Extraordinarias: ${a.horas_extraordinarias}`
        );
    });
    doc.end();
};


module.exports = {
    reporteAsistenciasExcel,
    reporteAsistenciasPDF
};
