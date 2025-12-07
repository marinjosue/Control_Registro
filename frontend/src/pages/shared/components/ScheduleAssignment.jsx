import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Calendar } from 'primereact/calendar';
import { asignarHorarioMultiple } from '../../../services/jornadaService';
import { asignarHorarioIndividual } from '../../../services/horariosService';
import PatternAssignment from './PatternAssignment';
import AssignmentType from './AssignmentType';
import JornadasPorDiaSelector from './JornadasPorDiaSelector';
import styles from '../styles/AssignmentStyles.module.css';
import SearchInput from './SearchInput';

const ScheduleAssignment = ({ empleados, jornadas, loading, toast }) => {
    const [asignarDialog, setAsignarDialog] = useState(false);
    const [asignarIndividualDialog, setAsignarIndividualDialog] = useState(false);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
    const [asignacionForm, setAsignacionForm] = useState({
        empleados_seleccionados: [],
        jornada_id: '',
        tipo_asignacion: 'PATRON_ROTATIVO',
        fecha_inicio: null,
        fecha_fin: null,
        fechas_especificas: [],
        dias_semana: [],
        dias_trabajo: [],
        dias_libres: [],
        es_dia_libre: false,
        semanas_rotacion: 1,
        jornadas_por_dia: {}
    });
    const [jornadasPorDia, setJornadasPorDia] = useState({});
    const [diasSemanaOptions, setDiasSemanaOptions] = useState([
        { label: 'Lunes', value: 'Lunes' },
        { label: 'Martes', value: 'Martes' },
        { label: 'Miércoles', value: 'Miércoles' },
        { label: 'Jueves', value: 'Jueves' },
        { label: 'Viernes', value: 'Viernes' },
        { label: 'Sábado', value: 'Sábado' },
        { label: 'Domingo', value: 'Domingo' }
    ]);

    const [filtroEmpleado, setFiltroEmpleado] = useState('');

    // Función para reorganizar los días de la semana basados en la fecha de inicio
    const reorganizarDiasSemana = (fecha) => {
        if (!fecha) return;

        // Nombres de días en español
        const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

        // Obtener el día de la semana de la fecha seleccionada (0 = Domingo, 1 = Lunes, etc.)
        const diaInicio = fecha.getDay();

        // Crear un clon de la fecha para no modificar la original
        let fechaActual = new Date(fecha);

        // Reorganizar el array de opciones comenzando desde el día seleccionado
        const opcionesReorganizadas = [];
        for (let i = 0; i < 7; i++) {
            const indiceDia = (diaInicio + i) % 7;
            const diaNombre = diasNombres[indiceDia];

            // Formatear la fecha actual para mostrar (dd/mm)
            const diaFormateado = fechaActual.getDate().toString().padStart(2, '0');
            const mesFormateado = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
            const fechaFormateada = `${diaFormateado}/${mesFormateado}`;

            opcionesReorganizadas.push({
                label: `${diaNombre} - ${fechaFormateada}`,
                value: diaNombre // Mantenemos solo el nombre del día como valor
            });

            // Avanzar un día
            fechaActual.setDate(fechaActual.getDate() + 1);
        }

        setDiasSemanaOptions(opcionesReorganizadas);
    };

    // Actualizar los días de la semana cuando cambia la fecha de inicio
    useEffect(() => {
        if (asignacionForm.fecha_inicio) {
            reorganizarDiasSemana(asignacionForm.fecha_inicio);
        }
    }, [asignacionForm.fecha_inicio]);

    // Función para manejar el cambio de fecha de inicio
    const handleFechaInicioChange = (e) => {
        const nuevaFecha = e.value;
        setAsignacionForm(prev => ({
            ...prev,
            fecha_inicio: nuevaFecha
        }));
        reorganizarDiasSemana(nuevaFecha);
    };

    const empleadosFiltrados = empleados.filter((emp) =>
        ` ${emp.apellidos} ${emp.nombres}`.toLowerCase().includes(filtroEmpleado.toLowerCase()) ||
        emp.cedula?.includes(filtroEmpleado)
    );

    // Función para generar patrón rotativo
    const generarPatronRotativo = (fechaInicio, semanas, diasTrabajo, diasLibres) => {
        const fechas = [];
        let fechaActual = new Date(fechaInicio);
        const totalDias = semanas * 7;
        const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

        for (let dia = 0; dia < totalDias; dia++) {
            const diaNombre = diasNombres[fechaActual.getDay()];
            const esDiaLibre = diasLibres.includes(diaNombre);

            fechas.push({
                fecha: new Date(fechaActual),
                es_dia_libre: esDiaLibre,
                dia_nombre: diaNombre
            });

            fechaActual.setDate(fechaActual.getDate() + 1);
        }

        return fechas;
    };

    // Función para formatear fecha para el backend (YYYY-MM-DD)
    const formatearFechaParaBackend = (fecha) => {
        return fecha.toISOString().split('T')[0];
    };

    // Nuevo: Obtener id_jornada según el día de la semana
    const obtenerJornadaPorDia = (diaNombre) => {
        return jornadasPorDia[diaNombre] || asignacionForm.jornada_id;
    };

    const handleAsignarHorarios = async () => {
        try {
            let asignacionesIndividuales = [];

            if (asignacionForm.tipo_asignacion === 'PATRON_ROTATIVO') {
                // Validar campos requeridos
                if (!asignacionForm.fecha_inicio || !asignacionForm.jornada_id ||
                    !asignacionForm.dias_trabajo?.length || !asignacionForm.dias_libres?.length ||
                    !asignacionForm.empleados_seleccionados?.length) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Complete todos los campos requeridos: fecha, jornada, días y empleados.'
                    });
                    return;
                }

                const patron = generarPatronRotativo(
                    asignacionForm.fecha_inicio,
                    asignacionForm.semanas_rotacion,
                    asignacionForm.dias_trabajo,
                    asignacionForm.dias_libres
                );

                // Generate assignments for each employee
                asignacionForm.empleados_seleccionados.forEach(empleado => {
                    patron.forEach(item => {
                        const empleadoId = empleado.id_empleado || empleado.id;
                        if (empleadoId && item.fecha) {
                            // Usar jornada específica para el día o la jornada general
                            const jornadaId = item.es_dia_libre ?
                                parseInt(asignacionForm.jornada_id) :
                                parseInt(obtenerJornadaPorDia(item.dia_nombre));

                            asignacionesIndividuales.push({
                                id_empleado: empleadoId,
                                id_jornada: jornadaId,
                                fecha_horario: formatearFechaParaBackend(item.fecha),
                                es_dia_libre: item.es_dia_libre ? 1 : 0
                            });
                        }
                    });
                });

                // Eliminar duplicados
                const uniqueAssignments = {};
                const filteredAssignments = asignacionesIndividuales.filter(a => {
                    const key = `${a.id_empleado}_${a.fecha_horario}`;
                    if (uniqueAssignments[key]) return false;
                    uniqueAssignments[key] = true;
                    return true;
                });

                if (filteredAssignments.length === 0) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se generaron asignaciones válidas.'
                    });
                    return;
                }

                const resultado = await asignarHorarioMultiple(filteredAssignments);

                // Mostrar resultado apropiado
                if (resultado.hasErrors) {
                    toast.current?.show({
                        severity: 'warn',
                        summary: 'Procesamiento Parcial',
                        detail: resultado.message,
                        life: 5000
                    });

                    // Mostrar detalles de errores si los hay
                    if (resultado.detalles?.errores?.length > 0) {
                        const erroresDetalle = resultado.detalles.errores.slice(0, 3).map(e =>
                            `Fecha: ${e.asignacion.fecha_horario} - ${e.error}`
                        ).join('\n');

                        toast.current?.show({
                            severity: 'error',
                            summary: 'Errores Detectados',
                            detail: erroresDetalle,
                            life: 7000
                        });
                    }
                } else {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: resultado.message
                    });
                }

                resetAsignacionForm();
                return;
            }

        } catch (error) {
            console.error('Error completo:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al asignar horarios: ' + (error.message || 'Error desconocido')
            });
        }
    };

    const handleAsignarHorarioIndividual = async () => {
        try {
            let asignacionesIndividuales = [];

            if (asignacionForm.tipo_asignacion === 'PATRON_ROTATIVO') {

                const patron = generarPatronRotativo(
                    asignacionForm.fecha_inicio,
                    asignacionForm.semanas_rotacion,
                    asignacionForm.dias_trabajo,
                    asignacionForm.dias_libres
                );

                // Generar asignaciones con jornadas específicas por día
                asignacionesIndividuales = patron
                    .filter(item => item.fecha)
                    .map(item => {
                        // Usar jornada específica para el día o la jornada general
                        const jornadaId = item.es_dia_libre ?
                            parseInt(asignacionForm.jornada_id) :
                            parseInt(obtenerJornadaPorDia(item.dia_nombre));

                        return {
                            id_jornada: jornadaId,
                            fecha_horario: formatearFechaParaBackend(item.fecha),
                            es_dia_libre: item.es_dia_libre ? 1 : 0
                        };
                    });

                // Eliminar duplicados
                const uniqueAssignments = {};
                asignacionesIndividuales = asignacionesIndividuales.filter(a => {
                    const key = a.fecha_horario;
                    if (uniqueAssignments[key]) return false;
                    uniqueAssignments[key] = true;
                    return true;
                });
            }

            if (!empleadoSeleccionado?.id_empleado && !empleadoSeleccionado?.id) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Empleado no seleccionado.'
                });
                return;
            }

            if (!asignacionesIndividuales.length) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No hay asignaciones válidas para enviar.'
                });
                return;
            }

            const resultado = await asignarHorarioIndividual(
                empleadoSeleccionado.id_empleado || empleadoSeleccionado.id,
                asignacionesIndividuales
            );

            // Mostrar resultado apropiado
            if (resultado.hasErrors) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Procesamiento Parcial',
                    detail: `${empleadoSeleccionado.nombres} ${empleadoSeleccionado.apellidos}: ${resultado.message}`,
                    life: 5000
                });
            } else {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: `${empleadoSeleccionado.nombres} ${empleadoSeleccionado.apellidos}: ${resultado.message}`
                });
            }

            resetAsignacionIndividualForm();
        } catch (error) {
            console.error('Error completo:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: `Error al asignar horario a ${empleadoSeleccionado?.nombres || 'empleado'}: ` + (error.message || 'Error desconocido')
            });
        }
    };

    const resetAsignacionForm = () => {
        setAsignacionForm({
            empleados_seleccionados: [],
            jornada_id: '',
            tipo_asignacion: 'PATRON_ROTATIVO',
            fecha_inicio: null,
            fecha_fin: null,
            fechas_especificas: [],
            dias_semana: [],
            dias_trabajo: [],
            dias_libres: [],
            es_dia_libre: false,
            semanas_rotacion: 1,
            jornadas_por_dia: {}
        });
        setJornadasPorDia({});
        setAsignarDialog(false);
    };

    const resetAsignacionIndividualForm = () => {
        setAsignacionForm({
            empleados_seleccionados: [],
            jornada_id: '',
            tipo_asignacion: 'PATRON_ROTATIVO',
            fecha_inicio: null,
            fecha_fin: null,
            fechas_especificas: [],
            dias_semana: [],
            dias_trabajo: [],
            dias_libres: [],
            es_dia_libre: false,
            semanas_rotacion: 1,
            jornadas_por_dia: {}
        });
        setJornadasPorDia({});
        setAsignarIndividualDialog(false);
        setEmpleadoSeleccionado(null);
    };
    // Funciones para los templates de las columnas
    const empleadoTemplate = (rowData) => (
        ` ${rowData.apellidos} ${rowData.nombres}`
    );

    const cargoTemplate = (rowData) => (
        rowData.cargo || 'Sin cargo asignado'
    );

    const accionesTemplate = (rowData) => (
        <div style={{ position: 'relative' }}>
            <Button
                icon="pi pi-clock"
                className="p-button-rounded p-button-text p-button-sm"
                aria-label="Asignar horario"
                onClick={(e) => {
                    e.stopPropagation(); 
                    setEmpleadoSeleccionado(rowData);
                    setAsignarIndividualDialog(true);
                }}
            />
        </div>
    );

    // Nuevo componente reutilizable para el formulario de asignación
    const ScheduleAssignmentForm = ({
        empleados,
        jornadas,
        asignacionForm,
        setAsignacionForm,
        diasSemanaOptions,
        handleFechaInicioChange,
        jornadasPorDia,
        setJornadasPorDia,
        showEmpleadoSelector = false,
        disabled,
        onCancel,
        onSubmit,
        styles
    }) => (
        <div className={styles.formContainer}>
            {showEmpleadoSelector && (
                <div>
                    <label htmlFor='selecciona_empleado'>Seleccionar Empleados:</label>
                    <MultiSelect
                        value={asignacionForm.empleados_seleccionados}
                        options={empleados}
                        onChange={(e) => setAsignacionForm({ ...asignacionForm, empleados_seleccionados: e.value })}
                        optionLabel={(option) => `${option.nombres} ${option.apellidos}`}
                        placeholder="Seleccione empleados"
                        style={{ width: '100%', marginTop: '0.5rem' }}
                        display="chip"
                        filter
                    />
                </div>
            )}

            <div>
                <label htmlFor='jornada'>Jornada Principal:</label>
                <Dropdown
                    value={asignacionForm.jornada_id}
                    options={jornadas}
                    onChange={(e) => setAsignacionForm({ ...asignacionForm, jornada_id: e.value })}
                    optionLabel="nombre_jornada"
                    optionValue="id_jornada"
                    placeholder="Seleccione una jornada"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                    filter
                />
            </div>

            <AssignmentType
                asignacionForm={asignacionForm}
                setAsignacionForm={setAsignacionForm}
                showAllTypes={showEmpleadoSelector}
                namePrefix={showEmpleadoSelector ? "tipoAsignacion" : "tipoAsignacionInd"}
            />

            {asignacionForm.tipo_asignacion === 'PATRON_ROTATIVO' && (
                <div className={styles.formGroup}>
                    <label htmlFor="fecha_inicio">Fecha de Inicio:</label>
                    <Calendar
                        id="fecha_inicio"
                        value={asignacionForm.fecha_inicio}
                        onChange={handleFechaInicioChange}
                        dateFormat="dd/mm/yy"
                        showIcon
                        style={{ width: '100%', marginTop: '0.5rem' }}
                    />
                </div>
            )}

            {asignacionForm.tipo_asignacion === 'PATRON_ROTATIVO' && (
                <PatternAssignment
                    asignacionForm={asignacionForm}
                    setAsignacionForm={setAsignacionForm}
                    diasSemanaOptions={diasSemanaOptions}
                    hideFechaInicio={true}
                />
            )}

            {asignacionForm.tipo_asignacion === 'PATRON_ROTATIVO' &&
                asignacionForm.dias_trabajo &&
                asignacionForm.dias_trabajo.length > 0 && (
                    <JornadasPorDiaSelector
                        diasTrabajo={asignacionForm.dias_trabajo}
                        jornadas={jornadas}
                        jornadasPorDia={jornadasPorDia}
                        setJornadasPorDia={setJornadasPorDia}
                        jornadaDefault={asignacionForm.jornada_id}
                    />
                )}

            <div className={styles.dialogActions}>
                <Button
                    label="Cancelar"
                    onClick={onCancel}
                    className="p-button-text"
                />
                <Button
                    label="Asignar"
                    onClick={onSubmit}
                    disabled={disabled}
                />
            </div>
        </div>
    );

    return (
        <>
            <div
                style={{
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap'
                }}
            >
                <Button
                    label="Asignar Horarios"
                    icon="pi pi-clock"
                    onClick={() => setAsignarDialog(true)}
                    className="p-button-primary"
                />
                <SearchInput
                    value={filtroEmpleado}
                    onChange={(e) => setFiltroEmpleado(e.target.value)}
                    placeholder="Buscar empleado o cédula..."
                />
            </div>

            <DataTable
                value={empleadosFiltrados}
                loading={loading}
                paginator
                rows={10}
                emptyMessage="No hay empleados en esta área"
            >
                <Column
                    field="nombres"
                    header="Empleado"
                    body={empleadoTemplate}
                    sortable
                />
                <Column field="id_cargo" header="Cargo" body={cargoTemplate} sortable />
                <Column field="cedula" header="Cédula" sortable />
                <Column field="correo" header="Correo" />
                <Column
                    field="telefono"
                    header="Teléfono"
                    style={{ width: '150px' }}
                />
                <Column
                    header="Acciones"
                    body={accionesTemplate}
                    style={{ width: '100px', textAlign: 'center' }}
                />
            </DataTable>

            {/* Dialog para asignación múltiple */}
            <Dialog
                header="Asignar Horarios"
                visible={asignarDialog}
                onHide={resetAsignacionForm}
                style={{ width: '800px' }}
                modal
                appendTo="self"
                blockScroll={false}
            >
                <ScheduleAssignmentForm
                    empleados={empleados}
                    jornadas={jornadas}
                    asignacionForm={asignacionForm}
                    setAsignacionForm={setAsignacionForm}
                    diasSemanaOptions={diasSemanaOptions}
                    handleFechaInicioChange={handleFechaInicioChange}
                    jornadasPorDia={jornadasPorDia}
                    setJornadasPorDia={setJornadasPorDia}
                    showEmpleadoSelector={true}
                    disabled={
                        !asignacionForm.empleados_seleccionados.length ||
                        (asignacionForm.tipo_asignacion === 'PATRON_ROTATIVO' &&
                            (!asignacionForm.fecha_inicio || !asignacionForm.jornada_id ||
                                !asignacionForm.dias_trabajo?.length || !asignacionForm.dias_libres?.length))
                    }
                    onCancel={resetAsignacionForm}
                    onSubmit={handleAsignarHorarios}
                    styles={styles}
                />
            </Dialog>

            {/* Dialog para asignación individual */}
            <Dialog
                header={`Asignar Horario - ${empleadoSeleccionado?.nombres} ${empleadoSeleccionado?.apellidos}`}
                visible={asignarIndividualDialog}
                onHide={resetAsignacionIndividualForm}
                style={{ width: '600px' }}
                modal
                appendTo="self"
                blockScroll={false}
            >
                <ScheduleAssignmentForm
                    empleados={empleados}
                    jornadas={jornadas}
                    asignacionForm={asignacionForm}
                    setAsignacionForm={setAsignacionForm}
                    diasSemanaOptions={diasSemanaOptions}
                    handleFechaInicioChange={handleFechaInicioChange}
                    jornadasPorDia={jornadasPorDia}
                    setJornadasPorDia={setJornadasPorDia}
                    showEmpleadoSelector={false}
                    disabled={
                        (asignacionForm.tipo_asignacion === 'PATRON_ROTATIVO' &&
                            (!asignacionForm.fecha_inicio || !asignacionForm.jornada_id ||
                                !asignacionForm.dias_trabajo?.length || !asignacionForm.dias_libres?.length))
                    }
                    onCancel={resetAsignacionIndividualForm}
                    onSubmit={handleAsignarHorarioIndividual}
                    styles={styles}
                />
            </Dialog>
        </>
    );
};

export default ScheduleAssignment;