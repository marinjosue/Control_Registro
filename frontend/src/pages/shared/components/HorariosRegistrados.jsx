import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Calendar } from 'primereact/calendar';

import { obtenerHorariosPorArea, asignarHorarioIndividual,modificarHorarioEmpleado } from '../../../services/horariosService';

import { getAllJornadas } from '../../../services/jornadaService';
import { exportAsistenciasExcel } from '../../../services/reportesService';

import SearchInput from './SearchInput';
import styles from '../styles/HorariosRegistrados.module.css';

const HorariosRegistrados = ({
    area,
    empleados = [],
    filtroFechaInicio = null,
    filtroFechaFin = null,
    filtroEmpleado = ''
}) => {
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [, setHorarios] = useState([]);
    const [jornadas, setJornadas] = useState([]);
    const [editHorarioDialog, setEditHorarioDialog] = useState(false);
    const [currentHorario, setCurrentHorario] = useState(null);
    const [filtroFechaInicioLocal, setFiltroFechaInicioLocal] = useState(filtroFechaInicio);
    const [filtroFechaFinLocal, setFiltroFechaFinLocal] = useState(filtroFechaFin);
    const [filtroEmpleadoLocal, setFiltroEmpleadoLocal] = useState(filtroEmpleado);
    const [pendingHorario, setPendingHorario] = useState(null);
    const [showReemplazoDiaLibre, setShowReemplazoDiaLibre] = useState(false);
    const [diasTrabajadosSemana, setDiasTrabajadosSemana] = useState([]);
    const [nuevoDiaLibre, setNuevoDiaLibre] = useState(null);


    const [horariosTabulados, setHorariosTabulados] = useState({
        datos: [],
        columnas: []
    });

    // Cargar horarios cuando cambian los filtros
    useEffect(() => {
        if (area) {
            cargarHorarios();
        }
    }, [area, filtroFechaInicioLocal, filtroFechaFinLocal]);
    // Obtener lista de jornadas al montar el componente
    useEffect(() => {

        const cargarJornadas = async () => {
            try {
                const data = await getAllJornadas();
                setJornadas(data);
            } catch (error) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: `Error al cargar jornadas: ${error.message}`,
                    life: 3000
                });
            }
        };
        cargarJornadas();
    }, []);


    const cargarHorarios = async () => {
        try {
            setLoading(true);

            // Preparar parámetros para la consulta
            const params = {
                ...(filtroFechaInicioLocal && { fecha_inicio: formatDate(filtroFechaInicioLocal) }),
                ...(filtroFechaFinLocal && { fecha_fin: formatDate(filtroFechaFinLocal) }),
                // Quitamos el filtro de empleado de la API ya que lo haremos en cliente
            };

            try {
                // Intentar obtener horarios
                const response = await obtenerHorariosPorArea(area, params);

                // Verificar la estructura de la respuesta y extraer los horarios
                let data = [];
                if (response && response.horarios && Array.isArray(response.horarios)) {
                    data = response.horarios;
                } else if (Array.isArray(response)) {
                    data = response;
                }

                setHorarios(data);

                // Manejar el caso de datos vacíos para evitar errores
                if (!data || data.length === 0) {
                    setHorariosTabulados({
                        datos: [],
                        columnas: []
                    });
                    return;
                }

                // Transformar los datos al formato tabular
                procesarHorariosTabular(data);
            } catch (error) {
                console.error("Error al cargar horarios:", error);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: `Error al cargar horarios: ${error.message}`,
                    life: 3000
                });

                setHorariosTabulados({
                    datos: [],
                    columnas: []
                });
            }
        } finally {
            setLoading(false);
        }
    };
    function parseFecha(fechaStr) {
        if (!fechaStr || typeof fechaStr !== 'string') return new Date(0);
        return new Date(fechaStr.replace(' ', 'T'));
    }

    // Función para transformar los horarios al formato tabular
    const procesarHorariosTabular = (data) => {
        // Ordena por empleado, fecha, id_horario DESC y createdAt DESC
        data.sort((a, b) => {
            const empA = a.empleado_id || a.id_empleado;
            const empB = b.empleado_id || b.id_empleado;
            if (empA !== empB) return empA - empB;
            if (a.fecha_horario !== b.fecha_horario) return a.fecha_horario.localeCompare(b.fecha_horario);
            // Primero comparar por id_horario (más reciente = mayor ID)
            if (b.id_horario !== a.id_horario) return b.id_horario - a.id_horario;
            // Si los IDs son iguales, usar createdAt como respaldo
            return parseFecha(b.createdAt) - parseFecha(a.createdAt);
        });

        const empleadosMap = {};
        const todasLasFechas = new Set();

        data.forEach(horario => {
            const empleadoId = horario.empleado_id || horario.id_empleado;
            const nombreCompleto = `${horario.empleado_nombre || ''} ${horario.empleado_apellido || ''}`.trim();
            const cedula = horario.cedula || '';
            const fecha = horario.fecha_horario;

            if (!empleadosMap[empleadoId]) {
                empleadosMap[empleadoId] = {
                    id: empleadoId,
                    cedula: cedula,
                    nombre: nombreCompleto,
                    horarios: {}
                };
            }

            todasLasFechas.add(fecha);

            // Verificar si ya existe un horario para esta fecha
            const horarioExistente = empleadosMap[empleadoId].horarios[fecha];

            if (!horarioExistente) {
                // Si no existe, agregarlo
                let displayText;
                if (horario.es_dia_libre) {
                    displayText = 'Descanso';
                } else {
                    const horaInicio = horario.hora_inicio ? horario.hora_inicio.substring(0, 5) : '00:00';
                    const horaFin = horario.hora_fin ? horario.hora_fin.substring(0, 5) : '00:00';
                    displayText = `${horaInicio}-${horaFin}`;
                }

                empleadosMap[empleadoId].horarios[fecha] = {
                    id_horario: horario.id_horario,
                    id_jornada: horario.id_jornada,
                    hora_inicio: horario.hora_inicio,
                    hora_fin: horario.hora_fin,
                    es_dia_libre: horario.es_dia_libre,
                    display: displayText,
                    createdAt: horario.createdAt || ''
                };
            } else {
                // Si existe, comparar usando id_horario primero, luego createdAt
                const idExistente = parseInt(horarioExistente.id_horario) || 0;
                const idActual = parseInt(horario.id_horario) || 0;

                let esNuevoMasReciente = false;

                if (idActual > idExistente) {
                    // ID mayor = más reciente
                    esNuevoMasReciente = true;
                } else if (idActual === idExistente) {
                    // Si los IDs son iguales, comparar por fecha de creación
                    const fechaExistente = parseFecha(horarioExistente.createdAt);
                    const fechaActual = parseFecha(horario.createdAt);
                    esNuevoMasReciente = fechaActual > fechaExistente;
                }
                // Si idActual < idExistente, el existente es más reciente

                if (esNuevoMasReciente) {
                    // El horario actual es más reciente, reemplazar
                    let displayText;
                    if (horario.es_dia_libre) {
                        displayText = 'Descanso';
                    } else {
                        const horaInicio = horario.hora_inicio ? horario.hora_inicio.substring(0, 5) : '00:00';
                        const horaFin = horario.hora_fin ? horario.hora_fin.substring(0, 5) : '00:00';
                        displayText = `${horaInicio}-${horaFin}`;
                    }

                    empleadosMap[empleadoId].horarios[fecha] = {
                        id_horario: horario.id_horario,
                        id_jornada: horario.id_jornada,
                        hora_inicio: horario.hora_inicio,
                        hora_fin: horario.hora_fin,
                        es_dia_libre: horario.es_dia_libre,
                        display: displayText,
                        createdAt: horario.createdAt || ''
                    };
                }
                // Si el existente es más reciente, no hacer nada (mantener el existente)
            }
        });

        const fechasOrdenadas = Array.from(todasLasFechas).sort();

        const tabular = Object.values(empleadosMap).map(empleado => {
            const fila = {
                id: empleado.id,
                cedula: empleado.cedula,
                nombre: empleado.nombre
            };
            fechasOrdenadas.forEach(fecha => {
                const horario = empleado.horarios[fecha];
                fila[fecha] = horario ? {
                    ...horario,
                    empleado_id: empleado.id
                } : { display: '-', empleado_id: empleado.id };
            });
            return fila;
        });

        setHorariosTabulados({
            datos: tabular,
            columnas: fechasOrdenadas
        });
    };
    // Función para formato de fecha YYYY-MM-DD
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    };

    // Función para formato de fecha visual DD/MM
    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        return `${parts[2]}/${parts[1]}`;
    };

    // Función para nombrar los días de la semana
    const getDayName = (dateStr) => {
        const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
        const date = new Date(dateStr);
        return days[date.getDay()];
    };

    // Filtrar empleados por nombre o cédula
    const empleadosFiltrados = useMemo(() => {
        return horariosTabulados.datos?.filter(emp => {
            if (!filtroEmpleadoLocal) return true;

            return (
                emp.nombre.toLowerCase().includes(filtroEmpleadoLocal.toLowerCase()) ||
                emp.cedula.toLowerCase().includes(filtroEmpleadoLocal.toLowerCase())
            );
        }) || [];
    }, [horariosTabulados.datos, filtroEmpleadoLocal]);

    // Renderizar celda de horario (sin historial)
    const horarioTemplate = (rowData, col) => {
        const horario = rowData[col.field];
        if (!horario || horario.display === '-') return '-';

        let cellClassName = styles.horarioCell;
        if (horario.es_dia_libre) {
            cellClassName += ' ' + styles.diaLibre;
        }

        return (
            <div
                className={cellClassName}
                onClick={() => {
                    const horarioConFecha = {
                        ...horario,
                        fecha_horario: col.field
                    };
                    openEditDialog(horarioConFecha);
                }}
                title="Click para editar horario"
            >
                {horario.display}
            </div>
        );
    };

    // Función para exportar horarios a Excel
const handleExportExcel = async () => {
    setExportLoading(true);
    try {
        await exportAsistenciasExcel(
            horariosTabulados,
            getDayName,
            formatDateDisplay,
            formatDate
        );
    } finally {
        setExportLoading(false);
    }
};
    // Abrir diálogo para editar horario
    const openEditDialog = (horario) => {
        setCurrentHorario({
            ...horario,
            es_dia_libre: horario.es_dia_libre ? true : false
        });
        setEditHorarioDialog(true);
    };

    // Cerrar diálogo de edición
    const closeEditDialog = () => {
        setCurrentHorario(null);
        setEditHorarioDialog(false);
    };

    // Guardar cambios en el horario
    const handleSaveHorario = async () => {
        if (!currentHorario) return;

        // Buscar el horario original en los datos tabulados (que ya tienen el más reciente)
        const empleadoEnTabla = horariosTabulados.datos.find(emp => emp.id === currentHorario.empleado_id);
        const horarioOriginal = empleadoEnTabla ? empleadoEnTabla[currentHorario.fecha_horario] : null;

        // Si se está cambiando de día libre a día trabajado
        if (horarioOriginal && horarioOriginal.es_dia_libre && !currentHorario.es_dia_libre) {
            // Contar días libres actuales en la semana usando los datos más recientes
            const { count } = contarDiasLibresSemanaActual(currentHorario.empleado_id, currentHorario.fecha_horario);

            // Si al quitar este día libre el empleado tendría menos de 2 días libres
            if (count <= 2) {
                // Buscar días trabajados dentro del rango de fechas disponibles para este empleado
                const diasDisponibles = [];
                
                if (empleadoEnTabla) {
                    // Obtener todas las fechas que tiene este empleado en los horarios
                    horariosTabulados.columnas.forEach(fecha => {
                        const horarioFecha = empleadoEnTabla[fecha];
                        
                        // Si existe horario para esta fecha, NO es día libre y no es el día actual que se está cambiando
                        if (horarioFecha && 
                            horarioFecha.display !== '-' && 
                            !horarioFecha.es_dia_libre && // IMPORTANTE: que no sea ya día libre
                            fecha !== currentHorario.fecha_horario) {
                            diasDisponibles.push(fecha);
                        }
                    });
                }
                
                if (diasDisponibles.length > 0) {
                    setDiasTrabajadosSemana(diasDisponibles);
                    setShowReemplazoDiaLibre(true);
                    setPendingHorario(currentHorario);
                    return;
                } else {
                    // Si no hay días disponibles para cambiar
                    toast.current?.show({
                        severity: 'warn',
                        summary: 'Advertencia',
                        detail: 'No hay días trabajados disponibles para convertir en día libre en el período actual',
                        life: 3000
                    });
                    return;
                }
            }
        }

        // Si no es un cambio problemático, guardar directamente
        await guardarHorario(currentHorario);
    };

    // Nueva función para contar días libres usando los datos tabulados (más recientes)
    const contarDiasLibresSemanaActual = (empleadoId, fecha) => {
        // Encuentra la semana de la fecha dada
        const inicioSemana = new Date(fecha);
        inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay()); // Domingo
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6); // Sábado

        let count = 0;
        let diasLibres = [];

        // Buscar el empleado en los datos tabulados
        const empleadoEnTabla = horariosTabulados.datos.find(emp => emp.id === empleadoId);

        if (empleadoEnTabla) {
            // Iterar por todas las fechas de la semana
            for (let i = 0; i < 7; i++) {
                const fechaIteracion = new Date(inicioSemana);
                fechaIteracion.setDate(inicioSemana.getDate() + i);
                const fechaStr = formatDate(fechaIteracion);

                const horario = empleadoEnTabla[fechaStr];
                if (horario && horario.es_dia_libre) {
                    count++;
                    diasLibres.push({ ...horario, fecha_horario: fechaStr });
                }
            }
        }

        return { count, diasLibres };
    };
    const guardarHorario = async (horario) => {
        // Definir isUpdate antes del try para que esté disponible en el catch
        const empleadoEnTabla = horariosTabulados.datos.find(emp => emp.id === horario.empleado_id);
        const horarioOriginal = empleadoEnTabla ? empleadoEnTabla[horario.fecha_horario] : null;
        const isUpdate = horarioOriginal && horarioOriginal.display !== '-' && horarioOriginal.id_horario;
        const rol_usuario = window?.usuario?.rol;
        
        try {
            if (isUpdate) {
               
                // Actualizar horario existente usando modificarHorarioEmpleado
                await modificarHorarioEmpleado(horario.empleado_id, [{
                    id_jornada: horario.id_jornada,
                    fecha_horario: horario.fecha_horario,
                    es_dia_libre: horario.es_dia_libre ? 1 : 0,
                    rol: rol_usuario
                }]);
            } else {
                // Crear nuevo horario usando asignarHorarioIndividual (cualquier rol puede crear)
                await asignarHorarioIndividual(horario.empleado_id, [{
                    id_jornada: horario.id_jornada,
                    fecha_horario: horario.fecha_horario,
                    es_dia_libre: horario.es_dia_libre ? 1 : 0
                }]);
            }
            
            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: isUpdate ? 'Horario actualizado correctamente' : 'Horario creado correctamente',
                life: 3000
            });
            closeEditDialog();
            cargarHorarios();
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: `Error al ${isUpdate ? 'actualizar' : 'crear'} horario: ${error.message}`,
                life: 3000
            });
        }
    };

    // Cuando el usuario selecciona el nuevo día libre y confirma
    const onConfirmReemplazoDiaLibre = async () => {
        if (!pendingHorario || !nuevoDiaLibre) return;
        
        const fechaNuevoDiaLibre = formatDate(nuevoDiaLibre);
        
        // Verificar una vez más que el día seleccionado no sea ya día libre
        const empleadoEnTabla = horariosTabulados.datos.find(emp => emp.id === pendingHorario.empleado_id);
        if (empleadoEnTabla) {
            const horarioFecha = empleadoEnTabla[fechaNuevoDiaLibre];
            if (horarioFecha && horarioFecha.es_dia_libre) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'El día seleccionado ya es un día libre',
                    life: 3000
                });
                return;
            }
        }
        
        setShowReemplazoDiaLibre(false);
        
        try {
            // 1. Guardar el cambio: el día actual pasa a trabajado
            await guardarHorario({ ...pendingHorario, es_dia_libre: false });
            // 2. Asignar el nuevo día libre
            await guardarHorario({
                ...pendingHorario,
                fecha_horario: fechaNuevoDiaLibre,
                es_dia_libre: true
            });
            
            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Día libre reemplazado correctamente',
                life: 3000
            });
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: `Error al reemplazar día libre: ${error.message}`,
                life: 3000
            });
        } finally {
            setPendingHorario(null);
            setNuevoDiaLibre(null);
        }
    };

    // Toolbar con opciones de filtrado y exportación
    const renderToolbar = () => {
        return (
            <Toolbar className={styles.tableToolbar} left={leftToolbarTemplate} right={rightToolbarTemplate} />
        );
    };

    // Cambia el filtro de fecha inicio
    const onFiltroFechaInicioChange = (e) => {
        setFiltroFechaInicioLocal(e.value);
    };

    // Cambia el filtro de fecha fin
    const onFiltroFechaFinChange = (e) => {
        setFiltroFechaFinLocal(e.value);
    };

    // Cambia el filtro de búsqueda
    const onFiltroEmpleadoChange = (e) => {
        setFiltroEmpleadoLocal(e.target.value);
    };

    // Template para lado izquierdo del toolbar (filtros)
    const leftToolbarTemplate = () => {
        return (
            <div className={styles.toolbarContainer}>
                <div className={styles.filterItem}>
                    <span className={styles.filterLabel}>Desde:</span>
                    <Calendar
                        value={filtroFechaInicioLocal}
                        onChange={onFiltroFechaInicioChange}
                        dateFormat="dd/mm/yy"
                        placeholder="Fecha inicio"
                        showIcon
                    />
                </div>
                <div className={styles.filterItem}>
                    <span className={styles.filterLabel}>Hasta:</span>
                    <Calendar
                        value={filtroFechaFinLocal}
                        onChange={onFiltroFechaFinChange}
                        dateFormat="dd/mm/yy"
                        placeholder="Fecha fin"
                        showIcon
                    />
                </div>
                <div className={styles.filterItem}>
                    <SearchInput
                        value={filtroEmpleadoLocal}
                        onChange={onFiltroEmpleadoChange}
                        placeholder="Buscar empleado o cédula..."
                    />
                </div>
            </div>
        );
    };

    // Template para lado derecho del toolbar (exportar)
    const rightToolbarTemplate = () => {
        return (
            <Button
                label="Exportar Excel"
                icon={exportLoading ? "pi pi-spin pi-spinner" : "pi pi-file-excel"}
                className="p-button-success"
                onClick={handleExportExcel}
                disabled={exportLoading || loading || !horariosTabulados.datos?.length}
            />
        );
    };

    // Header de la columna con día de semana y fecha
    const dateColumnHeader = (col) => {
        return (
            <div className={styles.columnDateHeader}>
                <div className={styles.dayName}>{getDayName(col.field)}</div>
                <div className={styles.date}>{formatDateDisplay(col.field)}</div>
            </div>
        );
    };

    // Función para obtener fechas disponibles como objetos Date para el Calendar
    const getFechasDisponiblesParaCalendar = () => {
        return diasTrabajadosSemana.map(fechaStr => new Date(fechaStr));
    };

    // Función para validar si una fecha está disponible en el Calendar
    const isDateSelectable = (date) => {
        const fechaStr = formatDate(date);
        
        // Verificar que esté en los días disponibles
        if (!diasTrabajadosSemana.includes(fechaStr)) {
            return false;
        }
        
        // Verificar que no sea ya un día libre
        const empleadoEnTabla = horariosTabulados.datos.find(emp => emp.id === pendingHorario?.empleado_id);
        if (empleadoEnTabla) {
            const horarioFecha = empleadoEnTabla[fechaStr];
            // Si ya es día libre, no se puede seleccionar
            if (horarioFecha && horarioFecha.es_dia_libre) {
                return false;
            }
        }
        
        return true;
    };
    // Función para cancelar el reemplazo de día libre
const onCancelReemplazoDiaLibre = () => {
    setShowReemplazoDiaLibre(false);
    setPendingHorario(null);
    setNuevoDiaLibre(null);
};
    // Template personalizado para el Calendar
    const dateTemplate = (date) => {
        const fechaStr = formatDate(date.date);
        const isInAvailableDays = diasTrabajadosSemana.includes(fechaStr);
        
        // Verificar si ya es día libre
        let isAlreadyDayOff = false;
        const empleadoEnTabla = horariosTabulados.datos.find(emp => emp.id === pendingHorario?.empleado_id);
        if (empleadoEnTabla) {
            const horarioFecha = empleadoEnTabla[fechaStr];
            isAlreadyDayOff = horarioFecha && horarioFecha.es_dia_libre;
        }
        
        // Por defecto, números negros
        let style = {
            color: '#222',
            fontWeight: 'normal'
        };
        
        if (isInAvailableDays) {
            if (isAlreadyDayOff) {
                // Ya es día libre - mostrar en rojo tachado
                style = {
                    color: '#dc3545',
                    fontWeight: 'bold',
                    textDecoration: 'line-through'
                };
            } else {
                // Disponible para seleccionar - negro y negrita
                style = {
                    color: '#222',
                    fontWeight: 'bold'
                };
            }
        }
        
        return (
            <span style={style} title={isAlreadyDayOff ? 'Ya es día libre' : ''}>
                {date.day}
            </span>
        );
    };

    return (
        <div className={styles.horariosContainer}>
            <Toast ref={toast} />
            <DataTable
                value={empleadosFiltrados}
                loading={loading}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                emptyMessage="No se encontraron horarios en el período seleccionado"
                className={styles.horarioTable}
                showGridlines
                responsiveLayout="scroll"
                scrollable
                scrollHeight="flex"
                frozenWidth="340px"
                header={renderToolbar()}
            >
                <Column
                    field="cedula"
                    header="Cédula"
                    sortable
                    style={{ width: '120px', minWidth: '120px' }}
                    headerStyle={{ width: '120px', minWidth: '120px', textAlign: 'center' }}
                    frozen
                />
                <Column
                    field="nombre"
                    header="Nombre Completo"
                    sortable
                    style={{ width: '220px', minWidth: '220px' }}
                    headerStyle={{ width: '220px', minWidth: '220px', textAlign: 'center' }}
                    frozen
                />
                {horariosTabulados.columnas?.map((fecha) => (
                    <Column
                        key={fecha}
                        field={fecha}
                        header={dateColumnHeader({ field: fecha })}
                        body={(rowData) => horarioTemplate(rowData, { field: fecha })}
                        style={{ width: '100px', minWidth: '100px', textAlign: 'center' }}
                        headerStyle={{ width: '100px', minWidth: '100px', textAlign: 'center' }}
                    />
                ))}
            </DataTable>
            <Dialog
                visible={showReemplazoDiaLibre}
                onHide={onCancelReemplazoDiaLibre}
                header="Reemplazar día libre"
                modal
                footer={
                    <>
                        <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={onCancelReemplazoDiaLibre} />
                        <Button label="Confirmar" icon="pi pi-check" onClick={onConfirmReemplazoDiaLibre} disabled={!nuevoDiaLibre} />
                    </>
                }
            >
                <div>
                    <p>
                        El empleado debe tener siempre 2 días libres en la semana.<br />
                        Selecciona qué día será el nuevo día libre:
                    </p>
                    <Calendar
                        value={nuevoDiaLibre}
                        onChange={(e) => setNuevoDiaLibre(e.value)}
                        inline
                        dateTemplate={dateTemplate}
                        selectOtherMonths={false}
                        showOtherMonths={false}
                        dateDisabledTemplate={(date) => !isDateSelectable(date.date)}
                        disabledDates={getFechasDisponiblesParaCalendar().length > 0 ? [] : [new Date()]} // Si no hay fechas disponibles, deshabilitar todo
                        style={{ width: '100%' }}
                        placeholder="Selecciona una fecha"
                    />
                    {nuevoDiaLibre && (
                        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
                            <strong>Fecha seleccionada:</strong> {getDayName(formatDate(nuevoDiaLibre))} {formatDateDisplay(formatDate(nuevoDiaLibre))}
                        </div>
                    )}
                </div>
            </Dialog>
            {/* Diálogo para editar horario */}
            <Dialog
                visible={editHorarioDialog}
                style={{ width: '400px' }}
                header="Editar Horario"
                modal
                onHide={closeEditDialog}
                footer={
                    <>
                        <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={closeEditDialog} />
                        <Button label="Guardar" icon="pi pi-check" onClick={handleSaveHorario} />
                    </>
                }
            >
                {currentHorario && (
                    <div className={styles.dialogForm}>
                        <div className={styles.formField}>
                            <label htmlFor="jornada">Jornada:</label>
                            <Dropdown
                                id="jornada"
                                value={currentHorario.id_jornada}
                                options={jornadas}
                                onChange={(e) => setCurrentHorario({ ...currentHorario, id_jornada: e.value })}
                                optionLabel="nombre_jornada"
                                optionValue="id_jornada"
                                placeholder="Seleccione una jornada"
                                style={{ width: '100%' }}
                                disabled={currentHorario.es_dia_libre}
                            />
                        </div>

                        <div className={styles.formField}>
                            <div className="p-field-checkbox">
                                <input
                                    id="es_dia_libre"
                                    type="checkbox"
                                    checked={currentHorario.es_dia_libre}
                                    onChange={(e) => setCurrentHorario({ ...currentHorario, es_dia_libre: e.target.checked })}
                                />
                                <label htmlFor="es_dia_libre" className={styles.checkboxLabel}>
                                    Día libre
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
}

export default HorariosRegistrados;
