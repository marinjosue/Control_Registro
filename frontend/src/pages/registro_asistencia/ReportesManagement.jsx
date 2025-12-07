import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { getAsistencias } from '../../services/asistenciasService';
import { exportarDetallesHoras } from '../../services/exportarHorasService';
import { calcularHoras } from '../../services/calculoHoraService';
import RecursosHumanosMenu from './components/RecursosHumanosMenu';
import { saveAs } from 'file-saver';
// Importamos el nuevo archivo de estilos
import './styles/ReportesStyles.css';
// Agregamos el Dialog para la confirmación
import { Dialog } from 'primereact/dialog';
import DebugInfo from '../../components/DebugInfo';

const ReportesManagement = () => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [calculando, setCalculando] = useState(false);
    // Agregamos nuevos estados para manejar empleados administrativos
    const [adminDialogVisible, setAdminDialogVisible] = useState(false);
    const [calcularExtrasAdministrativo, setCalcularExtrasAdministrativo] = useState(false);
    const [empleadosAdministrativos, setEmpleadosAdministrativos] = useState([]);
    const [asistenciasParaCalcular, setAsistenciasParaCalcular] = useState([]);
    const [totals, setTotals] = useState({
        horasNormales: 0,
        horas25: 0,
        horas50: 0,
        horas100: 0,
        horasFeriado: 0,
        totalHoras: 0,
        totalPago: 0
    });
    const toast = useRef(null);

    useEffect(() => {
        // Set default date range (current month)
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        setFechaInicio(firstDay);
        setFechaFin(lastDay);
        
        // Load data with these default dates
        loadReportData({
            fecha_inicio: firstDay.toISOString().split('T')[0],
            fecha_fin: lastDay.toISOString().split('T')[0]
        });
    }, []);

    useEffect(() => {
        calculateTotals();
    }, [reportData]);

    const loadReportData = async (params = {}) => {
        try {
            setLoading(true);
            // Use the same endpoint as asistencias but we'll transform the data
            
            // Agregar parámetro para solicitar todos los registros
            const requestParams = {
                ...params,
                size: 1000  // Un número grande para asegurar que se traigan todos los registros
            };
            
            const data = await getAsistencias(requestParams);
            
            // Log the number of records received for debugging
            console.log(`Recibidos ${data?.length || 0} registros de asistencias`);
            
            // Process data to include calculated fields
            const processedData = data.map(asistencia => {
                const sueldo = asistencia.Empleado?.sueldo || 0;
                const sueldoHora = sueldo / 160; // 160 horas mensuales (aproximadamente)
                
                // Calculate payment values
                const pagoNormal = parseFloat((sueldoHora * asistencia.horas_normales).toFixed(2));
                const pago25 = parseFloat((sueldoHora * 1.25 * asistencia.horas_25).toFixed(2));
                const pago50 = parseFloat((sueldoHora * 1.5 * asistencia.horas_50).toFixed(2));
                const pago100 = parseFloat((sueldoHora * 2 * asistencia.horas_100).toFixed(2));
                const pagoFeriado = parseFloat((sueldoHora * 2.5 * asistencia.horas_feriado).toFixed(2));
                
                // Calculate total extra hours and payment
                const horasExtra = asistencia.horas_25 + asistencia.horas_50 + asistencia.horas_100 + asistencia.horas_feriado;
                const pagoExtra = parseFloat((pago25 + pago50 + pago100 + pagoFeriado).toFixed(2));
                const pagoTotal = parseFloat((pagoNormal + pagoExtra).toFixed(2));
                
                // Identificar si es administrativo (por cargo o por área)
                const esAdministrativo = 
                    (asistencia.Empleado?.Cargo?.cargo?.toUpperCase().includes('ADMINISTRATIVO')) || 
                    (asistencia.Empleado?.Area?.nombre?.toUpperCase() === 'ADMINISTRACION');
                
                return {
                    ...asistencia,
                    nombreCompleto: `${asistencia.Empleado?.nombres || ''} ${asistencia.Empleado?.apellidos || ''}`,
                    sueldo: parseFloat(sueldo),
                    sueldoHora: parseFloat(sueldoHora.toFixed(2)),
                    pagoNormal,
                    pago25,
                    pago50,
                    pago100,
                    pagoFeriado,
                    horasExtra,
                    pagoExtra,
                    pagoTotal,
                    esAdministrativo
                };
            });
            
            setReportData(processedData);
            
            // Identificamos empleados administrativos para tomar decisiones más adelante
            const administrativos = processedData.filter(item => item.esAdministrativo);
            setEmpleadosAdministrativos(administrativos);
            console.log(`Detectados ${administrativos.length} empleados administrativos`);
        } catch (error) {
            console.error('Error loading report data:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Error al cargar datos del reporte',
                life: 5000
            });
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = () => {
        const newTotals = reportData.reduce((acc, row) => {
            return {
                horasNormales: acc.horasNormales + (row.horas_normales || 0),
                horas25: acc.horas25 + (row.horas_25 || 0),
                horas50: acc.horas50 + (row.horas_50 || 0),
                horas100: acc.horas100 + (row.horas_100 || 0),
                horasFeriado: acc.horasFeriado + (row.horas_feriado || 0),
                totalHoras: acc.totalHoras + (row.horas_trabajadas || 0),
                totalPago: acc.totalPago + (row.pagoTotal || 0)
            };
        }, {
            horasNormales: 0,
            horas25: 0,
            horas50: 0,
            horas100: 0,
            horasFeriado: 0,
            totalHoras: 0,
            totalPago: 0
        });
        
        // Round to 2 decimals
        newTotals.totalPago = parseFloat(newTotals.totalPago.toFixed(2));
        
        setTotals(newTotals);
    };

    const handleFilter = () => {
        if (!fechaInicio || !fechaFin) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Por favor seleccione un rango de fechas',
                life: 3000
            });
            return;
        }
        
        const params = {
            fecha_inicio: fechaInicio.toISOString().split('T')[0],
            fecha_fin: fechaFin.toISOString().split('T')[0]
        };
        
        loadReportData(params);
    };

    const handleExportExcel = async () => {
        try {
            setExportLoading(true);
            
            // Get current date range for filename
            const startDateStr = fechaInicio ? fechaInicio.toISOString().split('T')[0] : '';
            const endDateStr = fechaFin ? fechaFin.toISOString().split('T')[0] : '';
            
            // Prepare parameters
            const params = {
                fecha_inicio: startDateStr,
                fecha_fin: endDateStr
            };
            
            // Usar el nuevo servicio de exportación detallada
            const blob = await exportarDetallesHoras(params);
            
            // Download the file
            const fileName = `Reporte_Detallado_Horas_${startDateStr}_${endDateStr}.xlsx`;
            saveAs(blob, fileName);
            
            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Reporte exportado correctamente',
                life: 3000
            });
        } catch (error) {
            console.error('Error exporting report:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Error al exportar reporte',
                life: 5000
            });
        } finally {
            setExportLoading(false);
        }
    };

    // NUEVO: Calcular horas usando la API y actualizar la tabla
    // MODIFICADO: Pre-verificación para cálculo de horas
    const handleCalcularHoras = async () => {
        try {
            setCalculando(true);
            
            // Primero obtenemos las asistencias para ese rango de fechas
            const params = {
                size: 1000  // Solicitar todos los registros
            };
            if (fechaInicio) params.fecha_inicio = fechaInicio.toISOString().split('T')[0];
            if (fechaFin) params.fecha_fin = fechaFin.toISOString().split('T')[0];
            
            // Obtener todas las asistencias para el rango de fechas
            const asistencias = await getAsistencias(params);
            
            // Verificamos que tengamos asistencias para calcular
            if (!asistencias || asistencias.length === 0) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Advertencia',
                    detail: 'No hay asistencias para calcular en el rango de fechas seleccionado',
                    life: 3000
                });
                setCalculando(false);
                return;
            }

            // Log the number of records for calculation
            console.log(`Procesando cálculo para ${asistencias.length} asistencias`);
            
            // Guardamos las asistencias para usar después
            setAsistenciasParaCalcular(asistencias);
            
            // Verificar si hay empleados administrativos en el rango de fechas
            const tieneAdministrativos = asistencias.some(a => 
                (a.Empleado?.Cargo?.cargo?.toUpperCase().includes('ADMINISTRATIVO')) || 
                (a.Empleado?.Area?.nombre?.toUpperCase() === 'ADMINISTRACION')
            );
            
            console.log("¿Tiene administrativos?", tieneAdministrativos);
            
            // Imprimir las áreas detectadas para debugging
            const areasDetectadas = [...new Set(asistencias.map(a => a.Empleado?.Area?.nombre).filter(Boolean))];
            console.log("Áreas detectadas:", areasDetectadas);
            
            if (tieneAdministrativos) {
                // Mostrar diálogo de confirmación
                setAdminDialogVisible(true);
                setCalculando(false);
            } else {
                // No hay administrativos, proceder directamente
                procederConCalculoHoras(asistencias, false);
            }
            
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Error al preparar cálculo de horas',
                life: 5000
            });
            setCalculando(false);
        }
    };

    // NUEVO: Función para proceder con el cálculo después de la decisión del usuario
    const procederConCalculoHoras = async (asistencias, calcularExtrasAdmin) => {
        try {
            setCalculando(true);
            
            // Log the number of records we're sending for calculation
            console.log(`Enviando ${asistencias.length} asistencias para cálculo`);
            
            // Enviamos todas las asistencias al endpoint de cálculo y forzamos el recálculo
            // Pasando el nuevo parámetro para cálculo administrativo
            const result = await calcularHoras({
                asistencias: asistencias.map(a => a.id_asistencia),
                forzar_recalculo: true,
                calcularExtrasAdministrativo: calcularExtrasAdmin
            });

            // Verificar si hubo procesamiento
            if (result.procesados === 0) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Advertencia',
                    detail: result.mensaje || 'No se procesaron registros nuevos',
                    life: 5000
                });
                
                // Si no se procesaron pero hay un mensaje de omitidos, preguntamos si quiere cargar los datos actuales
                if (result.omitidos > 0) {
                    // Cargar los datos actuales para mostrar lo que ya está calculado
                    const params = {};
                    if (fechaInicio) params.fecha_inicio = fechaInicio.toISOString().split('T')[0];
                    if (fechaFin) params.fecha_fin = fechaFin.toISOString().split('T')[0];
                    loadReportData(params);
                }
                
                setCalculando(false);
                return;
            }

            // Cargar los datos actualizados
            const params = {
                size: 1000  // Solicitar todos los registros
            };
            if (fechaInicio) params.fecha_inicio = fechaInicio.toISOString().split('T')[0];
            if (fechaFin) params.fecha_fin = fechaFin.toISOString().split('T')[0];
            
            await loadReportData(params);
            
            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: `Se calcularon ${result.procesados} asistencias correctamente${
                    calcularExtrasAdmin ? ' con horas extras para administrativos' : ''
                }`,
                life: 3000
            });
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Error al calcular horas',
                life: 5000
            });
        } finally {
            setCalculando(false);
        }
    };

    // NUEVO: Manejadores para el diálogo de administrativos
    const confirmarCalculoAdministrativo = () => {
        setAdminDialogVisible(false);
        procederConCalculoHoras(asistenciasParaCalcular, true);
    };

    const rechazarCalculoAdministrativo = () => {
        setAdminDialogVisible(false);
        procederConCalculoHoras(asistenciasParaCalcular, false);
    };

    const adminDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={rechazarCalculoAdministrativo} />
            <Button label="Sí" icon="pi pi-check" className="p-button-text" onClick={confirmarCalculoAdministrativo} />
        </React.Fragment>
    );

    // Formatter functions
    const formatDate = (value) => {
        if (!value) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const [y, m, d] = value.split('-');
            return `${d}/${m}/${y}`;
        }
        const date = new Date(value);
        return date.toLocaleDateString('es-EC');
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return '';
        return '$' + Number(value).toFixed(2);
    };

    // Column templates
    const nombreCompletoTemplate = (rowData) => {
        return rowData.nombreCompleto || '';
    };

    const salarioTemplate = (rowData) => {
        return rowData.sueldo ? `$${parseFloat(rowData.sueldo).toFixed(2)}` : '';
    };

    const cargoTemplate = (rowData) => {
        return rowData.Empleado?.Cargo?.cargo || '';
    };

    const fechaTrabajoTemplate = (rowData) => {
        // Mostrar correctamente la fecha_entrada
        return formatDate(rowData.fecha_entrada);
    };

    // Filter by employee name
    const filteredData = reportData.filter(row => {
        if (!globalFilter) return true;
        const searchTerm = globalFilter.toLowerCase();
        return (
            (row.nombreCompleto && row.nombreCompleto.toLowerCase().includes(searchTerm)) ||
            (row.Empleado?.cedula && row.Empleado.cedula.toLowerCase().includes(searchTerm))
        );
    });

    // Toolbar content
    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Calendar
                    id="fechaInicio"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.value)}
                    dateFormat="dd/mm/yy"
                    placeholder="Fecha Inicio"
                    showIcon
                    className="w-full sm:w-auto"
                />
                <Calendar
                    id="fechaFin"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.value)}
                    dateFormat="dd/mm/yy"
                    placeholder="Fecha Fin"
                    showIcon
                    className="w-full sm:w-auto"
                />
                <Button
                    label="Filtrar"
                    icon="pi pi-filter"
                    className="p-button-info w-full sm:w-auto"
                    onClick={handleFilter}
                />
                <Button
                    label="Calcular Horas"
                    icon="pi pi-calculator"
                    className="p-button-warning w-full sm:w-auto"
                    onClick={handleCalcularHoras}
                    loading={calculando}
                />
            </div>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <span className="p-input-icon-left mr-2 w-full md:w-auto">
                    <i className="pi pi-search" />
                    <InputText
                        type="search"
                        placeholder="Buscar por nombre..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full"
                    />
                </span>
                <Button
                    label="Exportar Excel Detallado"
                    icon="pi pi-file-excel"
                    className="p-button-success w-full md:w-auto"
                    onClick={handleExportExcel}
                    loading={exportLoading}
                />
                <DebugInfo data={reportData} title="Información de Empleados y Áreas" />
            </div>
        );
    };

    return (
        <div className="reportes-management">
            <RecursosHumanosMenu />
            <Toast ref={toast} />
            
            {/* Diálogo para confirmar cálculo de extras administrativos */}
            <Dialog 
                visible={adminDialogVisible} 
                style={{ width: '450px' }} 
                header="Confirmación" 
                modal 
                footer={adminDialogFooter} 
                onHide={() => setAdminDialogVisible(false)}
            >
                <div className="confirmation-content">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>
                        Se han detectado empleados con cargo administrativo. 
                        ¿Desea calcular horas extras para estos empleados?
                    </span>
                </div>
            </Dialog>
            
            <div className="rh-dashboard-content">
                <div className="card">
                    <h2 className="responsive-title">Reporte de Horas y Pagos</h2>
                    
                    <Toolbar
                        className="mb-4 responsive-toolbar"
                        left={leftToolbarTemplate}
                        right={rightToolbarTemplate}
                    />
                    
                    <div className="reportes-table-container">
                        <DataTable
                            value={filteredData}
                            paginator
                            rows={10}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            emptyMessage="No hay datos disponibles"
                            loading={loading}
                            dataKey="id_asistencia"
                            className="reportes-datatable responsive-datatable"
                            responsiveLayout="scroll"
                        >
                            <Column 
                                field="nombreCompleto" 
                                header="Nombre Completo" 
                                body={nombreCompletoTemplate} 
                                sortable 
                            />
                            <Column 
                                field="sueldo" 
                                header="Salario" 
                                body={salarioTemplate} 
                                sortable 
                            />
                            <Column 
                                field="cargo" 
                                header="Cargo" 
                                body={cargoTemplate} 
                                sortable 
                            />
                            <Column 
                                field="fecha_entrada" 
                                header="Fecha Trabajada" 
                                body={fechaTrabajoTemplate} 
                                sortable 
                            />
                            <Column 
                                field="horas_trabajadas" 
                                header="Total Horas" 
                                sortable 
                            />
                            <Column 
                                field="horas_normales" 
                                header="H. Normales" 
                                sortable 
                            />
                            <Column 
                                field="horas_25" 
                                header="H. 25%" 
                                sortable 
                            />
                            <Column 
                                field="horas_50" 
                                header="H. 50%" 
                                sortable 
                            />
                            <Column 
                                field="horas_100" 
                                header="H. 100%" 
                                sortable 
                            />
                            <Column 
                                field="horas_feriado" 
                                header="H. Feriado" 
                                sortable 
                            />
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportesManagement;
