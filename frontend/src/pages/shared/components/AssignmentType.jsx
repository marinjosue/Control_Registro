import React from 'react';
import { RadioButton } from 'primereact/radiobutton';
import 'primeicons/primeicons.css';
import styles from '../styles/AssignmentStyles.module.css';

const AssignmentType = ({ 
    asignacionForm, 
    setAsignacionForm, 
    showAllTypes = false,
    namePrefix = "tipoAsignacion" 
}) => {
    const tiposAsignacion = [
        {
            id: 'patron_rotativo',
            value: 'PATRON_ROTATIVO',
            label: 'Horario Rotativo',
            description: '(5 días trabajo, 2 días libres - horarios rotativos)',
            icon: 'pi pi-calendar-clock'
        }
    ];
    return (
        <div className={styles.assignmentTypeContainer}>
            <label htmlFor='tipo_asignacion'>Tipo de Asignación:</label>
            <div className={styles.assignmentTypeOptions}>
                {tiposAsignacion.map((tipo) => (
                    <div key={tipo.id} className={styles.assignmentTypeOption}>
                        <RadioButton
                            inputId={`${tipo.id}_${namePrefix}`}
                            name={namePrefix}
                            value={tipo.value}
                            onChange={(e) => setAsignacionForm({ 
                                ...asignacionForm, 
                                tipo_asignacion: e.value 
                            })}
                            checked={asignacionForm.tipo_asignacion === tipo.value}
                        />
                        <label htmlFor={`${tipo.id}_${namePrefix}`} className={styles.assignmentTypeLabel}>
                            <span className={styles.assignmentTypeIcon}>
                                <i className={tipo.icon}></i>
                            </span>
                            <div className={styles.assignmentTypeText}>
                                <strong>{tipo.label}</strong>
                                {tipo.description && (
                                    <small className={styles.assignmentTypeDescription}>
                                        {tipo.description}
                                    </small>
                                )}
                            </div>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AssignmentType;
