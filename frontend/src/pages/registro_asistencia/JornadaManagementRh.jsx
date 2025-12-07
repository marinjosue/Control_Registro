import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { getJornadas } from '../../services/jornadaService';
import RecursosHumanosMenu from './components/RecursosHumanosMenu';
import JornadaManagement from '../shared/components/JornadaManagement';
import styles from '../shared/styles/AreaLayout.module.css';

const JornadaManagementRh = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = React.useRef(null);
    const [jornadas, setJornadas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [jornadaDialog, setJornadaDialog] = useState(false);

    useEffect(() => {
        if (!user) return;
        if (user.rol !== 'RH') {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const jornadasData = await getJornadas();
                setJornadas(jornadasData);
            } catch (err) {
                console.error('Error al cargar datos:', err);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar datos'
                });
            } finally {
                setLoading(false);
            }
        };

        if (user?.rol === 'RH') {
            fetchData();
        }
    }, [user]);

    const handleJornadasUpdate = (newJornadas) => {
        setJornadas(newJornadas);
    };

    // Add a function to create a new jornada that resets any editing state
    const createNewJornada = () => {
        // This will ensure we're not in editing mode
        setJornadaDialog(true);
    };

    if (!user || user.rol !== 'RH') {
        return null;
    }

    return (
        <div className={styles.areaContainer}>
            <Toast ref={toast} />
            <RecursosHumanosMenu />
            <main className={styles.mainContent}>
                <h2 className={styles.pageTitle}>
                    Gestión de Jornadas
                </h2>
                <div style={{ marginBottom: '1rem' }}>
                    <Button
                        label="Nueva Jornada"
                        icon="pi pi-plus"
                        onClick={createNewJornada}
                        className="p-button-success"
                    />
                </div>
                <JornadaManagement
                    jornadas={jornadas}
                    loading={loading}
                    onJornadasUpdate={handleJornadasUpdate}
                    toast={toast}
                    editable={true}
                    externalJornadaDialog={jornadaDialog}
                    setExternalJornadaDialog={setJornadaDialog}
                />
            </main>
        </div>
    );
};

export default JornadaManagementRh;