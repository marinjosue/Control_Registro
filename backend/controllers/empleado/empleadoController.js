const { Empleado, Area, Cargo } = require('../../models');
const {
    validarCedula,
    validarNombreOApellido,
    validarCorreo,
    validarSueldo
} = require('./validacionEmpleado');

// Generar PIN único de 4 dígitos
function generatePin() {
    return Math.floor(1000 + Math.random() * 9000); 
}

// Verificar si el PIN ya existe en la base de datos
async function isPinUnique(pin) {
    const empleado = await Empleado.findOne({ where: { pin } });
    return !empleado; // Retorna true si el PIN es único, false si ya existe
}

// Crear empleado
const crearEmpleado = async (req, res) => {
    const { nombres, apellidos, correo, id_area, id_cargo, sueldo, telefono, cedula, edad, fecha_ingreso, fecha_nacimiento, direccion, estado } = req.body;

    // Validaciones
    if (!validarCedula(cedula)) {
        return res.status(400).json({ error: 'La cédula ingresada no es válida para Ecuador. Debe contener solo números, tener 10 dígitos y pasar la validación oficial.' });
    }
    if (!validarNombreOApellido(nombres)) {
        return res.status(400).json({ error: 'El nombre no es válido. No debe contener números ni caracteres especiales.' });
    }
    if (!validarNombreOApellido(apellidos)) {
        return res.status(400).json({ error: 'El apellido no es válido. No debe contener números ni caracteres especiales.' });
    }

    if (!validarCorreo(correo)) {
        return res.status(400).json({ error: 'El correo electrónico no es válido. Debe tener el formato correcto y no iniciar con un número.' });
    }

    if (!validarSueldo(sueldo)) {
        return res.status(400).json({ error: 'El sueldo no es válido. Debe ser un número.' });
    }

    try {
        let pin = generatePin();
        while (!(await isPinUnique(pin))) {
            pin = generatePin();
        }

        const nuevoEmpleado = await Empleado.create({
            nombres,
            apellidos,
            correo,
            telefono,
            cedula,
            edad,
            sueldo,
            id_area,
            id_cargo,
            fecha_ingreso,
            fecha_nacimiento,
            direccion,
            estado,
            pin,
        });
        res.status(201).json({ mensaje: 'Empleado creado con éxito', nuevoEmpleado });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear empleado', detalles: error.message });
    }
};

// Editar empleado
const editarEmpleado = async (req, res) => {
    const { id } = req.params;
    const {
        nombres,
        apellidos,
        correo,
        id_area,
        id_cargo,
        sueldo,
        telefono,
        cedula,
        edad,
        fecha_ingreso,
        fecha_nacimiento,
        direccion,
        estado
    } = req.body;

    // Validaciones (solo si los campos existen en el body)
    if (cedula && !validarCedula(cedula)) {
        return res.status(400).json({ error: 'Cédula inválida. Debe contener solo números y tener 10 dígitos.' });
    }
    if (nombres && !validarNombreOApellido(nombres)) {
        return res.status(400).json({ error: 'Nombres inválidos. No debe contener números.' });
    }
    if (apellidos && !validarNombreOApellido(apellidos)) {
        return res.status(400).json({ error: 'Apellidos inválidos. No debe contener números.' });
    }
    if (correo && !validarCorreo(correo)) {
        return res.status(400).json({ error: 'Correo inválido. No debe contener números al inicio y debe ser un correo válido.' });
    }

    if (sueldo && !validarSueldo(sueldo)) {
        return res.status(400).json({ error: 'Sueldo inválido. Debe ser un número.' });
    }

    try {
        const empleado = await Empleado.findByPk(id);
        if (!empleado) {
            return res.status(404).json({ mensaje: 'Empleado no encontrado' });
        }

        // Actualiza todos los campos excepto el pin
        empleado.nombres = nombres ?? empleado.nombres;
        empleado.apellidos = apellidos ?? empleado.apellidos;
        empleado.correo = correo ?? empleado.correo;
        empleado.telefono = telefono ?? empleado.telefono;
        empleado.cedula = cedula ?? empleado.cedula;
        empleado.edad = edad ?? empleado.edad;
        empleado.id_area = id_area ?? empleado.id_area;
        empleado.id_cargo = id_cargo ?? empleado.id_cargo;
        empleado.sueldo = sueldo ?? empleado.sueldo;
        empleado.fecha_ingreso = fecha_ingreso ?? empleado.fecha_ingreso;
        empleado.fecha_nacimiento = fecha_nacimiento ?? empleado.fecha_nacimiento;
        empleado.direccion = direccion ?? empleado.direccion;
        empleado.estado = estado ?? empleado.estado;

        await empleado.save();
        res.json({ mensaje: 'Empleado actualizado con éxito', empleado });
    } catch (error) {
        res.status(500).json({ error: 'Error al editar empleado', detalles: error.message });
    }
};
// Eliminar empleado
const eliminarEmpleado = async (req, res) => {
    const { id } = req.params;

    try {
        const empleado = await Empleado.findByPk(id);
        if (!empleado) {
            return res.status(404).json({ mensaje: 'Empleado no encontrado' });
        }

        await empleado.destroy();
        res.json({ mensaje: 'Empleado eliminado con éxito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar empleado', detalles: error.message });
    }
};

// Obtener empleados
const obtenerEmpleados = async (_req, res) => {
    try {
        const empleados = await Empleado.findAll({
            include: [
                {
                    model: Area,
                    attributes: ['nombre']
                },
                {
                    model: Cargo,
                    attributes: ['cargo']
                }
            ]
        });

        // Formatear la respuesta para mostrar solo los nombres de área y cargo y eliminar objetos anidados
        const empleadosFormateados = empleados.map(e => {
            const empleado = e.toJSON();
            return {
                ...empleado,
                area: empleado.Area ? empleado.Area.nombre : null,
                cargo: empleado.Cargo ? empleado.Cargo.cargo : null,
                Area: undefined,   // Elimina Area
                Cargo: undefined,  // Elimina Cargo
                id_cargo:undefined,
                id_area:undefined
            };
        }).map(e => {
            // Elimina las claves Area y Cargo del objeto
            const { Area, Cargo, ...rest } = e;
            return rest;
        });

        res.json(empleadosFormateados);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener empleados', detalles: error.message });
    }
};

// obtener empleados por área
const obtenerEmpleadosPorArea = async (req, res) => {
    const { area_id } = req.params;

    try {
        const empleados = await Empleado.findAll({
            where: { id_area: area_id },
            include: [
                {
                    model: Cargo,
                    attributes: ['cargo']
                }
            ]
        });

        if (empleados.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontraron empleados en esta área' });
        }

        // Formatear para mostrar el nombre del cargo en vez de id_cargo
        const empleadosFormateados = empleados.map(e => {
            const empleado = e.toJSON();
            return {
                ...empleado,
                cargo: empleado.Cargo ? empleado.Cargo.cargo : null,
                id_cargo: undefined,
                Cargo: undefined
                
            };
        }).map(e => {
            // Elimina la clave Cargo del objeto
            const { Cargo, ...rest } = e;
            return rest;
        });

        res.json(empleadosFormateados);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener empleados por área', detalles: error.message });
    }
};



module.exports = {
    obtenerEmpleados,
    crearEmpleado,
    editarEmpleado,
    eliminarEmpleado,
    obtenerEmpleadosPorArea
};
