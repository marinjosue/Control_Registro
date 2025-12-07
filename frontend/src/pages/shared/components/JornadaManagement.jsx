import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { confirmDialog } from 'primereact/confirmdialog';
import { getJornadas, createJornada, updateJornada, deleteJornada } from '../../../services/jornadaService';

const JornadaManagement = ({ 
    jornadas, 
    loading, 
    onJornadasUpdate, 
    toast, 
    editable = false,
    externalJornadaDialog,
    setExternalJornadaDialog
}) => {
    const [jornadaDialog, setJornadaDialog] = useState(false);
    const [editingJornada, setEditingJornada] = useState(null);
    const [jornadaForm, setJornadaForm] = useState({
        nombre_jornada: '',
        hora_inicio: '',
        hora_fin: '',
        tipo_turno: 'Matutino',
        descripcion: ''
    });
    
    // Use external dialog state if provided
    const isDialogVisible = externalJornadaDialog !== undefined ? externalJornadaDialog : jornadaDialog;
    const closeDialog = () => {
        if (setExternalJornadaDialog) {
            setExternalJornadaDialog(false);
        } else {
            setJornadaDialog(false);
        }
    };

    // Listen for changes in externalJornadaDialog
    useEffect(() => {
        if (externalJornadaDialog === true && !editingJornada) {
            // Only reset form when opening for a new jornada (not when editing)
            setJornadaForm({
                nombre_jornada: '',
                hora_inicio: '',
                hora_fin: '',
                tipo_turno: 'Matutino', 
                descripcion: ''
            });
        }
    }, [externalJornadaDialog, editingJornada]);

    const handleSaveJornada = async () => {
        try {
            // Validar valores permitidos para tipo_turno
            const allowedTurnos = ['Matutino', 'Vespertino'];
            if (
                !jornadaForm.nombre_jornada ||
                !jornadaForm.hora_inicio ||
                !jornadaForm.hora_fin ||
                !jornadaForm.tipo_turno ||
                !allowedTurnos.includes(jornadaForm.tipo_turno)
            ) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Campos incompletos o inválidos',
                    detail: 'Por favor complete todos los campos obligatorios y seleccione un tipo de jornada válido'
                });
                return;
            }

            // Create a properly formatted data object for the API
            const jornadaData = {
                nombre_jornada: jornadaForm.nombre_jornada,
                hora_inicio: jornadaForm.hora_inicio,
                hora_fin: jornadaForm.hora_fin,
                tipo_turno: jornadaForm.tipo_turno,
                descripcion: jornadaForm.descripcion || ''
            };

            console.log('Saving jornada with data:', jornadaData);

            if (editingJornada) {
                const jornadaId = editingJornada.id_jornada || editingJornada.id;
                console.log(`Updating jornada with ID: ${jornadaId}`);
                await updateJornada(jornadaId, jornadaData);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Jornada actualizada correctamente'
                });
            } else {
                console.log('Creating new jornada');
                await createJornada(jornadaData);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Jornada creada correctamente'
                });
            }

            const jornadasData = await getJornadas();
            onJornadasUpdate(jornadasData);
            resetJornadaForm();
        } catch (error) {
            console.error('Error al guardar jornada:', error);
            console.error('Detalles del error:', error.response?.data || 'No hay detalles disponibles');
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: `Error al guardar jornada: ${error.response?.data?.message || error.message || 'Error desconocido'}`
            });
        }
    };

    const handleDeleteJornada = (jornada) => {
        confirmDialog({
            message: `¿Está seguro de eliminar la jornada "${jornada.nombre_jornada}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    console.log('Eliminando jornada con ID:', jornada.id_jornada || jornada.id);
                    await deleteJornada(jornada.id_jornada || jornada.id);
                    const jornadasData = await getJornadas();
                    onJornadasUpdate(jornadasData);
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Jornada eliminada correctamente'
                    });
                } catch (error) {
                    console.error('Error al eliminar jornada:', error);
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al eliminar jornada'
                    });
                }
            }
        });
    };

    const resetJornadaForm = () => {
        setJornadaForm({
            nombre_jornada: '',
            hora_inicio: '',
            hora_fin: '',
            tipo_turno: 'Matutino', // Set a default value
            descripcion: ''
        });
        setEditingJornada(null);
        closeDialog();
    };

    const editJornada = (jornada) => {
        // Make sure we make a clean copy of the jornada data to avoid reference issues
        setEditingJornada({...jornada});
        
        // Format times if needed to ensure they're in the correct format for time inputs (HH:MM)
        const formattedHoraInicio = jornada.hora_inicio ? jornada.hora_inicio.substring(0, 5) : '';
        const formattedHoraFin = jornada.hora_fin ? jornada.hora_fin.substring(0, 5) : '';

        // Populate the form with the jornada's data
        setJornadaForm({
            nombre_jornada: jornada.nombre_jornada || '',
            hora_inicio: formattedHoraInicio,
            hora_fin: formattedHoraFin,
            tipo_turno: jornada.tipo_turno || 'fija',
            descripcion: jornada.descripcion || ''
        });
        
        // Open the dialog
        if (setExternalJornadaDialog) {
            setExternalJornadaDialog(true);
        } else {
            setJornadaDialog(true);
        }
        
        console.log('Editing jornada:', jornada);
        console.log('Form set to:', {
            nombre_jornada: jornada.nombre_jornada || '',
            hora_inicio: formattedHoraInicio,
            hora_fin: formattedHoraFin,
            tipo_turno: jornada.tipo_turno || 'fija',
            descripcion: jornada.descripcion || ''
        });
    };

    const actionBodyTemplate = (rowData) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
                icon="pi pi-pencil"
                className="p-button-rounded p-button-text p-button-success"
                onClick={() => editJornada(rowData)}
                tooltip="Editar"
            />
            <Button
                icon="pi pi-trash"
                className="p-button-rounded p-button-text p-button-danger"
                onClick={() => handleDeleteJornada(rowData)}
                tooltip="Eliminar"
            />
        </div>
    );

    return (
        <>
            <DataTable 
                value={jornadas} 
                loading={loading} 
                paginator
                rows={10}
                emptyMessage="No hay jornadas registradas"
            >
                <Column field="nombre_jornada" header="Nombre" sortable />
                <Column field="tipo_turno" header="Tipo" sortable />
                <Column field="hora_inicio" header="Hora Inicio" sortable />
                <Column field="hora_fin" header="Hora Fin" sortable />
                {editable && (
                    <Column 
                        header="Acciones"
                        body={actionBodyTemplate}
                        style={{ width: '120px' }}
                    />
                )}
            </DataTable>

            {editable && (
                <Dialog
                    header={editingJornada ? "Editar Jornada" : "Nueva Jornada"}
                    visible={isDialogVisible}
                    onHide={resetJornadaForm}
                    style={{ width: '500px' }}
                    modal
                    onShow={() => {
                        console.log("Dialog shown, form data:", jornadaForm);
                        // Ensure tipo_turno has a default value if it's empty
                        if (!jornadaForm.tipo_turno) {
                            setJornadaForm(prev => ({...prev, tipo_turno: 'Matutino'}));
                        }
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label htmlFor="nombre_jornada">Nombre:</label>
                            <InputText
                                id="nombre_jornada"
                                value={jornadaForm.nombre_jornada}
                                onChange={(e) => setJornadaForm({...jornadaForm, nombre_jornada: e.target.value})}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label htmlFor='hora_inicio'>Hora Inicio:</label>
                                <InputText
                                    type="time"
                                    value={jornadaForm.hora_inicio}
                                    onChange={(e) => setJornadaForm({...jornadaForm, hora_inicio: e.target.value})}
                                    style={{ width: '100%', marginTop: '0.5rem' }}
                                    required
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label  htmlFor='hora_fin'>Hora Fin:</label>
                                <InputText
                                    type="time"
                                    value={jornadaForm.hora_fin}
                                    onChange={(e) => setJornadaForm({...jornadaForm, hora_fin: e.target.value})}
                                    style={{ width: '100%', marginTop: '0.5rem' }}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label  htmlFor='tipo_jornada'>Tipo de Jornada:</label>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <div>
                                    <RadioButton
                                        inputId="Matutino"
                                        name="tipo"
                                        value="Matutino"
                                        onChange={(e) => setJornadaForm({...jornadaForm, tipo_turno: e.value})}
                                        checked={jornadaForm.tipo_turno === 'Matutino'}
                                    />
                                    <label htmlFor="Matutino" style={{ marginLeft: '0.5rem' }}>Matutino</label>
                                </div>
                                <div>
                                    <RadioButton
                                        inputId="Vespertino"
                                        name="tipo"
                                        value="Vespertino"
                                        onChange={(e) => setJornadaForm({...jornadaForm, tipo_turno: e.value})}
                                        checked={jornadaForm.tipo_turno === 'Vespertino'}
                                    />
                                    <label htmlFor="Vespertino" style={{ marginLeft: '0.5rem' }}>Vespertino</label>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <Button
                                label="Cancelar"
                                onClick={resetJornadaForm}
                                className="p-button-text"
                            />
                            <Button
                                label="Guardar"
                                onClick={handleSaveJornada}
                                disabled={
                                    !jornadaForm.nombre_jornada ||
                                    !jornadaForm.hora_inicio ||
                                    !jornadaForm.hora_fin ||
                                    !jornadaForm.tipo_turno // Deshabilita si no hay tipo_turno
                                }
                            />
                        </div>
                    </div>
                </Dialog>
            )}
        </>
    );
};

export default JornadaManagement;
