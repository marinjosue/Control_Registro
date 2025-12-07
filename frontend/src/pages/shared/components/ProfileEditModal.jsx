import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { confirmDialog } from 'primereact/confirmdialog';
import { updateUserProfile } from '../../../services/usuarioService';
import styles from '../styles/ProfileEditModal.module.css';

const ProfileEditModal = ({ visible, onHide, user, onSuccess }) => {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [correo, setCorreo] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (visible && user) {
            setNombreUsuario(user.nombre_usuario || '');
            setCorreo(user.correo || '');
            setError('');
        }
    }, [visible, user]);

    const handleSave = async () => {
        confirmDialog({
            message: '¿Está seguro de guardar los cambios en su perfil?',
            header: 'Confirmar edición de perfil',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-success',
            accept: () => {
                (async () => {
                    setLoading(true);
                    setError('');
                    try {
                        await updateUserProfile(user.id, { nombre_usuario: nombreUsuario, correo });
                        const updatedUser = { ...user, nombre_usuario: nombreUsuario, correo };
                        localStorage.setItem('user', JSON.stringify(updatedUser));

                        // Simular un pequeño delay para mostrar el loading
                        await new Promise(resolve => setTimeout(resolve, 2000));

                        onHide();
                        onSuccess('Perfil actualizado correctamente');

                        // Activar estado de refreshing y recargar página
                        setRefreshing(true);
                        setTimeout(() => {
                            window.location.reload();
                        }, 500);
                    } catch (err) {
                        console.error('Error al actualizar perfil:', err);
                        setError('Error al actualizar perfil');
                        setLoading(false);
                    }
                    // No se ejecuta finally aquí para mantener loading durante refresh
                })();
            }
        });
    };

    const handleClose = () => {
        if (!loading && !refreshing) {
            setNombreUsuario(user?.nombre_usuario || '');
            setCorreo(user?.correo || '');
            setError('');
            onHide();
        }
    };

    const isProcessing = loading || refreshing;

    let saveButtonLabel = 'Guardar';
    if (refreshing) {
        saveButtonLabel = 'Actualizando página...';
    } else if (loading) {
        saveButtonLabel = 'Guardando...';
    }

    // Extracted label for Button
    const buttonLabel = saveButtonLabel;

    return (
        <Dialog
            header="Editar Perfil"
            visible={visible}
            onHide={handleClose}
            className={styles.profileDialog}
            modal
            closable={!isProcessing}
        >
            <div className={styles.profileForm}>
                <div className={styles.formGroup}>
                    <label htmlFor="nombreUsuario" className={styles.formLabel}>Nombre de usuario</label>
                    <InputText
                        id="nombreUsuario"
                        value={nombreUsuario}
                        onChange={(e) => setNombreUsuario(e.target.value)}
                        className={styles.formInput}
                        required
                        disabled={isProcessing}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="correo" className={styles.formLabel}>Correo electrónico</label>
                    <InputText
                        id="correo"
                        type="email"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        className={styles.formInput}
                        required
                        disabled={isProcessing}
                    />
                </div>
                {error && <div className={styles.errorMessage}>{error}</div>}
                <div className={styles.formActions}>
                    <Button
                        label="Cancelar"
                        onClick={handleClose}
                        className="p-button-text"
                        disabled={isProcessing}
                    />
                    <Button
                        label={buttonLabel}
                        onClick={handleSave}
                        disabled={isProcessing || !nombreUsuario || !correo}
                        loading={isProcessing}
                    />

                </div>
            </div>
        </Dialog>
    );
};

ProfileEditModal.propTypes = {
    visible: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired,
    onSuccess: PropTypes.func.isRequired
};

export default ProfileEditModal;
