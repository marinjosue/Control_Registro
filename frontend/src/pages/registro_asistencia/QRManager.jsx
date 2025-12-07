import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getEmpleadoQR, getMultipleEmpleadosQR } from '../../services/qrService';
import { getAllEmpleados } from '../../services/empleadosService';
import RecursosHumanosMenu from './components/RecursosHumanosMenu';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './styles/QRManager.css';

const QRManager = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.rol !== 'RH') {
            navigate('/');
        }
    }, [user, navigate]);

    const [empleados, setEmpleados] = useState([]);
    const [selectedEmpleado, setSelectedEmpleado] = useState('');
    const [selectedMultiple, setSelectedMultiple] = useState([]);
    const [currentQR, setCurrentQR] = useState(null);
    const [multipleQRs, setMultipleQRs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('individual');
    const [searchTerm, setSearchTerm] = useState('');
    const [availablePrinters, setAvailablePrinters] = useState([]);
    const [selectedPrinter, setSelectedPrinter] = useState('');

    //  Cargar empleadosAdd commentMore actions
    useEffect(() => {
        const fetchEmpleados = async () => {
            try {
                const data = await getAllEmpleados();
                setEmpleados(data);
            } catch (err) {
                setError('Error al cargar empleados');
                console.error(err);
            }
        };
        fetchEmpleados();
    }, []);

    // Filtrar empleados
    const filteredEmpleados = empleados.filter(empleado =>
        `${empleado.nombres} ${empleado.apellidos} ${empleado.cedula}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    // Generar QR individual
    const handleGenerateQR = async () => {
        if (!selectedEmpleado) {
            setError('Seleccione un empleado');
            return;
        }

        setLoading(true);
        setError('');
        setCurrentQR(null);

        try {
            const qrData = await getEmpleadoQR(selectedEmpleado);
            setCurrentQR(qrData);
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al generar QR');
        } finally {
            setLoading(false);
        }
    };

    // Generar QR múltiple
    const handleGenerateMultipleQR = async () => {
        if (selectedMultiple.length === 0) {
            setError('Seleccione al menos un empleado');
            return;
        }

        setLoading(true);
        setError('');
        setMultipleQRs([]);

        try {
            const qrData = await getMultipleEmpleadosQR(selectedMultiple);
            setMultipleQRs(qrData.resultados);
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al generar QRs múltiples');
        } finally {
            setLoading(false);
        }
    };

    // Descargar QR individual - con información incluida en la imagen
    const downloadQR = (qrCode, empleado) => {
        // Crear un canvas temporal para combinar la información del empleado con el QR
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Cargar la imagen QR primero para conocer sus dimensiones
        const img = new Image();
        img.onload = () => {
            // Configurar dimensiones del canvas (añadiendo espacio para el encabezado)
            const padding = 40;
            const headerHeight = 80;
            canvas.width = img.width + (padding * 2);
            canvas.height = img.height + headerHeight + (padding * 2);
            
            // Pintar fondo blanco
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Añadir el nombre y PIN del empleado en la parte superior
            ctx.fillStyle = '#1a56db'; // Azul corporativo
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                `${empleado.nombres} ${empleado.apellidos}`.toUpperCase(), 
                canvas.width / 2, 
                padding + 20
            );
            ctx.font = '14px Arial';
            ctx.fillText(`PIN: ${empleado.pin}`, canvas.width / 2, padding + 45);
            
            // Dibujar la imagen del QR
            ctx.drawImage(
                img, 
                padding, 
                headerHeight + padding, 
                img.width, 
                img.height
            );
            
            // Convertir el canvas a imagen y descargar
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `QR_${empleado.nombres}_${empleado.apellidos}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        
        img.src = qrCode;
    };

    // Descargar todos los QRs como archivo ZIP - con información incluida en las imágenes
    const downloadAllQRs = async () => {
        try {
            setLoading(true);
            const zip = new JSZip();
            const successfulResults = multipleQRs.filter(r => r.status === 'success');
            
            // Crear una carpeta en el zip
            const qrFolder = zip.folder("QR_Empleados");
            
            // Convertir cada QR con su información y añadirlo al ZIP
            const fetchPromises = successfulResults.map(async (result) => {
                return new Promise((resolve, reject) => {
                    try {
                        const empleado = result.empleado;
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        const img = new Image();
                        img.onload = async () => {
                            // Configurar dimensiones del canvas con espacio para encabezado
                            const padding = 40;
                            const headerHeight = 80;
                            canvas.width = img.width + (padding * 2);
                            canvas.height = img.height + headerHeight + (padding * 2);
                            
                            // Pintar fondo blanco
                            ctx.fillStyle = '#FFFFFF';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            
                            // Añadir el nombre y PIN del empleado en la parte superior
                            ctx.fillStyle = '#1a56db'; // Azul corporativo
                            ctx.font = 'bold 16px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText(
                                `${empleado.nombres} ${empleado.apellidos}`.toUpperCase(), 
                                canvas.width / 2, 
                                padding + 20
                            );
                            ctx.font = '14px Arial';
                            ctx.fillText(`PIN: ${empleado.pin}`, canvas.width / 2, padding + 45);
                            
                            // Dibujar la imagen del QR
                            ctx.drawImage(
                                img, 
                                padding, 
                                headerHeight + padding, 
                                img.width, 
                                img.height
                            );
                            
                            // Convertir el canvas a Blob
                            canvas.toBlob(async (blob) => {
                                // Nombre del archivo
                                const fileName = `QR_${empleado.nombres}_${empleado.apellidos}.png`;
                                
                                // Añadir al zip
                                qrFolder.file(fileName, blob);
                                resolve();
                            }, 'image/png');
                        };
                        
                        img.onerror = () => {
                            reject(new Error(`Error al cargar la imagen QR para ${empleado.nombres}`));
                        };
                        
                        img.src = result.qrCode;
                    } catch (error) {
                        console.error("Error procesando QR:", error);
                        reject(error);
                    }
                });
            });
            
            // Esperar a que todos los archivos se añadan al zip
            await Promise.all(fetchPromises);
            
            // Generar el archivo zip
            const content = await zip.generateAsync({ type: "blob" });
            
            // Guardar y descargar el archivo zip
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            saveAs(content, `QR_Empleados_${dateStr}.zip`);
            
            setError('');
        } catch (err) {
            setError('Error al crear el archivo ZIP: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Limpiar
    const handleClear = () => {
        setCurrentQR(null);
        setMultipleQRs([]);
        setSelectedEmpleado('');
        setSelectedMultiple([]);
        setError('');
        setSearchTerm('');
    };

    // Toggle múltiple
    const toggleMultiple = (empleadoId) => {
        if (selectedMultiple.includes(empleadoId)) {
            setSelectedMultiple(selectedMultiple.filter(id => id !== empleadoId));
        } else {
            setSelectedMultiple([...selectedMultiple, empleadoId]);
        }
    };

    // Toggle all employees for multiple selection
    const toggleSelectAll = () => {
        if (selectedMultiple.length === filteredEmpleados.length) {
            // If all are selected, deselect all
            setSelectedMultiple([]);
        } else {
            // Otherwise, select all filtered employees
            const allEmployeeIds = filteredEmpleados.map(emp => emp.id_empleado);
            setSelectedMultiple(allEmployeeIds);
        }
    };

    // Check if all filtered employees are selected
    const areAllSelected = filteredEmpleados.length > 0 && 
        selectedMultiple.length === filteredEmpleados.length;

    // Detectar impresoras disponibles
    const detectPrinters = async () => {
        if (!navigator.mediaDevices || !window.print) {
            setError('La funcionalidad de impresión no está disponible en este navegador');
            return;
        }

        try {
            // En navegadores modernos, las impresoras se detectan automáticamente
            // durante el diálogo de impresión
            setAvailablePrinters([
                { id: 'default', name: 'Impresora predeterminada' },
                { id: 'pdf', name: 'Guardar como PDF' }
            ]);
        } catch (error) {
            console.error('Error detecting printers:', error);
            setError('No se pudieron detectar las impresoras');
        }
    };

    // Cargar impresoras al montar el componente
    useEffect(() => {
        detectPrinters();
    }, []);

    // Función para crear contenido de impresión optimizado para tarjeta
    const createPrintableCard = (qrCode, empleado) => {
        return `
            <div class="qr-print-card">
                <div class="qr-print-content">
                    <div class="qr-print-header">
                        <h3>${empleado.nombres.toUpperCase()} ${empleado.apellidos.toUpperCase()}</h3>
                        <p class="qr-print-pin">PIN: ${empleado.pin}</p>
                    </div>
                    <div class="qr-print-qr-container">
                        <img src="${qrCode}" alt="QR Code" class="qr-print-qr-image">
                    </div>
                    <div class="qr-print-footer">
                        <button class="qr-print-download-btn">📥 Descargar</button>
                    </div>
                </div>
            </div>
        `;
    };

    // Imprimir QR individual
    const printIndividualQR = () => {
        if (!currentQR) {
            setError('No hay QR para imprimir');
            return;
        }

        const printContent = createPrintableCard(currentQR.qrCode, currentQR.empleado);
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Tarjeta QR - ${currentQR.empleado.nombres} ${currentQR.empleado.apellidos}</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 2cm;
                        }
                        
                        body {
                            margin: 0;
                            padding: 20px;
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            background: #f8f9fa;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            -webkit-print-color-adjust: exact;
                            color-adjust: exact;
                        }
                        
                        .qr-print-card {
                            width: 350px;
                            height: 450px;
                            background: white;
                            border-radius: 15px;
                            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                            border: 1px solid #e5e7eb;
                            overflow: hidden;
                            page-break-inside: avoid;
                        }
                        
                        .qr-print-content {
                            padding: 30px;
                            height: 100%;
                            display: flex;
                            flex-direction: column;
                            justify-content: space-between;
                            align-items: center;
                            text-align: center;
                        }
                        
                        .qr-print-header {
                            width: 100%;
                            margin-bottom: 20px;
                        }
                        
                        .qr-print-header h3 {
                            color: #1a56db;
                            margin: 0 0 15px 0;
                            font-size: 20px;
                            font-weight: 600;
                            line-height: 1.2;
                            letter-spacing: 0.5px;
                        }
                        
                        .qr-print-pin {
                            color: #047857;
                            font-size: 16px;
                            font-weight: 500;
                            margin: 0;
                        }
                        
                        .qr-print-qr-container {
                            flex: 1;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            padding: 20px 0;
                        }
                        
                        .qr-print-qr-image {
                            width: 200px;
                            height: 200px;
                            border: 2px solid #e5e7eb;
                            border-radius: 12px;
                            padding: 10px;
                            background: white;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        }
                        
                        .qr-print-footer {
                            width: 100%;
                            margin-top: 20px;
                        }
                        
                        .qr-print-download-btn {
                            background: #e5e7eb;
                            color: #4b5563;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            width: 100%;
                        }
                        
                        .qr-print-download-btn:hover {
                            background: #d1d5db;
                        }
                        
                        @media print {
                            body { 
                                background: white;
                                padding: 0;
                            }
                            .qr-print-card { 
                                box-shadow: none;
                                page-break-after: always;
                                width: 100%;
                                max-width: 350px;
                                margin: 0 auto;
                            }
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    // Imprimir QRs múltiples
    const printMultipleQRs = () => {
        const successfulResults = multipleQRs.filter(r => r.status === 'success');
        
        if (successfulResults.length === 0) {
            setError('No hay QRs exitosos para imprimir');
            return;
        }

        const printContent = successfulResults.map(result => 
            createPrintableCard(result.qrCode, result.empleado)
        ).join('');
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Tarjetas QR - Múltiples Empleados</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 1cm;
                        }
                        
                        body {
                            margin: 0;
                            padding: 20px;
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            background: #f8f9fa;
                            -webkit-print-color-adjust: exact;
                            color-adjust: exact;
                        }
                        
                        .qr-print-container {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            gap: 30px;
                            justify-items: center;
                        }
                        
                        .qr-print-card {
                            width: 350px;
                            height: 450px;
                            background: white;
                            border-radius: 15px;
                            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                            border: 1px solid #e5e7eb;
                            overflow: hidden;
                            page-break-inside: avoid;
                        }
                        
                        .qr-print-content {
                            padding: 30px;
                            height: 100%;
                            display: flex;
                            flex-direction: column;
                            justify-content: space-between;
                            align-items: center;
                            text-align: center;
                        }
                        
                        .qr-print-header {
                            width: 100%;
                            margin-bottom: 20px;
                        }
                        
                        .qr-print-header h3 {
                            color: #1a56db;
                            margin: 0 0 15px 0;
                            font-size: 18px;
                            font-weight: 600;
                            line-height: 1.2;
                            letter-spacing: 0.5px;
                        }
                        
                        .qr-print-pin {
                            color: #047857;
                            font-size: 14px;
                            font-weight: 500;
                            margin: 0;
                        }
                        
                        .qr-print-qr-container {
                            flex: 1;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            padding: 15px 0;
                        }
                        
                        .qr-print-qr-image {
                            width: 180px;
                            height: 180px;
                            border: 2px solid #e5e7eb;
                            border-radius: 12px;
                            padding: 8px;
                            background: white;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        }
                        
                        .qr-print-footer {
                            width: 100%;
                            margin-top: 15px;
                        }
                        
                        .qr-print-download-btn {
                            background: #e5e7eb;
                            color: #4b5563;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 8px;
                            font-size: 12px;
                            font-weight: 500;
                            cursor: pointer;
                            width: 100%;
                        }
                        
                        @media print {
                            body { 
                                background: white;
                                padding: 10px;
                            }
                            .qr-print-container {
                                gap: 20px;
                            }
                            .qr-print-card { 
                                box-shadow: none;
                                width: 320px;
                                height: 420px;
                            }
                            .qr-print-content {
                                padding: 25px;
                            }
                            .qr-print-qr-image {
                                width: 160px;
                                height: 160px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="qr-print-container">
                        ${printContent}
                    </div>
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    return (
        <div className="rh-dashboard-layout">
            <RecursosHumanosMenu />
            
            <div className="rh-dashboard-content">
                <div className="qr-header">
                    <h1>Gestión de Códigos QR</h1>
                    <p>Genere códigos QR únicos para empleados</p>
                </div>

                {/* Pestañas */}
                <div className="qr-tabs">
                    <button
                        className={`qr-tab ${activeTab === 'individual' ? 'active' : ''}`}
                        onClick={() => setActiveTab('individual')}
                    >
                        QR Individual
                    </button>
                    <button
                        className={`qr-tab ${activeTab === 'multiple' ? 'active' : ''}`}
                        onClick={() => setActiveTab('multiple')}
                    >
                        QR Múltiple
                    </button>
                </div>

                {/* Error */}
                {error && <div className="qr-error">{error}</div>}

                {/* Tab Individual */}
                {activeTab === 'individual' && (
                    <div className="qr-content">
                        <div className="qr-controls">
                            <div className="qr-search">
                                <input
                                    type="text"
                                    placeholder="Buscar empleado..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="qr-search-input"
                                />
                            </div>

                            <div className="qr-selector">
                                <select
                                    value={selectedEmpleado}
                                    onChange={(e) => setSelectedEmpleado(e.target.value)}
                                    className="qr-select"
                                >
                                    <option value="">Seleccionar empleado</option>
                                    {filteredEmpleados.map(empleado => (
                                        <option key={empleado.id_empleado} value={empleado.id_empleado}>
                                            {empleado.nombres} {empleado.apellidos} - {empleado.cedula}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="qr-actions">
                                <button
                                    onClick={handleGenerateQR}
                                    disabled={loading || !selectedEmpleado}
                                    className="qr-btn qr-btn-primary"
                                >
                                    {loading ? 'Generando...' : 'Generar QR'}
                                </button>
                                <button
                                    onClick={handleClear}
                                    className="qr-btn qr-btn-secondary"
                                >
                                    Limpiar
                                </button>
                            </div>
                        </div>

                        {/* Mostrar QR Individual */}
                        {currentQR && (
                            <div className="qr-display">
                                <div className="qr-card">
                                    <div className="qr-info">
                                        <h3>{currentQR.empleado.nombres} {currentQR.empleado.apellidos}</h3>
                                        <p><strong>PIN:</strong> {currentQR.empleado.pin}</p>
                                        <p><strong>ID:</strong> {currentQR.empleado.id_empleado}</p>
                                    </div>
                                    <div className="qr-image-container">
                                        <img src={currentQR.qrCode} alt="QR Code" className="qr-image" />
                                    </div>
                                    <div className="qr-card-actions">
                                        <button
                                            onClick={() => downloadQR(currentQR.qrCode, currentQR.empleado)}
                                            className="qr-btn qr-btn-download"
                                        >
                                            📥 Descargar QR
                                        </button>
                                        <button
                                            onClick={printIndividualQR}
                                            className="qr-btn qr-btn-print"
                                        >
                                            🖨️ Imprimir Tarjeta
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab Múltiple */}
                {activeTab === 'multiple' && (
                    <div className="qr-content">
                        <div className="qr-controls">
                            <div className="qr-search">
                                <input
                                    type="text"
                                    placeholder="Buscar empleados..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="qr-search-input"
                                />
                            </div>

                            <div className="qr-employee-list">
                                <div className="qr-list-header">
                                    <h3>Seleccionar Empleados ({selectedMultiple.length})</h3>
                                    <label className="qr-select-all">
                                        <input
                                            type="checkbox"
                                            checked={areAllSelected}
                                            onChange={toggleSelectAll}
                                        />
                                        <span>Seleccionar todos</span>
                                    </label>
                                </div>
                                <div className="qr-checkbox-list">
                                    {filteredEmpleados.map(empleado => (
                                        <label key={empleado.id_empleado} className="qr-checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={selectedMultiple.includes(empleado.id_empleado)}
                                                onChange={() => toggleMultiple(empleado.id_empleado)}
                                            />
                                            <span>{empleado.nombres} {empleado.apellidos} - {empleado.cedula}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="qr-actions">
                                <button
                                    onClick={handleGenerateMultipleQR}
                                    disabled={loading || selectedMultiple.length === 0}
                                    className="qr-btn qr-btn-primary"
                                >
                                    {loading ? 'Generando...' : `Generar QR (${selectedMultiple.length})`}
                                </button>
                                <button
                                    onClick={handleClear}
                                    className="qr-btn qr-btn-secondary"
                                >
                                    Limpiar Todo
                                </button>
                            </div>
                        </div>

                        {/* Mostrar QRs Múltiples */}
                        {multipleQRs.length > 0 && (
                            <div className="qr-multiple-display">
                                <div className="qr-multiple-header">
                                    <h3>QRs Generados</h3>
                                    <div className="qr-summary">
                                        <span className="qr-success">✅ Exitosos: {multipleQRs.filter(r => r.status === 'success').length}</span>
                                        <span className="qr-error-count">❌ Fallidos: {multipleQRs.filter(r => r.status === 'error').length}</span>
                                    </div>
                                    <div className="qr-multiple-actions">
                                        {multipleQRs.filter(r => r.status === 'success').length > 0 && (
                                            <>
                                                <button onClick={downloadAllQRs} className="qr-btn qr-btn-download">
                                                    📥 Descargar Todos
                                                </button>
                                                <button onClick={printMultipleQRs} className="qr-btn qr-btn-print">
                                                    🖨️ Imprimir Tarjetas
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="qr-grid">
                                    {multipleQRs.map((result) => (
                                        <div key={result.empleado.id_empleado} className={`qr-grid-item ${result.status === 'error' ? 'qr-grid-error' : ''}`}>
                                            {result.status === 'success' ? (
                                                <>
                                                    <div className="qr-grid-info">
                                                        <h4>{result.empleado.nombres} {result.empleado.apellidos}</h4>
                                                        <p>PIN: {result.empleado.pin}</p>
                                                    </div>
                                                    <div className="qr-grid-image">
                                                        <img src={result.qrCode} alt={`QR ${result.empleado.nombres}`} />
                                                    </div>
                                                    <button
                                                        onClick={() => downloadQR(result.qrCode, result.empleado)}
                                                        className="qr-btn qr-btn-small"
                                                    >
                                                        📥 Descargar
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="qr-grid-error-content">
                                                    <h4>{result.empleado.nombres} {result.empleado.apellidos}</h4>
                                                    <p className="qr-error-message">Error: {result.error}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRManager;