import React, { useRef } from 'react';
import RecursosHumanosMenu from './components/RecursosHumanosMenu';
import { Toast } from 'primereact/toast';
import HorariosRegistrados from '../shared/components/HorariosRegistrados';
import styles from '../shared/styles/HorariosRegistrados.module.css';

const HorariosRegistradosRh = () => {
    const toast = useRef(null);

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
                        Visualización y modificación de horarios registrados de todas las áreas
                    </p>
                </div>
                <HorariosRegistrados />
            </main>
        </div>
    );
};

export default HorariosRegistradosRh;