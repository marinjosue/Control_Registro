import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const DebugInfo = ({ data = [], title = 'Debug Information' }) => {
    const [visible, setVisible] = useState(false);

    // Extraer información de empleados para debugging
    const empleadosInfo = data.map(item => ({
        id: item.id_asistencia,
        nombre: item.Empleado?.nombres + ' ' + item.Empleado?.apellidos,
        area: item.Empleado?.Area?.nombre || 'No definida',
        cargo: item.Empleado?.Cargo?.cargo || 'No definido',
        esAdmin: (item.Empleado?.Cargo?.cargo?.toUpperCase().includes('ADMINISTRATIVO') || 
                 item.Empleado?.Area?.nombre?.toUpperCase() === 'ADMINISTRACION') ? 'SÍ' : 'NO'
    }));

    return (
        <>
            <Button 
                icon="pi pi-info-circle" 
                className="p-button-rounded p-button-text p-button-sm" 
                onClick={() => setVisible(true)}
                tooltip="Mostrar información de debugging"
            />
            
            <Dialog 
                header={title} 
                visible={visible} 
                onHide={() => setVisible(false)}
                style={{ width: '80vw' }}
                maximizable
            >
                <DataTable value={empleadosInfo} paginator rows={10} responsiveLayout="scroll">
                    <Column field="id" header="ID" />
                    <Column field="nombre" header="Empleado" />
                    <Column field="area" header="Área" />
                    <Column field="cargo" header="Cargo" />
                    <Column field="esAdmin" header="¿Es Admin?" />
                </DataTable>
            </Dialog>
        </>
    );
};

export default DebugInfo;
