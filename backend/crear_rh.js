require('dotenv').config();
// ...existing code...
const bcrypt = require('bcrypt');
const { Usuario, Rol } = require('./models'); 

async function crearRolesYUsuarios() {
  try {
    // Crear roles
    console.log('[SETUP] Creando roles...');
    const roles = [
      { id_rol: 1, nombre: 'RH', descripcion: 'Recursos Humanos' },
      { id_rol: 2, nombre: 'Calidad', descripcion: 'Control de Calidad' },
      { id_rol: 3, nombre: 'Bodega', descripcion: 'Administrador de Bodega' },
      { id_rol: 4, nombre: 'Produccion', descripcion: 'Supervisor de Produccion' }
    ];

    for (const rol of roles) {
      await Rol.findOrCreate({
        where: { id_rol: rol.id_rol },
        defaults: {
          nombre: rol.nombre,
          descripcion: rol.descripcion
        }
      });
      console.log(`Rol ${rol.nombre} verificado`);
    }

    // Crear usuarios
    console.log('[SETUP] Creando usuarios...');
    const usuarios = [
      { nombre_usuario: 'RH', correo: 'rh@gmail.com', id_rol: 1 },
      { nombre_usuario: 'Calidad', correo: 'calidad@gmail.com', id_rol: 2 },
      { nombre_usuario: 'Bodega', correo: 'bodega@gmail.com', id_rol: 3 },
      { nombre_usuario: 'Produccion', correo: 'produccion@gmail.com', id_rol: 4 }
    ];

    const contrasena = 'admin2002';
    const hash = await bcrypt.hash(contrasena, 10);

    for (const usuario of usuarios) {
      await Usuario.create({
        nombre_usuario: usuario.nombre_usuario,
        correo: usuario.correo,
        contrasena_hash: hash,
        id_rol: usuario.id_rol
      });
      console.log(`Usuario ${usuario.nombre_usuario} creado con exito`);
    }

    console.log('[SETUP] Usuarios y roles creados exitosamente');
    process.exit(0);
  } catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
  }
}

crearRolesYUsuarios();
