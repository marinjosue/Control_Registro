import React from 'react';
import { useNavigate } from 'react-router-dom';
import BaseMenu from '../../shared/components/BaseMenu';

const RecursosHumanosMenu = ({ children }) => {
    const navigate = useNavigate();

    const menuConfig = {
        appName: 'RECURSOS HUMANOS',
        appIcon: 'pi pi-id-card',
        footerText: 'Sistema RH',
        menuItems: [
            {
                label: 'Empleados',
                icon: 'pi pi-users',
                items: [
                    {
                        label: 'Gestión de Empleados',
                        icon: 'pi pi-users',
                        command: () => navigate('/rh/empleado-management')
                    },
                    {
                        label: 'QR Empleados',
                        icon: 'pi pi-qrcode',
                        command: () => navigate('/rh/qr-manager')
                    }
                ]
            },
            {
                label: 'Horarios y Jornadas',
                icon: 'pi pi-calendar',
                items: [
                    {
                        label: 'Gestión de Jornadas',
                        icon: 'pi pi-clock',
                        command: () => navigate('/rh/jornada-management')
                    },
                    {
                        label: 'Gestión de Horarios',
                        icon: 'pi pi-calendar-clock',
                        command: () => navigate('/rh/horarios-registrados')
                    }
                ]
            },
            {
                label: 'Asistencias',
                icon: 'pi pi-clock',
                command: () => navigate('/rh/asistencias')
            },
            {
                label: 'Reportes',
                icon: 'pi pi-chart-bar',
                command: () => navigate('/rh/reportes')
            },
            {
                label: 'Gestión de Usuarios',
                icon: 'pi pi-user-edit',
                command: () => navigate('/rh/user-management')
            },
             {
                label: 'Notificaciones',
                icon: 'pi pi-bell',
                command: () => navigate('/rh/notificaciones')
            },

        ]
    };

    return <BaseMenu menuConfig={menuConfig}>{children}</BaseMenu>;
};

export default RecursosHumanosMenu;
