import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Badge } from 'primereact/badge';
import RecursosHumanosMenu from './components/RecursosHumanosMenu';
import { getAllEmpleados } from '../../services/empleadosService';
import { getAsistencias } from '../../services/asistenciasService';
import './styles/RecursosHumanosDashboard.css';
import './styles/TableStyles.css';

const RecursosHumanosDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [, setEmployeeData] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [employeeStats, setEmployeeStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        byArea: {},
        byCargo: {}
    });
    const [attendanceStats, setAttendanceStats] = useState({
        onTime: 0,
        late: 0,
        absent: 0
    });

    // Charts data
    const [overtimeChartData, setOvertimeChartData] = useState({});
    const [attendanceChartData, setAttendanceChartData] = useState({});
    const [areaChartData, setAreaChartData] = useState({});

    const chartOptions = {
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12,
                        weight: '500'
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                cornerRadius: 8,
                displayColors: true
            }
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
        }
    };

    useEffect(() => {
        if (user && user.rol !== 'RH') {
            navigate('/');
        } else {
            loadDashboardData();
        }
    }, [user, navigate]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Load employee data
            const employees = await getAllEmpleados();
            setEmployeeData(employees);

            // Get current month date range
            const today = new Date();
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            const formattedFirstDay = firstDayOfMonth.toISOString().split('T')[0];
            const formattedLastDay = lastDayOfMonth.toISOString().split('T')[0];

            // Load current month attendance data for overtime calculation
            const attendanceMonth = await getAsistencias({
                fecha_inicio: formattedFirstDay,
                fecha_fin: formattedLastDay
            });

            // Carga asistencias de los últimos 7 días para otras stats
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            const formattedSevenDaysAgo = sevenDaysAgo.toISOString().split('T')[0];
            const formattedToday = today.toISOString().split('T')[0];

            const recentAttendance = await getAsistencias({
                fecha_inicio: formattedSevenDaysAgo,
                fecha_fin: formattedToday
            });

            setAttendanceData(recentAttendance);

            // Procesa datos para gráficos y stats
            processEmployeeData(employees);
            processAttendanceData(recentAttendance);
            processOvertimeData(attendanceMonth);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const processAttendanceData = (attendance) => {
        if (!attendance || attendance.length === 0) {
            setAttendanceStats({ onTime: 0, late: 0, absent: 0 });
            setAttendanceChartData({
                labels: ['Sin datos'],
                datasets: [
                    {
                        data: [1],
                        backgroundColor: ['#E5E7EB'],
                        hoverBackgroundColor: ['#D1D5DB']
                    }
                ]
            });
            return;
        }

        // Mapeo flexible de estados con debugging
        const statusCount = attendance.reduce((acc, item) => {
            const status = item.estado ? item.estado.toLowerCase() : 'no registrado';

            if (status.includes('puntual')) {
                acc.onTime++;
            } else if (status.includes('tardanza') || status.includes('atraso')) {
                acc.late++;
            } else if (status.includes('ausente') || status.includes('falta')) {
                acc.absent++;
            }

            return acc;
        }, { onTime: 0, late: 0, absent: 0 });

        console.log('Estado de asistencias procesado:', statusCount);
        setAttendanceStats(statusCount);

        if (statusCount.onTime === 0 && statusCount.late === 0 && statusCount.absent === 0) {
            setAttendanceChartData({
                labels: ['Sin datos'],
                datasets: [
                    {
                        data: [1],
                        backgroundColor: ['#E5E7EB'],
                        hoverBackgroundColor: ['#D1D5DB']
                    }
                ]
            });
            return;
        }

        setAttendanceChartData({
            labels: ['Puntual', 'Tardanza', 'Ausente'],
            datasets: [
                {
                    data: [statusCount.onTime, statusCount.late, statusCount.absent],
                    backgroundColor: ['#22C55E', '#F59E0B', '#EF4444'],
                    hoverBackgroundColor: ['#16A34A', '#D97706', '#DC2626']
                }
            ]
        });
    };

    const processOvertimeData = (attendanceMonth) => {
        if (!attendanceMonth || attendanceMonth.length === 0) {
            setOvertimeChartData({
                labels: ['Sin datos'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#E5E7EB'],
                    hoverBackgroundColor: ['#D1D5DB']
                }]
            });
            return;
        }

        // Sumar horas extras por empleado usando los campos correctos
        const overtimeByEmployee = {};

        attendanceMonth.forEach(attendance => {
            if (attendance.Empleado) {
                const employeeName = `${attendance.Empleado.nombres} ${attendance.Empleado.apellidos}`;
                const horas25 = parseFloat(attendance.horas_25 || 0);
                const horas50 = parseFloat(attendance.horas_50 || 0);
                const horas100 = parseFloat(attendance.horas_100 || 0);
                const horasFeriado = parseFloat(attendance.horas_feriado || 0);

                const totalOvertime = horas25 + horas50 + horas100 + horasFeriado;

                if (totalOvertime > 0) {
                    overtimeByEmployee[employeeName] = (overtimeByEmployee[employeeName] || 0) + totalOvertime;
                }
            }
        });

        // Top 5 empleados con más horas extras
        const sortedOvertime = Object.entries(overtimeByEmployee)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        if (sortedOvertime.length === 0) {
            setOvertimeChartData({
                labels: ['Sin horas extras'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#E5E7EB'],
                    hoverBackgroundColor: ['#D1D5DB']
                }]
            });
            return;
        }

        // Usar nombres completos para las etiquetas
        const labels = sortedOvertime.map(([name]) => {
            const parts = name.split(' ');
            const nombre = parts[0] || '';
            const apellido = parts[parts.length - 1] || '';
            return `${nombre} ${apellido}`;
        });
        const data = sortedOvertime.map(([, hours]) => Math.round(hours * 10) / 10);

        setOvertimeChartData({
            labels,
            datasets: [{
                label: 'Horas Extras',
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                hoverBackgroundColor: ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED'],
                data
            }]
        });
    };
    const processEmployeeData = (employees) => {
        if (!employees || employees.length === 0) return;

        // Calculate statistics
        const active = employees.filter(emp => emp.estado === 'Activo').length;
        const inactive = employees.length - active;

        // Group by area
        const byArea = employees.reduce((acc, emp) => {
            const area = emp.area || 'No asignado';
            acc[area] = (acc[area] || 0) + 1;
            return acc;
        }, {});

        // Group by cargo
        const byCargo = employees.reduce((acc, emp) => {
            const cargo = emp.cargo || 'No asignado';
            acc[cargo] = (acc[cargo] || 0) + 1;
            return acc;
        }, {});

        setEmployeeStats({
            total: employees.length,
            active,
            inactive,
            byArea,
            byCargo
        });

        // Prepare area chart data - top 5 areas
        const areaLabels = Object.keys(byArea).slice(0, 5);
        const areaValues = areaLabels.map(area => byArea[area]);

        setAreaChartData({
            labels: areaLabels,
            datasets: [
                {
                    label: 'Empleados por Área',
                    backgroundColor: '#3B82F6',
                    data: areaValues
                }
            ]
        });
    };

    // Filter recent attendance (last 10 entries)
    const recentAttendance = attendanceData
        .slice() // copia para no mutar el original
        .sort((a, b) => new Date(b.fecha_entrada) - new Date(a.fecha_entrada))
        .slice(0, 10)
        .map(item => ({
            id: item.id_asistencia,
            empleado: item.Empleado ? `${item.Empleado.nombres} ${item.Empleado.apellidos}` : 'No registrado',
            fecha: item.fecha_entrada,
            hora_entrada: item.hora_entrada,
            hora_salida: item.hora_salida,
            horas_trabajadas: item.horas_trabajadas,
            estado: item.estado
        }));

    // Group employees by area for summary
    const employeesByArea = Object.entries(employeeStats.byArea).map(([area, count]) => ({
        area,
        count
    })).sort((a, b) => b.count - a.count);

    // Status template for attendance table
    const statusTemplate = (rowData) => {
        let severity = '';
        let label = rowData.estado || 'No registrado';

        switch (label.toLowerCase()) {
            case 'puntual':
                severity = 'success';
                break;
            case 'tardanza':
                severity = 'warning';
                break;
            case 'ausente':
                severity = 'danger';
                break;
            default:
                severity = 'info';
        }

        return <Badge value={label} severity={severity} />;
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Date template
    const dateTemplate = (rowData) => {
        return formatDate(rowData.fecha);
    };

    // Time template
    const timeTemplate = (rowData, field) => {
        if (!rowData[field]) return '-';
        return rowData[field].substring(0, 5); // Show only HH:MM
    };



    return (
        <div className="rh-dashboard-layout">
            <RecursosHumanosMenu />

            <div className="rh-dashboard-content">
                <div className="rh-dashboard-container">
                    <div className="rh-dashboard-header">
                        <h1>Dashboard Recursos Humanos</h1>
                        <p>Panel de administración de personal y asistencias</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="rh-stats-cards">
                        <Card className="stats-card">
                            <div className="stats-card-content">
                                <div className="stats-icon" style={{ backgroundColor: '#10B98120' }}>
                                    <i className="pi pi-users" style={{ color: '#10B981' }}></i>
                                </div>
                                <div className="stats-data">
                                    <h3>{employeeStats.total}</h3>
                                    <p>Total Empleados</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="stats-card">
                            <div className="stats-card-content">
                                <div className="stats-icon" style={{ backgroundColor: '#3B82F620' }}>
                                    <i className="pi pi-user-plus" style={{ color: '#3B82F6' }}></i>
                                </div>
                                <div className="stats-data">
                                    <h3>{employeeStats.active}</h3>
                                    <p>Empleados Activos</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="stats-card">
                            <div className="stats-card-content">
                                <div className="stats-icon" style={{ backgroundColor: '#22C55E20' }}>
                                    <i className="pi pi-check-circle" style={{ color: '#22C55E' }}></i>
                                </div>
                                <div className="stats-data">
                                    <h3>{attendanceStats.onTime}</h3>
                                    <p>Asistencias Puntuales</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="stats-card">
                            <div className="stats-card-content">
                                <div className="stats-icon" style={{ backgroundColor: '#F59E0B20' }}>
                                    <i className="pi pi-clock" style={{ color: '#F59E0B' }}></i>
                                </div>
                                <div className="stats-data">
                                    <h3>{attendanceStats.late}</h3>
                                    <p>Tardanzas</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Charts Section */}
                    <div className="rh-dashboard-charts">
                        <div className="chart-row-full">
                            <Card title="Top Horas Extras del Mes" className="chart-card overtime-chart">
                                <div className="chart-container-overtime" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                    <Chart
                                        type="bar"
                                        data={overtimeChartData}
                                        options={{
                                            ...chartOptions,
                                            indexAxis: 'y',
                                            scales: {
                                                x: {
                                                    beginAtZero: true,
                                                    title: {
                                                        display: true,
                                                        text: 'Horas Extras',
                                                        font: {
                                                            size: 14,
                                                            weight: 'bold'
                                                        }
                                                    },
                                                    grid: {
                                                        color: 'rgba(0, 0, 0, 0.1)'
                                                    }
                                                },
                                                y: {
                                                    grid: {
                                                        display: false
                                                    },
                                                    afterFit: function (scaleInstance) {
                                                        // Aumentar el ancho para el eje Y para mostrar nombres completos
                                                        scaleInstance.width = 200; // Aumentado de 150 a 200 píxeles
                                                    },
                                                    ticks: {
                                                        padding: 5,
                                                        font: {
                                                            size: 11
                                                        },
                                                        // Asegurar que se muestren todas las etiquetas
                                                        autoSkip: false,
                                                        maxRotation: 0,
                                                        minRotation: 0,
                                                        callback: function (value) {
                                                            // Obtener la etiqueta para este tick
                                                            const label = this.getLabelForValue(value);
                                                            if (!label) return '';

                                                            // Truncar los nombres muy largos con puntos suspensivos
                                                            if (label.length > 20) {
                                                                return label.substring(0, 18) + '...';
                                                            }
                                                            return label;
                                                        }
                                                    }
                                                }
                                            },
                                            elements: {
                                                bar: {
                                                    borderRadius: 6,
                                                    borderSkipped: false
                                                }
                                            },
                                            layout: {
                                                padding: {
                                                    left: 20, // Aumentado de 10 a 20
                                                    right: 10,
                                                    top: 5,
                                                    bottom: 10
                                                }
                                            },
                                            plugins: {
                                                ...chartOptions.plugins,
                                                tooltip: {
                                                    callbacks: {
                                                        title: (tooltipItems) => {
                                                            // Mostrar el nombre completo en el tooltip
                                                            return tooltipItems[0].label;
                                                        },
                                                        label: (context) => {
                                                            return `Horas Extras: ${context.raw}`;
                                                        }
                                                    }
                                                }
                                            },
                                            // Asegurar que se muestren todas las barras
                                            barPercentage: 0.8,
                                            categoryPercentage: 0.8
                                        }}
                                    />
                                </div>
                            </Card>
                        </div>

                        <div className="chart-row-half">
                            <Card title="Asistencia Últimos 7 días" className="chart-card attendance-chart">
                                <div className="chart-container">
                                    <Chart
                                        type="doughnut"
                                        data={attendanceChartData}
                                        options={{
                                            ...chartOptions,
                                            cutout: '60%',
                                            elements: {
                                                arc: {
                                                    borderWidth: 2,
                                                    borderColor: '#fff'
                                                }
                                            },
                                            plugins: {
                                                ...chartOptions.plugins,
                                                legend: {
                                                    display: false
                                                }
                                            }
                                        }}
                                    />
                                    <div className="chart-legend-custom">
                                        <div className="legend-item">
                                            <span className="legend-color" style={{ backgroundColor: '#22C55E' }}></span>
                                            <span className="legend-label">Puntual ({attendanceStats.onTime})</span>
                                        </div>
                                        <div className="legend-item">
                                            <span className="legend-color" style={{ backgroundColor: '#F59E0B' }}></span>
                                            <span className="legend-label">Tardanza ({attendanceStats.late})</span>
                                        </div>
                                        <div className="legend-item">
                                            <span className="legend-color" style={{ backgroundColor: '#EF4444' }}></span>
                                            <span className="legend-label">Ausente ({attendanceStats.absent})</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Distribución por Área" className="table-card">
                                <div className="dashboard-table-container scrollable-table">
                                    <DataTable
                                        value={employeesByArea}
                                        responsiveLayout="scroll"
                                        stripedRows
                                        loading={loading}
                                        emptyMessage="No hay datos de empleados"
                                        paginator
                                        rows={5}
                                        className="dashboard-table"
                                        scrollable
                                    >
                                        <Column
                                            field="area"
                                            header="Área"
                                            sortable
                                            className="col-area"
                                        />
                                        <Column
                                            field="count"
                                            header="Empleados"
                                            sortable
                                            className="col-count"
                                        />
                                    </DataTable>
                                </div>
                            </Card>
                        </div>
                    </div>
                    {/* Tables Section */}
                    <div className="rh-dashboard-tables">
                        <Card title="Últimas Asistencias" className="table-card">
                            <div className="dashboard-table-container scrollable-table">
                                <DataTable
                                    value={recentAttendance}
                                    responsiveLayout="scroll"
                                    stripedRows
                                    loading={loading}
                                    emptyMessage="No hay datos de asistencia recientes"
                                    paginator
                                    rows={5}
                                    className="dashboard-table"
                                    scrollable
                                >
                                    <Column
                                        field="empleado"
                                        header="Empleado"
                                        sortable
                                        className="col-empleado"
                                    />
                                    <Column
                                        field="fecha"
                                        header="Fecha"
                                        body={dateTemplate}
                                        sortable
                                        className="col-fecha"
                                    />
                                    <Column
                                        field="hora_entrada"
                                        header="Entrada"
                                        body={(rowData) => timeTemplate(rowData, 'hora_entrada')}
                                        className="col-hora"
                                    />
                                    <Column
                                        field="hora_salida"
                                        header="Salida"
                                        body={(rowData) => timeTemplate(rowData, 'hora_salida')}
                                        className="col-hora col-hora-salida"
                                    />
                                    <Column
                                        field="horas_trabajadas"
                                        header="Horas"
                                        className="col-horas-trabajadas"
                                    />
                                    <Column
                                        field="estado"
                                        header="Estado"
                                        body={statusTemplate}
                                        sortable
                                        className="col-estado"
                                    />
                                </DataTable>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecursosHumanosDashboard;
