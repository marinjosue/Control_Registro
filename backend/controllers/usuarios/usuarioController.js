const { Usuario, Rol } = require('../../models');
const bcrypt = require('bcrypt');

// Obtener todos los usuarios
const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: ['id_usuario', 'nombre_usuario', 'correo'],
            include: [{
                model: Rol,
                attributes: ['nombre']
            }]
        });

        // Formatear la respuesta para mostrar solo los campos requeridos
        const usuariosFormateados = usuarios.map(u => ({
            id_usuario: u.id_usuario,
            nombre_usuario: u.nombre_usuario,
            correo: u.correo,
            rol: u.Rol ? u.Rol.nombre : null
        }));

        res.json(usuariosFormateados);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener usuarios', detalles: error.message });
    }
};

// Editar usuario
const editarUsuario = async (req, res) => {
    try {
        const { nombre_usuario, correo, contrasena_actual, contrasena_nueva, id_rol } = req.body;
        const usuario = await Usuario.findByPk(req.params.id);
        
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        
        // Si se está cambiando contraseña, verificar la actual
        if (contrasena_nueva) {
            if (!contrasena_actual) {
                return res.status(400).json({ mensaje: 'Contraseña actual requerida' });
            }
            
            const passwordValida = await bcrypt.compare(contrasena_actual, usuario.contrasena_hash);
            if (!passwordValida) {
                return res.status(400).json({ mensaje: 'Contraseña actual incorrecta' });
            }
            
            const hash = await bcrypt.hash(contrasena_nueva, 10);
            usuario.contrasena_hash = hash;
        }
        
        usuario.nombre_usuario = nombre_usuario || usuario.nombre_usuario;
        usuario.correo = correo || usuario.correo;
        usuario.id_rol = id_rol || usuario.id_rol;
        
        await usuario.save();
        res.json({ mensaje: 'Usuario actualizado con éxito', usuario });
    } catch (error) {
        res.status(500).json({ error: 'Error al editar usuario', detalles: error.message });
    }
};

const crearUsuario = async (req, res) => {
    try {
        const { nombre_usuario, correo, contrasena, id_rol } = req.body;

        // Validar que el usuario no exista
        const usuarioExistente = await Usuario.findOne({ where: { correo } });
        if (usuarioExistente) {
            return res.status(400).json({ mensaje: 'El correo ya está en uso' });
        }

        // Crear nuevo usuario
        const hash = await bcrypt.hash(contrasena, 10);
        const nuevoUsuario = await Usuario.create({
            nombre_usuario,
            correo,
            contrasena_hash: hash,
            id_rol
        });

        res.status(201).json({ mensaje: 'Usuario creado con éxito', usuario: nuevoUsuario });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear usuario', detalles: error.message });
    }
};

// Eliminar usuario
const eliminarUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        await usuario.destroy();
        res.json({ mensaje: 'Usuario eliminado con éxito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar usuario', detalles: error.message });
    }
};

module.exports = {
    obtenerUsuarios,
    editarUsuario,
    eliminarUsuario,
    crearUsuario
};