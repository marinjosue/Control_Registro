require('dotenv').config();
// ...existing code...
const bcrypt = require('bcrypt');
const { Usuario } = require('./models'); 

async function crearUsuarios() {
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
    console.log(`Usuario ${usuario.nombre_usuario} creado con éxito`);
  }

  process.exit();
}

crearUsuarios();
