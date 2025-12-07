import React, { useEffect, useCallback, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import styles from '../styles/PatternAssignment.module.css';

const PatternAssignment = ({ asignacionForm, setAsignacionForm, diasSemanaOptions, hideFechaInicio = false }) => {
    // Estado local para el manejo de patrón y prevenir actualizaciones infinitas
    const [patron, setPatron] = useState(null);
    
    // Generar patrón rotativo automático: 5 días trabajo, 2 días libres
    const generarPatronRotativo = useCallback((fechaInicio, semanas) => {
        if (!fechaInicio) return [];
        
        const fechas = [];
        // Crear una nueva fecha para evitar modificar la original
        let fechaActual = new Date(fechaInicio.getTime());
        const totalDias = semanas * 7;
        const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

        for (let dia = 0; dia < totalDias; dia++) {
            const diaNombre = diasNombres[fechaActual.getDay()];
            // Los primeros 5 días son de trabajo, los siguientes 2 son libres
            // Usamos módulo 7 para que el patrón se repita cada semana
            const esDiaLibre = dia % 7 >= 5;

            fechas.push({
                fecha: new Date(fechaActual.getTime()),
                es_dia_libre: esDiaLibre,
                dia_nombre: diaNombre
            });

            fechaActual.setDate(fechaActual.getDate() + 1);
        }

        return fechas;
    }, []);

    // Manejador de cambio de fecha
    const handleDateChange = (e) => {
        const newDate = e.value;
        
        // Actualizar la fecha en el formulario
        setAsignacionForm(prev => ({
            ...prev,
            fecha_inicio: newDate
        }));
        
        // Generar el patrón solo cuando cambia la fecha
        if (newDate) {
            const nuevoPatron = generarPatronRotativo(newDate, 1);
            setPatron(nuevoPatron);
            
            // Extraer días de trabajo y libres del patrón
            const diasTrabajo = nuevoPatron.filter(d => !d.es_dia_libre).map(d => d.dia_nombre);
            const diasLibres = nuevoPatron.filter(d => d.es_dia_libre).map(d => d.dia_nombre);
            
            // Actualizar días en el formulario sin desencadenar actualizaciones recursivas
            setAsignacionForm(prev => ({
                ...prev,
                dias_trabajo: diasTrabajo,
                dias_libres: diasLibres
            }));
        } else {
            setPatron(null);
        }
    };

    // Obtener vista previa del patrón
    const obtenerPreviewPatron = useCallback(() => {
        if (patron) {
            return patron.slice(0, 7); // Primera semana
        }
        return null;
    }, [patron]);

    // Inicializar el patrón si ya hay una fecha al cargar el componente
    useEffect(() => {
        if (asignacionForm.fecha_inicio && !patron) {
            const nuevoPatron = generarPatronRotativo(asignacionForm.fecha_inicio, 1);
            setPatron(nuevoPatron);
            
            // Solo actualizar los días si no están ya establecidos
            if (!asignacionForm.dias_trabajo?.length || !asignacionForm.dias_libres?.length) {
                const diasTrabajo = nuevoPatron.filter(d => !d.es_dia_libre).map(d => d.dia_nombre);
                const diasLibres = nuevoPatron.filter(d => d.es_dia_libre).map(d => d.dia_nombre);
                
                setAsignacionForm(prev => ({
                    ...prev,
                    dias_trabajo: diasTrabajo,
                    dias_libres: diasLibres
                }));
            }
        }
    }, []); // Solo ejecutar al montar el componente

    return (
        <div className={styles.patternContainer}>
            <h4>Configuración de Patrón Rotativo</h4>

            {!hideFechaInicio && (
                <div className={styles.formGroup}>
                    <label htmlFor='fecha_inicio_rotativo'>Fecha de Inicio:</label>
                    <Calendar
                        id="fecha_inicio_rotativo"
                        value={asignacionForm.fecha_inicio}
                        onChange={handleDateChange}
                        dateFormat="dd/mm/yy"
                        showIcon
                        hideOnDateTimeSelect
                        appendTo={document.body}
                        style={{ width: '100%', marginTop: '0.5rem' }}
                    />
                    <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                        A partir de esta fecha se contarán 5 días de trabajo seguidos por 2 días libres automáticamente
                    </small>
                </div>
            )}

            <div className={styles.formGroup}>
                <label htmlFor='semanas_rotacion'>Duración del Patrón:</label>
                <Dropdown
                    id="semanas_rotacion"
                    value={asignacionForm.semanas_rotacion}
                    options={[
                        { label: '1 semana (7 días)', value: 1 }
                    ]}
                    onChange={(e) => setAsignacionForm(prev => ({ ...prev, semanas_rotacion: e.value }))}
                    placeholder="¿Por cuánto tiempo aplicar este patrón?"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                />
                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                    Esto define por cuántos días se aplicará el patrón rotativo
                </small>
            </div>
            
            {asignacionForm.fecha_inicio && (
                <>
                    <div className={styles.formGroup}>
                        <label>Días de Trabajo (5 días):</label>
                        <div className={`${styles.diasTrabajoDisplay} ${styles.diasTrabajoDisplayValid}`}>
                            {asignacionForm.dias_trabajo && asignacionForm.dias_trabajo.length > 0
                                ? asignacionForm.dias_trabajo.join(', ')
                                : <span>Se asignarán automáticamente</span>
                            }
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Días Libres (2 días):</label>
                        <div className={`${styles.diasTrabajoDisplay} ${styles.diasTrabajoDisplayValid}`}>
                            {asignacionForm.dias_libres && asignacionForm.dias_libres.length > 0
                                ? asignacionForm.dias_libres.join(', ')
                                : <span>Se asignarán automáticamente</span>
                            }
                        </div>
                    </div>
                </>
            )}

            {/* Preview del patrón */}
            {patron && (
                <div className={styles.patternPreview}>
                    <strong>📅 Vista previa - Primera semana:</strong>
                    <div className={styles.previewGrid}>
                        {obtenerPreviewPatron()?.map((item) => (
                            <div
                                key={item.fecha.toISOString()}
                                className={`${styles.previewDay} ${
                                    item.es_dia_libre ? styles.previewDayFree : styles.previewDayWork
                                }`}
                            >
                                <div className={styles.previewDayText}>{item.dia_nombre.slice(0, 3)}</div>
                                <div className={styles.previewDayNumber}>{item.fecha.getDate()}</div>
                                <div className={styles.previewDayStatus}>
                                    {item.es_dia_libre ? 'LIBRE' : 'TRABAJO'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatternAssignment;