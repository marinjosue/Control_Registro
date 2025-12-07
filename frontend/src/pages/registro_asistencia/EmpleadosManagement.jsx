import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { FileUpload } from 'primereact/fileupload';
import { confirmDialog } from 'primereact/confirmdialog';
import RecursosHumanosMenu from './components/RecursosHumanosMenu';
import {
    getAllEmpleados,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado
} from '../../services/empleadosService';
import { batchImportEmpleados } from '../../services/importarService';
import * as XLSX from 'xlsx';
import './styles/EmpleadosManagement.css';

const EmpleadosManagement = () => {
    const [empleados, setEmpleados] = useState([]);
    const [empleadoDialog, setEmpleadoDialog] = useState(false);
    const [importDialog, setImportDialog] = useState(false);
    const [empleado, setEmpleado] = useState({});
    const [selectedEmpleados, setSelectedEmpleados] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [excelData, setExcelData] = useState(null); // Para almacenar los datos del Excel
    const [excelFileName, setExcelFileName] = useState(''); // Para mostrar el nombre del archivo
    const [importLoading, setImportLoading] = useState(false); // Para el estado de importación
    const [previewData, setPreviewData] = useState([]); // Para mostrar vista previa de datos
    const [windowHeight, setWindowHeight] = useState(window.innerHeight); // Estado para manejar el scrollHeight dinámicamente
    const fileUploadRef = useRef(null); // Referencia al componente FileUpload
    const toast = useRef(null);

    const cargos = [
        { label: 'ASISTENTE DE PRODUCCION', value: 'ASISTENTE DE PRODUCCION' },
        { label: 'AUXILIAR DE BODEGA', value: 'AUXILIAR DE BODEGA' },
        { label: 'ELECTROMECANICO', value: 'ELECTROMECANICO' },
        { label: 'GERENTE DE CALIDAD', value: 'GERENTE DE CALIDAD' },
        { label: 'GERENTE DE OPERACIONES', value: 'GERENTE DE OPERACIONES' },
        { label: 'GERENTE DE PRODUCCION', value: 'GERENTE DE PRODUCCION' },
        { label: 'JEFE DE BODEGA', value: 'JEFE DE BODEGA' },
        { label: 'JEFE DE PRODUCCION', value: 'JEFE DE PRODUCCION' },
        { label: 'JEFE DE VENTAS', value: 'JEFE DE VENTAS' },
        { label: 'OPERADOR DE PRODUCCION', value: 'OPERADOR DE PRODUCCION' },
        { label: 'OPERATIVO DE BODEGA', value: 'OPERATIVO DE BODEGA' },
        { label: 'SUPERVISOR DE CALIDAD', value: 'SUPERVISOR DE CALIDAD' },
        { label: 'SUPERVISOR DE PRODUCCION', value: 'SUPERVISOR DE PRODUCCION' }
    ];

    // Añadir opciones de áreas
    const areas = [
        { label: 'CALIDAD', value: 1 },
        { label: 'BODEGA', value: 2 },
        { label: 'PRODUCCION', value: 3 },
        { label: 'ADMINISTRACION', value: 4 },
        { label: 'MANTENIMIENTO', value: 5 }
    ];

    // Opciones de estado
    const estados = [
        { label: 'Activo', value: 'Activo' },
        { label: 'Inactivo', value: 'Inactivo' }
    ];

    useEffect(() => {
        loadEmpleados();
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setWindowHeight(window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadEmpleados = async () => {
        try {
            setLoading(true);
            const data = await getAllEmpleados();
            setEmpleados(data);
        } catch (error) {
            if (toast.current) {
                toast.current.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar empleados'
                });
            } else {
                console.error('Error al cargar empleados', error);
            }
        } finally {
            setLoading(false);
        }
    };

    const openNew = () => {
        setEmpleado({});
        setSubmitted(false);
        setEmpleadoDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setEmpleadoDialog(false);
    };

    const hideImportDialog = () => {
        setExcelData(null);
        setExcelFileName('');
        setPreviewData([]);
        setImportDialog(false);
        if (fileUploadRef.current) {
            fileUploadRef.current.clear(); // Limpiar el archivo seleccionado
        }
    };

    // Mapea el nombre del cargo a un id_cargo (ajusta según tu lógica real)
    const cargoToId = (cargoName) => {
        // Puedes usar un objeto o lógica real según tu base de datos
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
        return cargosMap[cargoName] || null;
    };

    const saveEmpleado = async () => {
        setSubmitted(true);

        if (empleado.nombres && empleado.apellidos && empleado.cedula) {
            try {
                // Prepara los datos para el backend
                const empleadoData = {
                    ...empleado,
                    id_area: empleado.id_area ? parseInt(empleado.id_area) : 3, // Default to PRODUCCION (3)
                    id_cargo: empleado.cargo ? cargoToId(empleado.cargo) : 10, // Default to OPERADOR DE PRODUCCION (10)
                    cargo: undefined, // No enviar el campo cargo (nombre) si el backend no lo espera
                    sueldo: empleado.sueldo ? parseFloat(empleado.sueldo) : 0,
                    edad: empleado.edad ? parseInt(empleado.edad) : null,
                    estado: empleado.estado || 'Activo'
                };

                // Elimina campos vacíos o undefined
                Object.keys(empleadoData).forEach(
                    (key) => (empleadoData[key] === undefined || empleadoData[key] === '' || empleadoData[key] === null) && delete empleadoData[key]
                );

                if (empleado.id_empleado) {
                    await updateEmpleado(empleado.id_empleado, empleadoData);
                    if (toast.current) {
                        toast.current.show({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Empleado actualizado'
                        });
                    }
                } else {
                    await createEmpleado(empleadoData);
                    if (toast.current) {
                        toast.current.show({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Empleado creado'
                        });
                    }
                }

                loadEmpleados();
                setEmpleadoDialog(false);
                setEmpleado({});
            } catch (error) {
                console.error("Error saving employee:", error);
                if (toast.current) {
                    toast.current.show({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.message || 'Error al guardar empleado'
                    });
                } else {
                    alert(error.message || 'Error al guardar empleado');
                }
            }
        }
    };

    const editEmpleado = (empleado) => {
        setEmpleado({ ...empleado });
        setEmpleadoDialog(true);
    };

    const confirmDeleteEmpleado = (empleado) => {
        confirmDialog({
            message: `¿Está seguro de eliminar a ${empleado.nombres} ${empleado.apellidos}?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => deleteEmpleadoConfirmed(empleado.id_empleado)
        });
    };

    const deleteEmpleadoConfirmed = async (id) => {
        try {
            await deleteEmpleado(id);
            loadEmpleados();
            toast.current.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Empleado eliminado'
            });
        } catch (error) {
            if (toast.current) {
                toast.current.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al eliminar empleado'
                });
            } else {
                console.error('Error al eliminar empleado', error);
            }
        }
    };

    // Calcula la edad a partir de la fecha de nacimiento
    const calcularEdad = (fechaNacimiento) => {
        if (!fechaNacimiento) return '';
        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const m = hoy.getMonth() - nacimiento.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }
        return edad;
    };

    // Modifica onInputChange para calcular edad automáticamente
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _empleado = { ...empleado };
        _empleado[name] = val;

        if (name === 'fecha_nacimiento') {
            _empleado.edad = calcularEdad(val);
        }

        setEmpleado(_empleado);
    };

    // Función para cargar el archivo Excel y mostrar los datos
    const cargarExcel = async (event) => {
        try {
            const file = event.files[0];
            setExcelFileName(file.name);

            toast.current.show({
                severity: 'info',
                summary: 'Procesando',
                detail: `Leyendo archivo: ${file.name}`,
                life: 3000
            });

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    const worksheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[worksheetName];

                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    if (jsonData.length === 0) {
                        toast.current.show({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'El archivo no contiene datos'
                        });
                        setExcelData(null);
                        return;
                    }

                    // Guardar datos del Excel
                    setExcelData(jsonData);

                    // Crear vista previa de los primeros 5 registros
                    setPreviewData(jsonData.slice(0, 5));

                    toast.current.show({
                        severity: 'success',
                        summary: 'Excel cargado',
                        detail: `Se han cargado ${jsonData.length} registros correctamente`,
                        life: 3000
                    });

                } catch (error) {
                    console.error('Error procesando Excel:', error);
                    toast.current.show({
                        severity: 'error',
                        summary: 'Error de procesamiento',
                        detail: `Error al procesar el Excel: ${error.message}`,
                        life: 5000
                    });
                    setExcelData(null);
                }
            };

            reader.onerror = () => {
                toast.current.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al leer el archivo'
                });
                setExcelData(null);
            };

            reader.readAsArrayBuffer(file);

        } catch (error) {
            console.error('Error general:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: `Error al cargar Excel: ${error.message}`
            });
            setExcelData(null);
        }
    };

    // Función para importar los datos ya cargados
    const importarDatos = async () => {
        if (!excelData || excelData.length === 0) {
            toast.current.show({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'No hay datos para importar. Por favor cargue un archivo Excel primero.'
            });
            return;
        }

        setImportLoading(true);

        try {
            toast.current.show({
                severity: 'info',
                summary: 'Importando',
                detail: `Procesando ${excelData.length} empleados...`,
                life: 5000
            });

            const result = await batchImportEmpleados(excelData);

            if (result.successful > 0) {
                toast.current.show({
                    severity: 'success',
                    summary: 'Importación exitosa',
                    detail: `${result.successful} empleados importados correctamente`,
                    life: 8000
                });
            }

            if (result.failed > 0) {
                toast.current.show({
                    severity: 'warn',
                    summary: 'Importación con errores',
                    detail: `${result.failed} empleados no pudieron ser importados`,
                    life: 8000
                });

                const failedItems = result.details.filter(item => !item.success);
                console.error('Empleados con errores:', failedItems);

                failedItems.slice(0, 5).forEach((item, index) => {
                    setTimeout(() => {
                        toast.current.show({
                            severity: 'error',
                            summary: `Error ${index + 1}: ${item.empleado.cedula || item.empleado.nombres || 'Sin identificar'}`,
                            detail: item.message,
                            life: 10000
                        });
                    }, index * 1000);
                });
            }

            await loadEmpleados();
            hideImportDialog();

        } catch (error) {
            console.error('Error procesando Excel:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Error de importación',
                detail: `Error al importar datos: ${error.message}`,
                life: 8000
            });
        } finally {
            setImportLoading(false);
        }
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button
                    label="Nuevo"
                    icon="pi pi-plus"
                    severity="success"
                    onClick={openNew}
                />
                <Button
                    label="Importar"
                    icon="pi pi-upload"
                    severity="info"
                    onClick={() => setImportDialog(true)}
                />
            </div>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <div className="flex align-items-center">
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        type="search"
                        placeholder="Buscar..."
                        onInput={(e) => setGlobalFilter(e.target.value)}
                    />
                </span>
            </div>
        );
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-pencil"
                    severity="info"
                    size="small"
                    onClick={() => editEmpleado(rowData)}
                />
                <Button
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    onClick={() => confirmDeleteEmpleado(rowData)}
                />
            </div>
        );
    };

    const header = (
        <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
            <h4 className="m-0">Gestión de Empleados</h4>
        </div>
    );

    const empleadoDialogFooter = (
        <div>
            <Button
                label="Cancelar"
                icon="pi pi-times"
                outlined
                onClick={hideDialog}
            />
            <Button
                label="Guardar"
                icon="pi pi-check"
                onClick={saveEmpleado}
            />
        </div>
    );

    // Función para manejar el scroll horizontal
    const handleTableScroll = (e) => {
        const { scrollLeft, scrollWidth, clientWidth } = e.target;
        const progress = (scrollLeft / (scrollWidth - clientWidth)) * 100;
        setScrollProgress(Math.min(progress, 100));
    };

    // Renderiza las columnas de la vista previa
    const renderPreviewColumns = () => {
        if (!previewData || previewData.length === 0) return null;

        // Obtener las columnas del primer registro
        const columns = Object.keys(previewData[0]);

        return columns.map((col, i) => (
            <Column
                key={i}
                field={col}
                header={col}
                style={{ minWidth: '150px' }}
            />
        ));
    };

    // Función para calcular la altura dinámica de la tabla
    const getTableScrollHeight = () => {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            // En móvil, usar menos altura para dejar espacio para otros elementos
            return `${Math.min(windowHeight * 0.4, 300)}px`;
        }
        // En desktop, mantener la altura actual
        return "400px";
    };

    return (
        <div className="empleados-management">
            <RecursosHumanosMenu className="menu-lateral" />
            <Toast ref={toast} />

            <div className="card">
                <Toolbar
                    className="mb-4"
                    left={leftToolbarTemplate}
                    right={rightToolbarTemplate}
                />

                <div className="empleados-table-container">
                    <div className="sticky-table-container">
                        <div className="table-scroll-indicator">
                            <div
                                className="table-scroll-progress"
                                style={{ width: `${scrollProgress}%` }}
                            ></div>
                        </div>

                        <DataTable
                            value={empleados}
                            selection={selectedEmpleados}
                            onSelectionChange={(e) => setSelectedEmpleados(e.value)}
                            dataKey="id_empleado"
                            paginator
                            rows={10}
                            stickyHeader
                            scrollHeight={getTableScrollHeight()} // Usar altura dinámica
                            rowsPerPageOptions={[5, 10, 25]}
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} empleados"
                            globalFilter={globalFilter}
                            header={header}
                            loading={loading}
                            scrollable
                            onScroll={handleTableScroll}
                            className="responsive-datatable" // Añadir clase para estilos específicos
                        >
                            <Column selectionMode="multiple" exportable={false}></Column>
                            <Column field="apellidos" header="Apellidos" sortable style={{ minWidth: '12rem' }}></Column>
                            <Column field="nombres" header="Nombres" sortable style={{ minWidth: '12rem' }}></Column>
                            <Column field="cedula" header="Cédula" sortable style={{ minWidth: '10rem' }}></Column>
                            <Column field="correo" header="Correo" sortable style={{ minWidth: '14rem' }}></Column>
                            <Column field="direccion" header="Dirección" sortable style={{ minWidth: '14rem' }}></Column>
                            <Column field="fecha_nacimiento" header="Fecha Nacimiento" sortable style={{ minWidth: '10rem' }}></Column>
                            <Column field="edad" header="Edad" sortable style={{ minWidth: '6rem' }}></Column>
                            <Column field="telefono" header="Teléfono" sortable style={{ minWidth: '10rem' }}></Column>
                            <Column field="fecha_ingreso" header="Fecha Ingreso" sortable style={{ minWidth: '10rem' }}></Column>
                            <Column field="sueldo" header="Sueldo" sortable style={{ minWidth: '8rem' }}></Column>
                            <Column field="pin" header="PIN" sortable style={{ minWidth: '8rem' }}></Column>
                            <Column field="area" header="Área" sortable style={{ minWidth: '12rem' }}></Column>
                            <Column field="cargo" header="Cargo" sortable style={{ minWidth: '12rem' }}></Column>
                            <Column
                                body={actionBodyTemplate}
                                exportable={false}
                                field="acciones"
                                header="Acciones"
                                style={{
                                    position: 'sticky',
                                    right: 0,
                                    zIndex: 1,
                                    background: 'white',
                                    boxShadow: '-2px 0 8px -4px rgba(0,0,0,0.15)'
                                }}
                                headerStyle={{
                                    position: 'sticky',
                                    right: 0,
                                    zIndex: 1001,
                                    background: 'white',
                                    boxShadow: '-2px 0 8px -4px rgba(0,0,0,0.15)'
                                }}
                                frozen
                                alignFrozen="right"
                            />
                        </DataTable>
                    </div>
                </div>
            </div>

            <Dialog
                visible={empleadoDialog}
                style={{ width: '550px' }}
                header="Detalles del Empleado"
                modal
                className="p-fluid"
                footer={empleadoDialogFooter}
                onHide={hideDialog}
            >
                <div className="grid">
                    <div className="col-12 md:col-6">
                        <div className="field">
                            <label htmlFor="nombres">Nombres*</label>
                            <InputText
                                id="nombres"
                                value={empleado.nombres || ''}
                                onChange={(e) => onInputChange(e, 'nombres')}
                                required
                                autoFocus
                                className={submitted && !empleado.nombres ? 'p-invalid' : ''}
                            />
                            {submitted && !empleado.nombres && <small className="p-error">Nombres son requeridos.</small>}
                        </div>
                    </div>
                    <div className="col-12 md:col-6">
                        <div className="field">
                            <label htmlFor="apellidos">Apellidos*</label>
                            <InputText
                                id="apellidos"
                                value={empleado.apellidos || ''}
                                onChange={(e) => onInputChange(e, 'apellidos')}
                                required
                                className={submitted && !empleado.apellidos ? 'p-invalid' : ''}
                            />
                            {submitted && !empleado.apellidos && <small className="p-error">Apellidos son requeridos.</small>}
                        </div>
                    </div>
                    <div className="col-12 md:col-6">
                        <div className="field">
                            <label htmlFor="cedula">Cédula*</label>
                            <InputText
                                id="cedula"
                                value={empleado.cedula || ''}
                                onChange={(e) => onInputChange(e, 'cedula')}
                                required
                                className={submitted && !empleado.cedula ? 'p-invalid' : ''}
                            />
                            {submitted && !empleado.cedula && <small className="p-error">Cédula es requerida.</small>}
                        </div>
                    </div>
                    <div className="col-12 md:col-6">
                        <div className="field">
                            <label htmlFor="edad">Edad</label>
                            <InputText
                                id="edad"
                                type="number"
                                value={empleado.edad || ''}
                                disabled
                            />
                        </div>
                    </div>
                    <div className="col-12 md:col-6">
                        <div className="field">
                            <label htmlFor="correo">Correo</label>
                            <InputText
                                id="correo"
                                value={empleado.correo || ''}
                                onChange={(e) => onInputChange(e, 'correo')}
                            />
                        </div>
                    </div>
                    <div className="col-12 md:col-6">
                        <div className="field">
                            <label htmlFor="telefono">Teléfono</label>
                            <InputText
                                id="telefono"
                                value={empleado.telefono || ''}
                                onChange={(e) => onInputChange(e, 'telefono')}
                            />
                        </div>
                    </div>
                    <div className="col-12">
                        <div className="field">
                            <label htmlFor="direccion">Dirección</label>
                            <InputText
                                id="direccion"
                                value={empleado.direccion || ''}
                                onChange={(e) => onInputChange(e, 'direccion')}
                            />
                        </div>
                    </div>
                    <div className="col-12 md:col-6">
                        <div className="field">
                            <label htmlFor="fecha_nacimiento">Fecha Nacimiento</label>
                            <InputText
                                id="fecha_nacimiento"
                                type="date"
                                value={empleado.fecha_nacimiento || ''}
                                onChange={(e) => onInputChange(e, 'fecha_nacimiento')}
                            />
                        </div>
                    </div>
                    <div className="col-12 md:col-6">
                        <div className="field">
                            <label htmlFor="fecha_ingreso">Fecha Ingreso</label>
                            <InputText
                                id="fecha_ingreso"
                                type="date"
                                value={empleado.fecha_ingreso || ''}
                                onChange={(e) => onInputChange(e, 'fecha_ingreso')}
                            />
                        </div>
                    </div>
                    <div className="col-12 md:col-6">
                        <div className="field">
                            <label htmlFor="id_area">Área</label>
                            <Dropdown
                                id="id_area"
                                value={empleado.id_area}
                                options={areas}
                                onChange={(e) => onInputChange(e, 'id_area')}
                                placeholder="Seleccionar área"
                            />
                        </div>
                    </div>
                    <div className="col-12 md:col-6">
                        <div className="field">
                            <label htmlFor="cargo">Cargo</label>
                            <Dropdown
                                id="cargo"
                                value={empleado.cargo}
                                options={cargos}
                                onChange={(e) => onInputChange(e, 'cargo')}
                                placeholder="Seleccionar cargo"
                            />
                        </div>
                    </div>
                    <div className="col-12 md:col-6">
                        <div className="field">
                            <label htmlFor="sueldo">Sueldo</label>
                            <InputText
                                id="sueldo"
                                type="number"
                                value={empleado.sueldo || ''}
                                onChange={(e) => onInputChange(e, 'sueldo')}
                            />
                        </div>
                    </div>
                    <div className="col-12 md:col-6">
                        <div className="field">
                            <label htmlFor="estado">Estado</label>
                            <Dropdown
                                id="estado"
                                value={empleado.estado || 'Activo'}
                                options={estados}
                                onChange={(e) => onInputChange(e, 'estado')}
                                placeholder="Seleccionar estado"
                            />
                        </div>
                    </div>
                    {empleado.id_empleado && (
                        <div className="col-12 md:col-6">
                            <div className="field">
                                <label htmlFor="pin">PIN</label>
                                <InputText
                                    id="pin"
                                    value={empleado.pin || ''}
                                    disabled
                                />
                                <small className="text-muted">El PIN se genera automáticamente al crear el empleado</small>
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>

            <Dialog
                visible={importDialog}
                style={{ width: '600px', maxWidth: '95vw' }}
                header="Importar empleados desde Excel"
                modal
                onHide={hideImportDialog}
                className="import-dialog"
            >
                <div className="p-fluid">
                    <div className="mb-3">
                        <FileUpload
                            ref={fileUploadRef}
                            mode="basic"
                            accept=".xlsx,.xls"
                            maxFileSize={5000000}
                            chooseLabel="Seleccionar archivo"
                            disabled={importLoading}
                            auto={false}
                            customUpload={true}
                            uploadHandler={cargarExcel}
                            className="mr-2"
                        />
                        {excelFileName && (
                            <div className="mt-2 px-3 py-2 border-1 surface-border border-round flex align-items-center">
                                <i className="pi pi-file-excel mr-2 text-green-600" />
                                <span className="font-bold">{excelFileName}</span>
                                {excelData && (
                                    <span className="ml-2 text-green-600">
                                        ({excelData.length} registros)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    {previewData.length > 0 && (
                        <>
                            <div className="mb-2">
                                <DataTable
                                    value={previewData}
                                    scrollable
                                    scrollHeight="200px"
                                    className="p-datatable-sm"
                                >
                                    {renderPreviewColumns()}
                                </DataTable>
                                <small className="text-muted">
                                    Vista previa: {excelData.length} registros encontrados.
                                </small>
                            </div>
                            <Button
                                label="Importar"
                                icon="pi pi-upload"
                                severity="success"
                                onClick={importarDatos}
                                disabled={!excelData || importLoading}
                                loading={importLoading}
                                className="mb-2"
                            />
                        </>
                    )}
                    {!excelFileName && (
                        <small className="p-error">Seleccione un archivo Excel.</small>
                    )}
                    {importLoading && (
                        <div className="mt-3">
                            <i className="pi pi-spin pi-spinner mr-2"></i>
                            <span>Importando empleados...</span>
                        </div>
                    )}
                </div>
            </Dialog>
        </div>
    );
};

export default EmpleadosManagement;
