const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'mi_secreto';

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) return res.status(403).json({ mensaje: 'Token requerido' });

  // Extraer el token del formato "Bearer <token>"
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  try {
    req.usuario = jwt.verify(token, SECRET);  
    next();
  } catch (err) {
    console.error('Error de autenticación:', err.message);
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
};

// Permite solo a RH (superusuario) acceder
const soloRH = (req, res, next) => {
  if (req.usuario.rol !== 'RH') {
    return res.status(403).json({ mensaje: 'Solo RH puede realizar esta acción' });
  }
  next();
};

module.exports = {
    soloRH,
    verificarToken
};