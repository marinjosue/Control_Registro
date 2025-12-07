import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { getAsistencias } from '../../services/asistenciasService';
import websocketService from '../../services/websocketService';
import './styles/TableStyles.css';
import RecursosHumanosMenu from './components/RecursosHumanosMenu';

const AsistenciasManagement = () => {
    const [asistencias, setAsistencias] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const toast = useRef(null);

    // WEBSOCKET: Inicializar conexión
    useEffect(() => {


        const socket = websocketService.connect();

        if (socket) {
            const handleAsistenciaRegistrada = (data) => {
                console.log('🔌 [WEBSOCKET] Datos recibidos:', data);

                try {
                    if (!data || !data.asistencia || !data.empleado) {
                        console.error('🔌 [WEBSOCKET] Datos incompletos:', data);
                        return;
                    }

                    //  CREAR REGISTRO CON EL MISMO FORMATO QUE USA LA TABLA
                    const registroCompleto = {
                        id_asistencia: data.asistencia.id_asistencia,
                        fecha_entrada: data.asistencia.fecha_entrada,
                        hora_entrada: data.asistencia.hora_entrada,
                        fecha_salida: data.asistencia.fecha_salida,
                        hora_salida: data.asistencia.hora_salida,
                        estado: data.asistencia.estado,
                        horas_trabajadas: data.asistencia.horas_trabajadas,
                        observaciones: data.asistencia.observaciones,
                        tipo_registro: data.asistencia.tipo_registro,
                        createdAt: data.asistencia.createdAt,
                        hora_entrada_desayuno: data.asistencia.hora_entrada_desayuno,
                        hora_salida_desayuno: data.asistencia.hora_salida_desayuno,
                        hora_entrada_almuerzo: data.asistencia.hora_entrada_almuerzo,
                        hora_salida_almuerzo: data.asistencia.hora_salida_almuerzo,
                        hora_entrada_merienda: data.asistencia.hora_entrada_merienda,
                        hora_salida_merienda: data.asistencia.hora_salida_merienda,
                        Empleado: {
                            nombres: data.empleado.nombres,
                            apellidos: data.empleado.apellidos,
                            cedula: data.empleado.cedula,
                            Area: {
                                nombre: data.empleado.Area?.nombre || 'Sin área'
                            },
                            Cargo: {
                                cargo: data.empleado.Cargo?.cargo || 'Sin cargo'
                            }
                        }
                    };

                    //  ACTUALIZAR TABLA SEGÚN EL TIPO DE REGISTRO
                    setAsistencias(prevAsistencias => {
                        if (data.es_registro_nuevo) {
                            //  AGREGAR NUEVO REGISTRO AL INICIO
                            console.log('🔌 [WEBSOCKET] Agregando nuevo registro');
                            return [registroCompleto, ...prevAsistencias];
                        } else {
                            //  ACTUALIZAR REGISTRO EXISTENTE
                            console.log('🔌 [WEBSOCKET] Actualizando registro existente');
                            return prevAsistencias.map(asistencia =>
                                asistencia.id_asistencia === registroCompleto.id_asistencia
                                    ? registroCompleto
                                    : asistencia
                            );
                        }
                    });

                    //  NOTIFICACIÓN 
                    const mensaje = data.es_registro_nuevo
                        ? `${data.empleado.nombres} ${data.empleado.apellidos} registró entrada`
                        : `${data.empleado.nombres} ${data.empleado.apellidos} - Registro actualizado`;

                    if (toast.current) {
                        toast.current.show({
                            severity: 'success',
                            summary: 'Asistencia Registrada',
                            detail: mensaje,
                            life: 3000
                        });
                    }

                    console.log(`🔌 [WEBSOCKET] Tabla actualizada: ${data.es_registro_nuevo ? 'NUEVO' : 'ACTUALIZACIÓN'} - ${data.empleado.nombres}`);

                } catch (error) {
                    console.error('🔌 [WEBSOCKET] Error procesando evento:', error);
                }
            };

            // LISTENER
            websocketService.on('asistencia_registrada', handleAsistenciaRegistrada);

            return () => {
                console.log('🔌 [WEBSOCKET] Limpiando listeners...');
                websocketService.off('asistencia_registrada', handleAsistenciaRegistrada);
                websocketService.disconnect();
            };
        }
    }, []); 

    useEffect(() => {
        loadAsistencias();
    }, []);

    const loadAsistencias = async (params = {}) => {
        try {
            setLoading(true);
            console.log('Loading asistencias with params:', params);
            
            // Agregar parámetro para solicitar todos los registros
            const requestParams = {
                ...params,
                size: 1000  // Un número grande para asegurar que se traigan todos los registros
            };
            
            const data = await getAsistencias(requestParams);
            console.log('Received asistencias data:', data);

            // Debug: Log first item structure
            if (data && data.length > 0) {
                console.log('First asistencia item structure:', JSON.stringify(data[0], null, 2));
            }

            // Ensure data is an array
            const asistenciasArray = Array.isArray(data) ? data : (data?.asistencias || []);
            setAsistencias(asistenciasArray);

            if (asistenciasArray.length === 0) {
                toast.current?.show({
                    severity: 'info',
                    summary: 'Información',
                    detail: 'No se encontraron asistencias para los filtros aplicados',
                    life: 3000
                });
            } else {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: `Se cargaron ${asistenciasArray.length} registros de asistencias`,
                    life: 3000
                });
            }
        } catch (error) {
            console.error('Error loading asistencias:', error);
            const errorMessage = error.message === 'Error interno del servidor al cargar asistencias'
                ? 'Error del servidor. Verifique que el endpoint /api/asistencias esté implementado correctamente.'
                : error.message || 'Error al cargar asistencias';

            if (toast.current) {
                toast.current.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: errorMessage,
                    life: 5000
                });
            }
            setAsistencias([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        const params = {};
        if (fechaInicio) {
            params.fecha_inicio = fechaInicio.toISOString().split('T')[0];
        }
        if (fechaFin) {
            params.fecha_fin = fechaFin.toISOString().split('T')[0];
        }
        loadAsistencias(params);
    };

    const clearFilter = () => {
        setFechaInicio(null);
        setFechaFin(null);
        setGlobalFilter('');
        loadAsistencias();
    };

    // Formateadores
    const formatDate = (value) => {
        if (!value) return '';

        // If value is already in YYYY-MM-DD format, convert it properly
        const date = new Date(value + 'T00:00:00'); // Add time to avoid timezone issues

        return date.toLocaleDateString('es-EC', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const formatTime = (value) => {
        if (!value) return '';
        // If value is in HH:MM:SS format, just return HH:MM
        if (typeof value === 'string' && value.includes(':')) {
            return value.slice(0, 5);
        }
        return value;
    };

    // Column templates - Add debugging
    const nombreCompletoBody = (row) => {
        const result = row.Empleado
            ? `${row.Empleado.apellidos} ${row.Empleado.nombres}`
            : '';
        return result;
    };

    const areaBody = (row) => {
        const result = row.Empleado && row.Empleado.Area
            ? row.Empleado.Area.nombre
            : '';
        return result;
    };

    const cargoBody = (row) => {
        const result = row.Empleado && row.Empleado.Cargo
            ? row.Empleado.Cargo.cargo
            : '';
        return result;
    };

    const fechaEntradaBody = (row) => {
        console.log('Raw fecha_entrada:', row.fecha_entrada);
        const formatted = row.fecha_entrada ? formatDate(row.fecha_entrada) : '';
        console.log('Formatted fecha_entrada:', formatted);
        return formatted;
    };

    const horaEntradaBody = (row) => {
        console.log('Raw hora_entrada:', row.hora_entrada);
        const formatted = row.hora_entrada ? formatTime(row.hora_entrada) : '';
        console.log('Formatted hora_entrada:', formatted);
        return formatted;
    };

    const fechaSalidaBody = (row) => {
        console.log('Raw fecha_salida:', row.fecha_salida);
        const formatted = row.fecha_salida ? formatDate(row.fecha_salida) : '';
        console.log('Formatted fecha_salida:', formatted);
        return formatted;
    };

    const horaSalidaBody = (row) => {
        console.log('Raw hora_salida:', row.hora_salida);
        const formatted = row.hora_salida ? formatTime(row.hora_salida) : '';
        console.log('Formatted hora_salida:', formatted);
        return formatted;
    };

    const horasTrabajadasBody = (row) =>
        row.horas_trabajadas != null ? row.horas_trabajadas : '';

    const horaEntradaDesayunoBody = (row) => formatTime(row.hora_entrada_desayuno);
    const horaSalidaDesayunoBody = (row) => formatTime(row.hora_salida_desayuno);
    const horaEntradaAlmuerzoBody = (row) => formatTime(row.hora_entrada_almuerzo);
    const horaSalidaAlmuerzoBody = (row) => formatTime(row.hora_salida_almuerzo);
    const horaEntradaMeriendaBody = (row) => formatTime(row.hora_entrada_merienda);
    const horaSalidaMeriendaBody = (row) => formatTime(row.hora_salida_merienda);

    const estadoBodyTemplate = (rowData) => {
        const getStatusSeverity = (status) => {
            switch (status?.toLowerCase()) {
                case 'puntual': return 'success';
                case 'tardanza': return 'warning';
                case 'ausente': return 'danger';
                default: return 'info';
            }
        };

        return (
            <span className={`p-tag p-tag-${getStatusSeverity(rowData.estado)}`}>
                {rowData.estado || 'N/A'}
            </span>
        );
    };

    const leftToolbarTemplate = () => (
        <div className="flex flex-wrap gap-2">
            <Calendar
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.value)}
                placeholder="Fecha inicio"
                dateFormat="dd/mm/yy"
                showIcon
            />
            <Calendar
                value={fechaFin}
                onChange={(e) => setFechaFin(e.value)}
                placeholder="Fecha fin"
                dateFormat="dd/mm/yy"
                showIcon
            />
            <Button
                label="Filtrar"
                icon="pi pi-filter"
                onClick={handleFilter}
            />
            <Button
                label="Limpiar"
                icon="pi pi-times"
                severity="secondary"
                onClick={clearFilter}
            />
        </div>
    );

    const rightToolbarTemplate = () => (
        <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
                type="search"
                placeholder="Buscar empleado..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
            />
        </span>
    );

    const header = (
        <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
            <h4 className="m-0">Gestión de Asistencias</h4>
        </div>
    );

    const handleTableScroll = (e) => {
        const { scrollLeft, scrollWidth, clientWidth } = e.target;
        const progress = (scrollLeft / (scrollWidth - clientWidth)) * 100;
        setScrollProgress(Math.min(progress, 100));
    };

    // Filtro global personalizado: buscar por nombre, apellido o cédula
    const filteredAsistencias = asistencias.filter(row => {
        if (!globalFilter) return true;
        const empleado = row.Empleado || {};
        const search = globalFilter.toLowerCase();
        return (
            (empleado.nombres && empleado.nombres.toLowerCase().includes(search)) ||
            (empleado.apellidos && empleado.apellidos.toLowerCase().includes(search)) ||
            (empleado.cedula && empleado.cedula.toLowerCase().includes(search))
        );
    });

    return (
        <div className="asistencias-management">
            <RecursosHumanosMenu />
            <Toast ref={toast} />

            <div className="rh-dashboard-content">
                <div className="card">
                    <Toolbar
                        className="mb-4"
                        left={leftToolbarTemplate}
                        right={rightToolbarTemplate}
                    />

                    <div className="responsive-table-container">
                        <DataTable
                            value={filteredAsistencias}
                            dataKey="id_asistencia"
                            paginator
                            rows={10}
                            rowsPerPageOptions={[5, 10, 25]}
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} asistencias"
                            // globalFilter removed, handled by filteredAsistencias
                            header={header}
                            loading={loading}
                            responsiveLayout="scroll"
                            breakpoint="768px"
                            className="responsive-datatable"
                            onScroll={handleTableScroll}
                        >
                            <Column
                                header="Empleado"
                                body={nombreCompletoBody}
                                sortable
                                headerClassName="text-center"
                                bodyClassName="text-left"
                            />
                            <Column
                                header="Área"
                                body={areaBody}
                                sortable
                                headerClassName="text-center"
                                bodyClassName="text-center"
                            />
                            <Column
                                header="Cargo"
                                body={cargoBody}
                                sortable
                                headerClassName="text-center"
                                bodyClassName="text-left"
                            />
                            <Column
                                header="F. Entrada"
                                body={fechaEntradaBody}
                                sortable
                                headerClassName="text-center"
                                bodyClassName="text-center"
                            />
                            <Column
                                header="H. Entrada"
                                body={horaEntradaBody}
                                sortable
                                headerClassName="text-center"
                                bodyClassName="text-center"
                            />
                            <Column
                                header="F. Salida"
                                body={fechaSalidaBody}
                                sortable
                                headerClassName="text-center"
                                bodyClassName="text-center"
                            />
                            <Column
                                header="H. Salida"
                                body={horaSalidaBody}
                                sortable
                                headerClassName="text-center"
                                bodyClassName="text-center"
                            />
                            <Column
                                header="Horas Trab."
                                body={horasTrabajadasBody}
                                sortable
                                headerClassName="text-center"
                                bodyClassName="text-center"
                            />
                            <Column
                                header="Entrada Desayuno"
                                body={horaEntradaDesayunoBody}
                                sortable
                                headerClassName="text-center"
                                bodyClassName="text-center"
                            />
                            <Column
                                header="Salida Desayuno"
                                body={horaSalidaDesayunoBody}
                                sortable
                                headerClassName="text-center"
                                bodyClassName="text-center"
                            />
                            <Column
                                header="Entrada Almuerzo"
                                body={horaEntradaAlmuerzoBody}
                                sortable
                                headerClassName="text-center"
                                bodyClassName="text-center"
                            />
                            <Column
                                header="Salida Almuerzo"
                                body={horaSalidaAlmuerzoBody}
                                sortable
                                headerClassName="text-center"
                                bodyClassName="text-center"
                            />
                            <Column
                                header="Entrada Merienda"
                                body={horaEntradaMeriendaBody}
                                sortable
                                headerClassName="text-center"
                                bodyClassName="text-center"
                            />
                            <Column
                                header="Salida Merienda"
                                body={horaSalidaMeriendaBody}
                                sortable
                                headerClassName="text-center"
                                bodyClassName="text-center"
                            />
                            <Column
                                header="Estado"
                                body={estadoBodyTemplate}
                                sortable
                                headerClassName="text-center"
                                bodyClassName="text-center"
                            />
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AsistenciasManagement;