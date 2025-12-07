const { Usuario, Rol } = require('../../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op, json } = require('sequelize');

const SECRET = process.env.JWT_SECRET || 'mi_secreto';

// RH crea usuarios nuevos
const register = async (req, res) => {
    try {
        const { nombre_usuario, correo, contrasena, id_rol } = req.body;

        // Solo RH debe tener acceso a este endpoint (ver middleware)
        const hash = await bcrypt.hash(contrasena, 10);

        // Verifica si ya existe el usuario o correo
        const existente = await Usuario.findOne({
            where: { [Op.or]: [{ nombre_usuario }, { correo }] }
        });
        if (existente) return res.status(400).json({ error: 'Usuario o correo ya existe.' });

        // Crea el usuario nuevo
        const usuario = await Usuario.create({
            nombre_usuario,
            correo,
            contrasena_hash: hash,
            id_rol
        });
        res.json({
            mensaje: 'Usuario creado correctamente',
            usuario: {
                id: usuario.id_usuario,
                nombre_usuario: usuario.nombre_usuario,
                correo: usuario.correo,
                rol: usuario.id_rol
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Login por usuario o correo
const login = async (req, res) => {
    const { identificador, contrasena } = req.body;
    const usuario = await Usuario.findOne({
        where: {
            [Op.or]: [{ nombre_usuario: identificador }, { correo: identificador }]
        },
        include: [{ model: Rol }]
    });
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const esValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);
    if (!esValida) return res.status(401).json({ mensaje: 'Credenciales incorrectas' });

    const token = jwt.sign({
        id: usuario.id_usuario,
        rol: usuario.Rol.nombre 
    }, SECRET, { expiresIn: '8h' });

    res.json({
        mensaje: 'Inicio de sesión exitoso',
        usuario: {
            id: usuario.id_usuario,
            nombre_usuario: usuario.nombre_usuario,
            correo: usuario.correo,
            rol: usuario.Rol.nombre
        },
        token
    });
};

module.exports = {
    register,
    login
};
