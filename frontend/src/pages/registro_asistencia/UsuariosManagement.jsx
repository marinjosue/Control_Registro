import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { registerUser, updateUser, deleteUser, getAllUsers } from '../../services/usuarioService';
import RecursosHumanosMenu from './components/RecursosHumanosMenu';
import PasswordChangeModal from '../shared/components/PasswordChangeModal';
import './styles/TableStyles.css';

const UsuariosManagement = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [usuarioDialog, setUsuarioDialog] = useState(false);
    const [usuario, setUsuario] = useState({});
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [selectedUsuarios, setSelectedUsuarios] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
    const toast = useRef(null);

    const roles = [
        { label: 'RH', value: 1 },
        { label: 'CALIDAD', value: 2 },
        { label: 'BODEGA', value: 3 },
        { label: 'PRODUCCION', value: 4 }
    ];

    useEffect(() => {
        loadUsuarios();
    }, []);

    const loadUsuarios = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers();
            setUsuarios(data);
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al cargar usuarios'
            });
        } finally {
            setLoading(false);
        }
    };

    const openNew = () => {
        setUsuario({});
        setPasswordConfirm('');
        setSubmitted(false);
        setIsEditMode(false);  // Explícitamente establecemos que NO está en modo edición
        setUsuarioDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setUsuarioDialog(false);
        setPasswordConfirm('');
    };

    const saveUsuario = async () => {
        setSubmitted(true);

        // Validación para nuevo usuario: debe tener contraseña y confirmarla
        if (!isEditMode && usuario.password !== passwordConfirm) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Las contraseñas no coinciden'
            });
            return;
        }

        if (usuario.nombre_usuario && usuario.correo && usuario.rol && (isEditMode || usuario.password)) {
            try {
                if (isEditMode && usuario.id_usuario) {
                    // Modo edición: PUT
                    const updateData = {};
                    if (usuario.nombre_usuario) updateData.nombre_usuario = usuario.nombre_usuario;
                    if (usuario.correo) updateData.correo = usuario.correo;
                    if (usuario.rol) updateData.id_rol = usuario.rol;

                    await updateUser(usuario.id_usuario, updateData);
                    toast.current.show({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Usuario actualizado'
                    });
                } else if (!isEditMode && !usuario.id_usuario) {
                    // Modo creación: POST
                    const userData = {
                        nombre_usuario: usuario.nombre_usuario,
                        correo: usuario.correo,
                        contrasena: usuario.password,
                        id_rol: usuario.rol
                    };

                    await registerUser(userData);
                    toast.current.show({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Usuario creado'
                    });
                }
                loadUsuarios();
                setUsuarioDialog(false);
                setUsuario({});
                setPasswordConfirm('');
            } catch (error) {
                toast.current.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.message || error.response?.data?.mensaje || 'Error al guardar usuario'
                });
            }
        } else {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Todos los campos son requeridos'
            });
        }
    };

    const editUsuario = (usuario) => {
        // Mapear el nombre del rol al valor ID correspondiente
        const rolMapeado = roles.find(r => r.label === usuario.rol);
        const usuarioEditado = {
            ...usuario,
            rol: rolMapeado ? rolMapeado.value : usuario.rol
        };
        
        setUsuario(usuarioEditado);
        setIsEditMode(true);
        setUsuarioDialog(true);
    };

    const handlePasswordChange = (user) => {
        // Asegurar que el usuario tenga el campo id_usuario
        const userWithId = {
            ...user,
            id: user.id_usuario || user.id
        };
        setSelectedUserForPassword(userWithId);
        setShowPasswordModal(true);
    };

    const handlePasswordChangeSuccess = (message) => {
        toast.current.show({
            severity: 'success',
            summary: 'Éxito',
            detail: message
        });
    };

    const confirmDeleteUsuario = (usuario) => {
        if (!usuario.id_usuario) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se puede eliminar: ID de usuario no encontrado'
            });
            return;
        }
        
        confirmDialog({
            message: `¿Está seguro de eliminar el usuario ${usuario.nombre_usuario}?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => deleteUsuarioConfirmed(usuario.id_usuario)
        });
    };

    const deleteUsuarioConfirmed = async (id) => {
        try {
            await deleteUser(id);
            loadUsuarios();
            toast.current.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Usuario eliminado'
            });
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.mensaje || 'Error al eliminar usuario'
            });
        }
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _usuario = { ...usuario };
        _usuario[name] = val;
        setUsuario(_usuario);
    };

    const leftToolbarTemplate = () => {
        return (
            <Button 
                label="Nuevo Usuario" 
                icon="pi pi-plus" 
                severity="success" 
                onClick={openNew} 
                className="w-full md:w-auto"
            />
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <span className="p-input-icon-left w-full md:w-auto">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    placeholder="Buscar..."
                    onInput={(e) => setGlobalFilter(e.target.value)}
                    className="w-full"
                />
            </span>
        );
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-pencil"
                    severity="info"
                    size="small"
                    onClick={() => editUsuario(rowData)}
                />
                <Button
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    onClick={() => confirmDeleteUsuario(rowData)}
                />
            </div>
        );
    };

    const header = (
        <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
            <h4 className="m-0">Gestión de Usuarios</h4>
        </div>
    );

    const usuarioDialogFooter = (
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
                onClick={saveUsuario} 
            />
        </div>
    );

    return (
        <div className="usuarios-management">
            <RecursosHumanosMenu />
            <Toast ref={toast} />
            <ConfirmDialog />
            
            <div className="rh-dashboard-content">
                <div className="card">
                    <Toolbar 
                        className="mb-4 responsive-toolbar" 
                        left={leftToolbarTemplate} 
                        right={rightToolbarTemplate}
                    />

                    <div className="responsive-table-container">
                        <DataTable
                            value={usuarios}
                            selection={selectedUsuarios}
                            onSelectionChange={(e) => setSelectedUsuarios(e.value)}
                            dataKey="id_usuario"
                            paginator
                            rows={10}
                            rowsPerPageOptions={[5, 10, 25]}
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios"
                            globalFilter={globalFilter}
                            header={header}
                            loading={loading}
                            responsiveLayout="stack"
                            className="responsive-datatable"
                            scrollable
                            scrollHeight="auto"
                        >
                            <Column selectionMode="multiple" exportable={false} style={{ width: '50px' }}></Column>
                            <Column field="nombre_usuario" header="Usuario" sortable style={{ width: '200px' }}></Column>
                            <Column field="correo" header="Email" sortable style={{ width: '250px' }}></Column>
                            <Column field="rol" header="Rol" sortable style={{ width: '150px' }}></Column>
                            <Column body={actionBodyTemplate} exportable={false} style={{ width: '120px' }}></Column>
                        </DataTable>
                    </div>
                </div>

                <Dialog
                    visible={usuarioDialog}
                    style={{ width: '450px' }}
                    header={isEditMode ? "Editar Usuario" : "Crear Nuevo Usuario"}
                    modal
                    className="p-fluid"
                    footer={usuarioDialogFooter}
                    onHide={hideDialog}
                >
                    <div className="field">
                        <label htmlFor="nombre_usuario">Usuario</label>
                        <InputText
                            id="nombre_usuario"
                            value={usuario.nombre_usuario || ''}
                            onChange={(e) => onInputChange(e, 'nombre_usuario')}
                            required
                            autoFocus
                            className={submitted && !usuario.nombre_usuario ? 'p-invalid' : ''}
                        />
                        {submitted && !usuario.nombre_usuario && <small className="p-error">Usuario es requerido.</small>}
                    </div>

                    <div className="field">
                        <label htmlFor="correo">Email</label>
                        <InputText
                            id="correo"
                            value={usuario.correo || ''}
                            onChange={(e) => onInputChange(e, 'correo')}
                            required
                            className={submitted && !usuario.correo ? 'p-invalid' : ''}
                        />
                        {submitted && !usuario.correo && <small className="p-error">Email es requerido.</small>}
                    </div>

                    {isEditMode ? (
                        <div className="field">
                            <Button
                                label="Modificar Contraseña"
                                icon="pi pi-key"
                                onClick={() => handlePasswordChange(usuario)}
                                className="p-button-secondary"
                            />
                        </div>
                    ) : (
                        <>
                            <div className="field">
                                <label htmlFor="password">Contraseña</label>
                                <Password
                                    id="password"
                                    value={usuario.password || ''}
                                    onChange={(e) => onInputChange(e, 'password')}
                                    required
                                    toggleMask
                                    className={submitted && !usuario.password ? 'p-invalid' : ''}
                                    feedback={true}
                                />
                                {submitted && !usuario.password && <small className="p-error">Contraseña es requerida.</small>}
                            </div>

                            <div className="field">
                                <label htmlFor="passwordConfirm">Confirmar Contraseña</label>
                                <Password
                                    id="passwordConfirm"
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    required
                                    toggleMask
                                    feedback={false}
                                    className={submitted && (!passwordConfirm || passwordConfirm !== usuario.password) ? 'p-invalid' : ''}
                                />
                                {submitted && !passwordConfirm && <small className="p-error">Confirmación de contraseña es requerida.</small>}
                                {submitted && passwordConfirm && passwordConfirm !== usuario.password && <small className="p-error">Las contraseñas no coinciden.</small>}
                            </div>
                        </>
                    )}

                    <div className="field">
                        <label htmlFor="rol">Rol</label>
                        <Dropdown
                            id="rol"
                            value={usuario.rol}
                            options={roles}
                            onChange={(e) => onInputChange(e, 'rol')}
                            placeholder="Seleccionar rol"
                        />
                    </div>
                </Dialog>

                <PasswordChangeModal
                    visible={showPasswordModal}
                    onHide={() => setShowPasswordModal(false)}
                    user={selectedUserForPassword}
                    onSuccess={handlePasswordChangeSuccess}
                />
            </div>
        </div>
    );
};

export default UsuariosManagement;
