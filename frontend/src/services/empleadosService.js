import api from './token';

export const getEmpleadosPorArea = async (areaId) => {
  const res = await api.get(`/empleados/area/${areaId}`);
  return res.data;
};

export const getAllEmpleados = async () => {
  try {
    const response = await api.get('/empleados');
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('No tienes permisos para acceder a todos los empleados');
    }
    if (error.response?.status === 404) {
      throw new Error('Endpoint de empleados no encontrado');
    }
    throw error;
  }
};

export const AREAS = {
  CALIDAD: 1,
  BODEGA: 2,
  PRODUCCION: 3, 
  ADMINISTRACION: 4,
  MANTENIMIENTO: 5
};
export const createEmpleado = async (empleadoData) => {
  try {
    if (!empleadoData.id_area || !empleadoData.id_cargo) {
      throw new Error('Área y cargo son requeridos');
    }
    const response = await api.post('/empleados', empleadoData);
    return response.data;
  } catch (error) {
    // Mostrar mensaje de error del backend si existe
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.response?.status === 403) {
      throw new Error(error.response?.data?.message || 'No tienes permisos para crear empleados');
    }
    if (error.config?.url && error.config.url.includes('null')) {
      throw new Error('Error en la petición: URL inválida');
    }
    throw error;
  }
};
export const updateEmpleado = async (id, empleadoData) => {
  try {
    if (!id) {
      throw new Error('ID de empleado es requerido');
    }
    const response = await api.put(`/empleados/${id}`, empleadoData);
    return response.data;
  } catch (error) {
    // Mostrar mensaje de error del backend si existe
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.response?.status === 403) {
      throw new Error('No tienes permisos para editar empleados');
    }
    if (error.response?.status === 404) {
      throw new Error('Empleado no encontrado');
    }
    if (error.config?.url && error.config.url.includes('null')) {
      throw new Error('Error en la petición: URL inválida');
    }
    throw error;
  }
};

export const deleteEmpleado = async (id) => {
  try {
    const response = await api.delete(`/empleados/${id}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('No tienes permisos para eliminar empleados');
    }
    if (error.response?.status === 404) {
      throw new Error('Empleado no encontrado');
    }
    throw error;
  }
};
   


// Map area names to area IDs for import functionality
export const areaNameToId = (areaName) => {
  const areasMap = {
    'CALIDAD': 1,
    'BODEGA': 2,
    'PRODUCCION': 3,
    'ADMINISTRACION': 4,
    'MANTENIMIENTO': 5
  };
  return areasMap[areaName?.toUpperCase()] || 3; // Default to PRODUCCION (3) if not found, as most employees seem to be in PRODUCCION
};

// Map cargo names to cargo IDs for import functionality
export const cargoNameToId = (cargoName) => {
  const cargosMap = {
    'ASISTENTE DE PRODUCCION': 1,
    'AUXILIAR DE BODEGA': 2,
    'ELECTROMECANICO': 3,
    'GERENTE DE CALIDAD': 4,
    'GERENTE DE OPERACIONES': 5,
    'GERENTE DE PRODUCCION': 6,
    'JEFE DE BODEGA': 7,
    'JEFE DE PRODUCCION': 8,
    'JEFE DE VENTAS': 9,
    'OPERADOR DE PRODUCCION': 10,
    'OPERATIVO DE BODEGA': 11,
    'SUPERVISOR DE CALIDAD': 12,
    'SUPERVISOR DE PRODUCCION': 13
  };
  return cargosMap[cargoName?.toUpperCase()] || 10; // Default to OPERADOR DE PRODUCCION (10) if not found
};

// Function to validate and preprocess imported employee data
export const processImportedEmpleados = async (data) => {
  // Process and validate the data before sending to the backend
  const processedData = data.map((row, index) => {
    try {
      // Extract name parts - assuming the NOMBRE field contains full name
      const fullName = row.NOMBRE || '';
      
      // Get first and last names
      let nombres = '';
      let apellidos = '';
      
      // Check if there's structure in the name (e.g., "AYALA HERRERA LILIANA DANIELA")
      const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
      if (nameParts.length >= 3) {
        // Asumir que los primeros 2 son apellidos, el resto nombres
        apellidos = nameParts.slice(0, 2).join(' ');
        nombres = nameParts.slice(2).join(' ');
      } else if (nameParts.length === 2) {
        apellidos = nameParts[0];
        nombres = nameParts[1];
      } else {
        nombres = fullName;
      }

      // Get area and cargo IDs
      const id_area = areaNameToId(row.AREA);
      const id_cargo = cargoNameToId(row.CARGO);

      // Format dates correctly
      const formatDate = (dateStr) => {
        if (!dateStr) return null;
        
        // Si es un número de Excel (fecha serial)
        if (typeof dateStr === 'number') {
          // Excel guarda las fechas como números seriales desde 1900-01-01
          const date = new Date((dateStr - 25569) * 86400 * 1000);
          return date.toISOString().split('T')[0];
        }
        
        // Si es string
        if (typeof dateStr === 'string') {
          const formats = [
            // DD/MM/YYYY
            {
              regex: /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/,
              formatter: (match) => `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
            },
            // YYYY/MM/DD
            {
              regex: /^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/,
              formatter: (match) => `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
            }
          ];
          
          for (const format of formats) {
            const match = dateStr.match(format.regex);
            if (match) {
              return format.formatter(match);
            }
          }
        }
        
        // Si es objeto Date
        if (dateStr instanceof Date) {
          return dateStr.toISOString().split('T')[0];
        }
        
        return null;
      };

      // Valores por defecto
      const defaultCorreo = "example@correo.com";
      const defaultDireccion = "defecto-Itulcachi";
      const defaultFechaNacimiento = "12/12/2000";
      const defaultCelular = "99999999";

      // Handle date fields according to Excel column names
      const fecha_nacimiento = formatDate(row['FECHA DE NACIMIEN'] || row['FECHA DE NACIMIENTO'] || defaultFechaNacimiento);
      const fecha_ingreso = formatDate(row['INGRESO']);

      // Calculate age based on fecha_nacimiento
      const calcularEdad = (fechaNac) => {
        if (!fechaNac) return null;
        const hoy = new Date();
        const nacimiento = new Date(fechaNac);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const m = hoy.getMonth() - nacimiento.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
          edad--;
        }
        return edad;
      };

      // Parse sueldo as decimal
      const sueldo = parseFloat(row.SUELDO) || 0;

      const processedEmpleado = {
        cedula: String(row.CEDULA || '').trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        id_cargo,
        id_area,
        correo: String(row.CORREO || defaultCorreo).trim(),
        direccion: String(row.DIRECCION || defaultDireccion).trim(),
        fecha_nacimiento,
        edad: fecha_nacimiento ? calcularEdad(fecha_nacimiento) : null,
        telefono: String(row.CELULAR || defaultCelular).trim(),
        estado: 'Activo',
        fecha_ingreso,
        sueldo
      };

      return processedEmpleado;
    } catch (error) {
      return null; // Skip this row on error
    }
  }).filter(Boolean); // Remove nulls from the array (rows that caused errors)
  
  // Now, send the processed data to the backend in batches
  try {
    const results = [];
    
    for (let i = 0; i < processedData.length; i++) {
      const empleado = processedData[i];
      
      try {
        const response = await createEmpleado(empleado);
        results.push({ success: true, empleado: response });
      } catch (error) {
        results.push({ 
          success: false, 
          empleado: { cedula: empleado.cedula, nombres: empleado.nombres },
          message: error.message || 'Error al importar empleado'
        });
      }
    }

    return { 
      totalProcessed: processedData.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results
    };
  } catch (error) {
    throw new Error(`Error procesando datos: ${error.message}`);
  }
};

// Enhanced batch import function using individual create endpoint
export const batchImportEmpleados = async (data) => {
  try {
    const processedData = await processImportedEmpleados(data);

    // Create all employees one by one
    const results = [];


    for (let i = 0; i < processedData.length; i++) {
      const empleado = processedData[i];

      // Log progreso cada 10 empleados
      if (i % 10 === 0) {
        // console.log(`Procesando empleado ${i + 1} de ${totalEmpleados}`);
      }

      try {
        // Validar campos requeridos
        if (!empleado.cedula || !empleado.nombres) {
          throw new Error('Cédula y nombres son requeridos');
        }

        const result = await createEmpleado(empleado);
        results.push({
          success: true,
          empleado: result,
          message: `Empleado ${empleado.nombres} ${empleado.apellidos} importado correctamente`
        });
      } catch (error) {
        results.push({
          success: false,
          empleado: {
            cedula: empleado.cedula,
            nombres: empleado.nombres,
            apellidos: empleado.apellidos
          },
          message: error.message || 'Error al importar empleado'
        });
      }
    }

    const finalResult = {
      totalProcessed: processedData.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results
    };

    return finalResult;
  } catch (error) {
    throw new Error(`Error procesando datos: ${error.message}`);
  }
};
       