import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { confirmDialog } from 'primereact/confirmdialog';
import { updateUserProfile } from '../../../services/usuarioService';
import styles from '../styles/PasswordChangeModal.module.css';

const PasswordChangeModal = ({ visible, onHide, user, onSuccess }) => {
    const [passwordActual, setPasswordActual] = useState('');
    const [passwordNueva, setPasswordNueva] = useState('');
    const [passwordConfirmar, setPasswordConfirmar] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (visible) {
            setPasswordActual('');
            setPasswordNueva('');
            setPasswordConfirmar('');
            setError('');
        }
    }, [visible]);

    const handlePasswordChange = async () => {
        setLoading(true);
        setError('');
        try {
            await updateUserProfile(user.id, {
                contrasena_actual: passwordActual,
                contrasena_nueva: passwordNueva
            });

            // Simular un pequeño delay para mostrar el loading
            await new Promise(resolve => setTimeout(resolve, 1000));

            onHide();
            onSuccess('Contraseña actualizada correctamente');

            // Activar estado de refreshing y recargar página
            setRefreshing(true);
            setTimeout(() => {
                window.location.reload();
            }, 1200);
        } catch (err) {
            console.error('Error al cambiar contraseña:', err);
            setError(err.response?.data?.mensaje || 'Error al cambiar contraseña');
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Validaciones
        if (passwordNueva !== passwordConfirmar) {
            setError('Las contraseñas no coinciden');
            return;
        }
        if (passwordNueva.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        confirmDialog({
            message: '¿Está seguro de cambiar su contraseña?',
            header: 'Confirmar cambio de contraseña',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-warning',
            accept: handlePasswordChange
        });
    };

    const handleClose = () => {
        if (!loading && !refreshing) {
            setPasswordActual('');
            setPasswordNueva('');
            setPasswordConfirmar('');
            setError('');
            onHide();
        }
    };

    const isProcessing = loading || refreshing;

    const getButtonLabel = () => {
        if (refreshing) return 'Actualizando página...';
        if (loading) return 'Cambiando...';
        return 'Cambiar';
    };

    return (
        <Dialog
            header="Cambiar Contraseña"
            visible={visible}
            onHide={handleClose}
            className={styles.passwordDialog}
            modal
            closable={!isProcessing}
        >
            <div className={styles.passwordForm}>
                <div className={styles.formGroup}>
                    <label htmlFor="passwordActual" className={styles.formLabel}>Contraseña actual</label>
                    <Password
                        id="passwordActual"
                        value={passwordActual}
                        onChange={(e) => setPasswordActual(e.target.value)}
                        className={styles.passwordInput}
                        feedback={false}
                        toggleMask
                        disabled={isProcessing}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="passwordNueva" className={styles.formLabel}>Nueva contraseña</label>
                    <Password
                        id="passwordNueva"
                        value={passwordNueva}
                        onChange={(e) => setPasswordNueva(e.target.value)}
                        className={styles.passwordInput}
                        toggleMask
                        disabled={isProcessing}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="passwordConfirmar" className={styles.formLabel}>Confirmar contraseña</label>
                    <Password
                        id="passwordConfirmar"
                        value={passwordConfirmar}
                        onChange={(e) => setPasswordConfirmar(e.target.value)}
                        className={styles.passwordInput}
                        feedback={false}
                        toggleMask
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
                        label={getButtonLabel()}
                        onClick={handleSave}
                        disabled={isProcessing || !passwordActual || !passwordNueva || !passwordConfirmar}
                        loading={isProcessing}
                    />

                </div>
            </div>
        </Dialog>
    );
};

PasswordChangeModal.propTypes = {
    visible: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired,
    onSuccess: PropTypes.func.isRequired
};

export default PasswordChangeModal;
