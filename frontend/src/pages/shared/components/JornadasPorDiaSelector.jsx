import React from 'react';
import PropTypes from 'prop-types';
import { Dropdown } from 'primereact/dropdown';
import styles from '../styles/JornadasPorDia.module.css';

const JornadasPorDiaSelector = ({ diasTrabajo, jornadas, jornadasPorDia, setJornadasPorDia, jornadaDefault }) => {
    return (
        <div className={styles.jornadasContainer}>
            <h4>🗓️ Jornadas Específicas por Día (Opcional)</h4>
            <p className={styles.description}>
                Puede asignar una jornada diferente para cada día de trabajo
            </p>

            <div className={styles.diasGrid}>
                {diasTrabajo?.map(dia => (
                    <div key={dia} className={styles.diaItem}>
                        <label htmlFor={`jornada-${dia}`}>{dia}:</label>
                        <Dropdown
                            id={`jornada-${dia}`}
                            value={jornadasPorDia[dia] || jornadaDefault}
                            options={jornadas}
                            onChange={(e) => {
                                setJornadasPorDia({ ...jornadasPorDia, [dia]: e.value });
                            }}
                            optionLabel="nombre_jornada"
                            optionValue="id_jornada"
                            placeholder="Jornada para este día"
                            className={styles.diaDropdown}
                            appendTo={document.body}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

JornadasPorDiaSelector.propTypes = {
    diasTrabajo: PropTypes.array,
    jornadas: PropTypes.array.isRequired,
    jornadasPorDia: PropTypes.object.isRequired,
    setJornadasPorDia: PropTypes.func.isRequired,
    jornadaDefault: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default JornadasPorDiaSelector;
