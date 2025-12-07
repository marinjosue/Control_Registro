import React, { useState, useEffect, useRef } from 'react';
import RecursosHumanosMenu from './components/RecursosHumanosMenu';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import HorariosRegistrados from '../shared/components/HorariosRegistrados';
import { getEmpleadosPorArea, AREAS } from '../../services/empleadosService';
import styles from '../shared/styles/HorariosRegistrados.module.css';
import style from '../shared/styles/AreaLayout.module.css';

const HorariosRegistradosRh = () => {
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [empleados, setEmpleados] = useState([]);

    useEffect(() => {
        const cargarEmpleados = async () => {
            try {
                setLoading(true);
                const data = await getEmpleadosPorArea(AREAS.PRODUCCION);
                setEmpleados(data);
            } catch (error) {
                toast.current.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: `Error al cargar empleados: ${error.message}`,
                    life: 3000
                });
            } finally {
                setLoading(false);
            }
        };

        cargarEmpleados();
    }, []);

    return (
        <div className={styles.pageLayout}>
            <Toast ref={toast} />
            <RecursosHumanosMenu />
            <main className={styles.contentArea}>
                <div className={styles.headerCard}>
                    <h2 className={styles.pageTitle}>
                        Horarios Registrados
                    </h2>
                    <p className={styles.pageSubtitle}>
                        Visualización y modificación de horarios registrados
                    </p>
                </div>
                <TabView className={style.tabView}>
                    <TabPanel header="Horarios Bodega">
                        <HorariosRegistrados
                            area={AREAS.BODEGA}
                            empleados={empleados}
                        />
                    </TabPanel>
                    <TabPanel header="Horarios Producción">
                        <HorariosRegistrados
                            area={AREAS.PRODUCCION}
                            empleados={empleados}
                        />
                    </TabPanel>
                    <TabPanel header="Horarios Mantenimiento">
                        <HorariosRegistrados
                            area={AREAS.MANTENIMIENTO}
                            empleados={empleados}
                        />
                    </TabPanel>
                    <TabPanel header="Horarios Calidad">
                        <HorariosRegistrados
                            area={AREAS.CALIDAD}
                            empleados={empleados}
                        />
                    </TabPanel>
                    <TabPanel header="Horarios Administrativo">
                        <HorariosRegistrados
                            area={AREAS.CALIDAD}
                            empleados={empleados}
                        />
                    </TabPanel>
                </TabView>

            </main>
        </div>
    );
};

export default HorariosRegistradosRh;