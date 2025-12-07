const { Usuario } = require('../../models');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { BASE_URL } = process.env; // Importamos la variable de entorno

// Paso 1: Solicitud de recuperación (envía el correo con enlace)
const forgotPassword = async (req, res) => {
  const { correo } = req.body;
  const usuario = await Usuario.findOne({ where: { correo } });
  if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });

  // Genera token seguro
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 1000 * 60 * 15; // 15 minutos

  // Guarda token y expiración temporalmente
  usuario.reset_token = token;
  usuario.reset_token_expires = new Date(expires);
  await usuario.save();

  // Configura el transporter (reemplaza por tus credenciales reales)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER, 
      pass: process.env.MAIL_PASS  
    }
  });

  // Usa la URL base configurada
  const resetUrl = `${BASE_URL}/reset-password/${token}`;
  await transporter.sendMail({
   from: '"Soporte Healthy" <josuisaac2002@gmail.com>',
    to: correo,
    subject: 'Recuperación de contraseña',
    html: `<p>Haz clic en el siguiente enlace para recuperar tu contraseña:</p>
           <a href="${resetUrl}">${resetUrl}</a>
           <p>Este enlace expirará en 15 minutos.</p>`
  });

  res.json({ mensaje: 'Correo de recuperación enviado.' });
};
// Paso 2: Reset password usando el token
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { nuevaContrasena } = req.body;

  const usuario = await Usuario.findOne({
    where: {
      reset_token: token,
      reset_token_expires: { [require('sequelize').Op.gt]: new Date() }
    }
  });

  if (!usuario) return res.status(400).json({ mensaje: 'Token inválido o expirado.' });

  usuario.contrasena_hash = await bcrypt.hash(nuevaContrasena, 10);
  usuario.reset_token = null;
  usuario.reset_token_expires = null;
  await usuario.save();

  res.json({ mensaje: 'Contraseña actualizada correctamente.' });
};
module.exports = {
    forgotPassword,
    resetPassword
};
