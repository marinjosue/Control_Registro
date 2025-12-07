import React from 'react';
import PropTypes from 'prop-types';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import styles from '../styles/AreaLayout.module.css';

const EmpleadoCard = ({ empleado, jornadas, selectedValue, onScheduleChange }) => {
    return (
        <Card className={styles.employeeCard}>
            <div className="flex flex-column gap-2">
                <div>
                    <h4 className="m-0 text-primary">
                        {empleado.apellidos} {empleado.nombres} 
                    </h4>
                    <p className="m-0 text-sm text-gray-600">
                        Cédula: {empleado.cedula}
                    </p>
                    {empleado.area_nombre && (
                        <p className="m-0 text-sm text-gray-500">
                            Área: {empleado.area_nombre}
                        </p>
                    )}
                </div>
                
                <Dropdown
                    value={selectedValue || ''}
                    onChange={(e) => onScheduleChange(empleado.id_empleado, e.value)}
                    options={[
                        { label: 'Seleccionar jornada...', value: '' },
                        ...jornadas.map(jornada => ({
                            label: `${jornada.nombre} (${jornada.hora_entrada} - ${jornada.hora_salida})`,
                            value: jornada.id_jornada
                        }))
                    ]}
                    placeholder="Seleccionar jornada"
                    className="w-full"
                />
            </div>
        </Card>
    );
};

EmpleadoCard.propTypes = {
    empleado: PropTypes.object.isRequired,
    jornadas: PropTypes.array.isRequired,
    selectedValue: PropTypes.any,
    onScheduleChange: PropTypes.func.isRequired
};

export default EmpleadoCard;
