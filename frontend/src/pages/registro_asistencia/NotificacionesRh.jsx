import React, { useState, useEffect, useRef } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { Chip } from 'primereact/chip';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import RecursosHumanosMenu from './components/RecursosHumanosMenu';
import './styles/notificacion.css';
import {
    obtenerTodasNotificaciones,
    marcarNotificacionLeida,
    eliminarNotificacion,
    obtenerResumenNotificaciones
} from '../../services/notificacionesService';
import notificacionesWS from '../../services/notificacionesWebSocket';

const NotificacionesRh = () => {
    const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState([]);
    const [notificacionesLeidas, setNotificacionesLeidas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedNotificacion, setSelectedNotificacion] = useState(null);
    const [showDetalle, setShowDetalle] = useState(false);
    const [conectadoWS, setConectadoWS] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const [filtroTexto, setFiltroTexto] = useState('');
    const [notificacionesNoLeidasFiltradas, setNotificacionesNoLeidasFiltradas] = useState([]);
    const [notificacionesLeidasFiltradas, setNotificacionesLeidasFiltradas] = useState([]);

    const toast = useRef(null);

    // Detectar cambios de pantalla
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // CARGAR DATOS AL MONTAR
    useEffect(() => {
        cargarNotificaciones();
    }, []);

    useEffect(() => {
        filtrarNotificaciones();
    }, [filtroTexto, notificacionesNoLeidas, notificacionesLeidas]);

    // WEBSOCKET CONFIGURADO
    useEffect(() => {
        notificacionesWS.connect();
        
        const checkConnection = () => {
            setConectadoWS(notificacionesWS.isSocketConnected());
        };
        
        checkConnection();
        const wsInterval = setInterval(checkConnection, 2000);
        
        notificacionesWS.onNuevaNotificacion((data) => {
            console.log('🔔 Nueva notificación WebSocket:', data);
            
            const notificacionFormateada = {
                id_notificacion: data.id_notificacion || Date.now(),
                tipo: data.tipo,
                titulo: data.titulo || `Notificación de ${data.tipo}`,
                mensaje: data.mensaje,
                fecha: data.fecha,
                hora: data.hora,
                leido: false,
                prioridad: data.prioridad || 'media',
                Empleado: data.empleado ? {
                    nombres: data.empleado.nombres,
                    apellidos: data.empleado.apellidos,
                    cedula: data.empleado.cedula,
                    Area: data.empleado.area ? { nombre: data.empleado.area } : null
                } : null,
                datos_adicionales: data.datos_adicionales || null
            };

            setNotificacionesNoLeidas(prev => [notificacionFormateada, ...prev]);
            
            const severityMap = {
                'tardanza': 'error',
                'dia_libre': 'warn', 
                'tiempo_excedido': 'info',
                'fuera_horario': 'warn'
            };

            toast.current?.show({
                severity: severityMap[data.tipo] || 'info',
                summary: '🔔 Nueva Notificación',
                detail: data.mensaje,
                life: 5000
            });
        });

        return () => {
            clearInterval(wsInterval);
            notificacionesWS.disconnect();
        };
    }, []);

    const cargarNotificaciones = async () => {
        try {
            setLoading(true);
            const response = await obtenerTodasNotificaciones(100);
            
            const notificaciones = response.notificaciones || response || [];
            console.log('📡 Todas las notificaciones cargadas:', notificaciones);
            
            const noLeidas = notificaciones.filter(n => !n.leido);
            const leidas = notificaciones.filter(n => n.leido);
            
            console.log('📊 No leídas:', noLeidas.length, 'Leídas:', leidas.length);
            
            setNotificacionesNoLeidas(noLeidas);
            setNotificacionesLeidas(leidas);
            
        } catch (error) {
            console.error('❌ Error cargando notificaciones:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al cargar notificaciones',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const filtrarNotificaciones = () => {
        if (!filtroTexto.trim()) {
            setNotificacionesNoLeidasFiltradas(notificacionesNoLeidas);
            setNotificacionesLeidasFiltradas(notificacionesLeidas);
            return;
        }

        const filtro = filtroTexto.toLowerCase();
        
        const noLeidasFiltradas = notificacionesNoLeidas.filter(notif => {
            const coincideTitulo = notif.titulo?.toLowerCase().includes(filtro);
            const coincideMensaje = notif.mensaje?.toLowerCase().includes(filtro);
            const coincideEmpleado = notif.Empleado ? 
                `${notif.Empleado.nombres} ${notif.Empleado.apellidos}`.toLowerCase().includes(filtro) ||
                notif.Empleado.cedula?.includes(filtro) : false;
            const coincideTipo = notif.tipo?.toLowerCase().includes(filtro);
            
            return coincideTitulo || coincideMensaje || coincideEmpleado || coincideTipo;
        });

        const leidasFiltradas = notificacionesLeidas.filter(notif => {
            const coincideTitulo = notif.titulo?.toLowerCase().includes(filtro);
            const coincideMensaje = notif.mensaje?.toLowerCase().includes(filtro);
            const coincideEmpleado = notif.Empleado ? 
                `${notif.Empleado.nombres} ${notif.Empleado.apellidos}`.toLowerCase().includes(filtro) ||
                notif.Empleado.cedula?.includes(filtro) : false;
            const coincideTipo = notif.tipo?.toLowerCase().includes(filtro);
            
            return coincideTitulo || coincideMensaje || coincideEmpleado || coincideTipo;
        });

        setNotificacionesNoLeidasFiltradas(noLeidasFiltradas);
        setNotificacionesLeidasFiltradas(leidasFiltradas);
    };

    const handleMarcarLeida = async (idNotificacion) => {
        try {
            console.log('📖 Marcando como leída:', idNotificacion);
            
            await marcarNotificacionLeida(idNotificacion);
            
            const notificacionIndex = notificacionesNoLeidas.findIndex(n => n.id_notificacion === idNotificacion);
            
            if (notificacionIndex !== -1) {
                const notificacion = notificacionesNoLeidas[notificacionIndex];
                
                const notificacionLeida = {
                    ...notificacion,
                    leido: true
                };
                
                setNotificacionesNoLeidas(prev => prev.filter((_, index) => index !== notificacionIndex));
                setNotificacionesLeidas(prev => [notificacionLeida, ...prev]);
                
                console.log('✅ Notificación movida a leídas correctamente');
            } else {
                console.warn('⚠️ Notificación no encontrada en no leídas');
            }
            
            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Notificación marcada como leída',
                life: 3000
            });

        } catch (error) {
            console.error('❌ Error marcando notificación:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al marcar notificación como leída',
                life: 3000
            });
        }
    };

    const handleEliminarNotificacion = (idNotificacion, tituloNotificacion) => {
        confirmDialog({
            message: `¿Está seguro de eliminar la notificación "${tituloNotificacion}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    console.log('🗑️ Eliminando notificación:', idNotificacion);
                    
                    await eliminarNotificacion(idNotificacion);
                    
                    // Eliminar de la lista de leídas
                    setNotificacionesLeidas(prev => prev.filter(n => n.id_notificacion !== idNotificacion));
                    
                    console.log('✅ Notificación eliminada correctamente');
                    
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Notificación eliminada correctamente',
                        life: 3000
                    });

                } catch (error) {
                    console.error('❌ Error eliminando notificación:', error);
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al eliminar notificación',
                        life: 3000
                    });
                }
            },
            reject: () => {
                console.log('❌ Eliminación cancelada');
            }
        });
    };

    const handleVerDetalle = (notificacion) => {
        setSelectedNotificacion(notificacion);
        setShowDetalle(true);
    };

    const getTipoInfo = (tipo) => {
        const tipos = {
            'tardanza': { icon: 'pi pi-clock', color: '#dc2626', label: 'Tardanza', severity: 'danger' },
            'dia_libre': { icon: 'pi pi-calendar', color: '#f59e0b', label: 'Día Libre', severity: 'warning' },
            'fuera_horario': { icon: 'pi pi-exclamation-triangle', color: '#ea580c', label: 'Fuera de Horario', severity: 'warning' },
            'tiempo_excedido': { icon: 'pi pi-stopwatch', color: '#0ea5e9', label: 'Tiempo Excedido', severity: 'info' }
        };
        return tipos[tipo] || { icon: 'pi pi-bell', color: '#6b7280', label: tipo, severity: 'secondary' };
    };

    const renderNotificacion = (notificacion, esLeida = false) => {
        const tipoInfo = getTipoInfo(notificacion.tipo);
        const fechaHora = `${notificacion.fecha} ${notificacion.hora?.substring(0, 5)}`;

        return (
            <Card 
                key={notificacion.id_notificacion}
                className={`notificacion-card ${!notificacion.leido ? 'notificacion-no-leida' : 'notificacion-leida'}`}
            >
                <div className="notificacion-content">
                    <div className="notificacion-header">
                        <div className="notificacion-tipos">
                            <i className={tipoInfo.icon} style={{ color: tipoInfo.color }}></i>
                            <Chip 
                                label={tipoInfo.label} 
                                className="notificacion-tipo-chip"
                                style={{ backgroundColor: tipoInfo.color + '20', color: tipoInfo.color }}
                            />
                            <Badge 
                                value={(notificacion.prioridad || 'MEDIA').toUpperCase()} 
                                severity={
                                    notificacion.prioridad === 'alta' ? 'danger' : 
                                    notificacion.prioridad === 'media' ? 'warning' : 'info'
                                }
                            />
                        </div>
                    </div>

                    <h5 className="notificacion-titulo">{notificacion.titulo}</h5>
                    <p className="notificacion-mensaje">{notificacion.mensaje}</p>

                    {notificacion.Empleado && (
                        <div className="notificacion-empleado-info">
                            <div className="empleado-info-content">
                                <div className="empleado-nombre">
                                    <i className="pi pi-user" style={{ marginRight: '0.5rem' }}></i>
                                    {notificacion.Empleado.nombres} {notificacion.Empleado.apellidos}
                                </div>
                                <div className="empleado-detalles">
                                    <span>Cédula: {notificacion.Empleado.cedula}</span>
                                    {notificacion.Empleado.Area && (
                                        <span>Área: {notificacion.Empleado.Area.nombre}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="notificacion-footer">
                        <small className="notificacion-fecha">{fechaHora}</small>
                        <div className="notificacion-buttons">
                            {!notificacion.leido && (
                                <Button
                                    icon="pi pi-check"
                                    label={isMobile ? "" : "Marcar leído"}
                                    size="small"
                                    severity="success"
                                    outlined
                                    onClick={() => handleMarcarLeida(notificacion.id_notificacion)}
                                    tooltip="Marcar como leído"
                                    tooltipOptions={{ position: 'top' }}
                                />
                            )}
                            
                            {/*  BOTÓN PARA ELIMINAR SOLO EN NOTIFICACIONES LEÍDAS */}
                            {esLeida && (
                                <Button
                                    icon="pi pi-trash"
                                    label={isMobile ? "" : "Eliminar"}
                                    size="small"
                                    severity="danger"
                                    outlined
                                    onClick={() => handleEliminarNotificacion(notificacion.id_notificacion, notificacion.titulo)}
                                    tooltip="Eliminar notificación"
                                    tooltipOptions={{ position: 'top' }}
                                />
                            )}
                            
                            <Button
                                icon="pi pi-eye"
                                label={isMobile ? "" : "Ver detalles"}
                                size="small"
                                severity="info"
                                outlined
                                onClick={() => handleVerDetalle(notificacion)}
                                tooltip="Ver detalles"
                                tooltipOptions={{ position: 'top' }}
                            />
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    const renderNotificaciones = (notificaciones, esNoLeidas = false) => {
        if (loading) {
            return (
                <div className="notificaciones-loading">
                    <ProgressSpinner size="50" />
                    <p>Cargando notificaciones...</p>
                </div>
            );
        }

        if (notificaciones.length === 0) {
            const mensaje = filtroTexto.trim() 
                ? `No hay notificaciones ${esNoLeidas ? 'no leídas' : 'leídas'} que coincidan con "${filtroTexto}"`
                : `No hay notificaciones ${esNoLeidas ? 'no leídas' : 'leídas'}`;
                
            return (
                <div className="notificaciones-empty">
                    <i className="pi pi-bell"></i>
                    <p>{mensaje}</p>
                </div>
            );
        }

        return (
            <div>
                {notificaciones.map(notif => renderNotificacion(notif, !esNoLeidas))}
            </div>
        );
    };

    const renderModal = () => {
        if (!selectedNotificacion) return null;

        let datosAdicionales = {};
        try {
            datosAdicionales = selectedNotificacion.datos_adicionales 
                ? (typeof selectedNotificacion.datos_adicionales === 'string' 
                    ? JSON.parse(selectedNotificacion.datos_adicionales) 
                    : selectedNotificacion.datos_adicionales)
                : {};
        } catch (error) {
            console.error('Error parseando datos adicionales:', error);
        }

        return (
            <Dialog
                header="Detalles de Notificación"
                visible={showDetalle}
                onHide={() => setShowDetalle(false)}
                modal
                className="notificacion-detalle-modal"
                dismissableMask
                closeOnEscape
                blockScroll
            >
                <div className="p-2">
                    <h4 className="text-900 mt-0 mb-3" style={{ fontSize: '1.1rem', lineHeight: '1.3' }}>
                        {selectedNotificacion.titulo}
                    </h4>
                    <p className="text-700 line-height-3 mb-3" style={{ fontSize: '0.9rem' }}>
                        {selectedNotificacion.mensaje}
                    </p>

                    {selectedNotificacion.Empleado && (
                        <>
                            <Divider />
                            <h6 className="text-900 font-semibold mb-2" style={{ fontSize: '1rem' }}>
                                Empleado:
                            </h6>
                            <div className="notificacion-empleado-info">
                                <div className="empleado-info-content">
                                    <div className="empleado-nombre">
                                        {selectedNotificacion.Empleado.nombres} {selectedNotificacion.Empleado.apellidos}
                                    </div>
                                    <div className="empleado-detalles">
                                        <span>Cédula: {selectedNotificacion.Empleado.cedula}</span>
                                        {selectedNotificacion.Empleado.Area && (
                                            <span>Área: {selectedNotificacion.Empleado.Area.nombre}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {Object.keys(datosAdicionales).length > 0 && (
                        <>
                            <Divider />
                            <h6 className="text-900 font-semibold mb-2" style={{ fontSize: '1rem' }}>
                                Detalles adicionales:
                            </h6>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {Object.entries(datosAdicionales).map(([key, value]) => (
                                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <strong className="text-900" style={{ fontSize: '0.9rem' }}>
                                            {key.replace('_', ' ')}:
                                        </strong>
                                        <span className="text-700" style={{ fontSize: '0.85rem' }}>
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    <Divider />
                    <div className="text-center">
                        <small className="text-500" style={{ fontSize: '0.8rem' }}>
                            {selectedNotificacion.fecha} a las {selectedNotificacion.hora?.substring(0, 5)}
                        </small>
                    </div>
                </div>
            </Dialog>
        );
    };

    return (
        <div className="notificaciones-management">
            <Toast ref={toast} />
            <ConfirmDialog />
            
            <div className="menu-lateral">
                <RecursosHumanosMenu />
            </div>
            
            <div className="rh-dashboard-content">
                <div className="rh-dashboard-header">
                    <h1>Notificaciones</h1>
                    <p>Gestión de alertas y notificaciones del sistema</p>
                </div>

                <div className="notificaciones-toolbar">
                    <h3>Bandeja de Notificaciones</h3>
                    <div className="notificaciones-toolbar-actions">
                        <Badge 
                            value={notificacionesNoLeidas.length} 
                            severity="warning" 
                            size="large"
                        />
                        <Tag 
                            severity={conectadoWS ? "success" : "danger"} 
                            value={conectadoWS ? "Online" : "Offline"} 
                        />
                        <Button
                            label={isMobile ? "" : "Actualizar"}
                            icon="pi pi-refresh"
                            onClick={cargarNotificaciones}
                            loading={loading}
                            className="p-button-primary"
                            tooltip="Actualizar notificaciones"
                            tooltipOptions={{ position: 'top' }}
                        />
                    </div>
                </div>

                {/*  NUEVO CAMPO DE BÚSQUEDA */}
                <div className="notificaciones-search">
                    <span className="p-input-icon-left" style={{ width: '100%' }}>
                        <i className="pi pi-search" />
                        <InputText 
                            value={filtroTexto}
                            onChange={(e) => setFiltroTexto(e.target.value)}
                            placeholder="Buscar por empleado, tipo, título o mensaje..."
                            style={{ width: '100%' }}
                        />
                    </span>
                    {filtroTexto && (
                        <Button
                            icon="pi pi-times"
                            className="p-button-text"
                            onClick={() => setFiltroTexto('')}
                            tooltip="Limpiar búsqueda"
                            style={{ marginLeft: '0.5rem' }}
                        />
                    )}
                </div>

                <Card>
                    <TabView className="notificaciones-tabs">
                        <TabPanel 
                            header={
                                <span className="flex align-items-center gap-2">
                                    <i className="pi pi-bell"></i>
                                    <span>No leídas</span>
                                    {notificacionesNoLeidasFiltradas.length > 0 && (
                                        <Badge 
                                            value={notificacionesNoLeidasFiltradas.length} 
                                            severity="warning" 
                                        />
                                    )}
                                </span>
                            }
                        >
                            {renderNotificaciones(notificacionesNoLeidasFiltradas, true)}
                        </TabPanel>
                        
                        <TabPanel 
                            header={
                                <span className="flex align-items-center gap-2">
                                    <i className="pi pi-check-circle"></i>
                                    <span>Leídas</span>
                                    {notificacionesLeidasFiltradas.length > 0 && (
                                        <Badge 
                                            value={notificacionesLeidasFiltradas.length} 
                                            severity="success" 
                                        />
                                    )}
                                </span>
                            }
                        >
                            {renderNotificaciones(notificacionesLeidasFiltradas, false)}
                        </TabPanel>
                    </TabView>
                </Card>

                {renderModal()}
            </div>
        </div>
    );
};

export default NotificacionesRh;