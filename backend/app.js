require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const empleadoRoutes = require('./routes/empleados');
const horarioEmpleadoRoutes = require('./routes/horarioEmpleados');
const jornadaRoutes = require('./routes/jornadas');
const asistenciaRoutes = require('./routes/asistencias');
const reportesRoutes = require('./routes/reportes');
const qrRoutes = require('./routes/qr');
const usuariosRoutes = require('./routes/usuarios');
const calcularHorasRoutes = require('./routes/calculoHora');

// --- Importar rutas para tablet ---
const tabletEmpleadoRoutes = require('./routes/tablet/empleados');
const tabletAsistenciaRoutes = require('./routes/tablet/asistencias');
const tabletHorarioRoutes = require('./routes/tablet/horarios');
const tabletNotificacionRoutes = require('./routes/tablet/notificaciones');
// -----------------------------------

const http = require('http');
const { Server } = require('socket.io');

// Importar controlador de websocket notificaciones
const NotificacionesWebSocket = require('./controllers/tablet/notificacionesWebSocket');

const app = express();
app.use(express.json({ limit: '10mb' }));
const server = http.createServer(app);

const whitelist = [
  process.env.BASE_URL
].filter(Boolean);

// Configuracion de CORS
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`[CORS] Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization'
  ]
};

app.use(cors(corsOptions));

app.use(express.json());

// Configurar servidor socket.io
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS (socket): ${origin}`));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Disponibilizar socket.io en la aplicacion
app.set('io', io);
app.locals.io = io;

global.io = io;

// Cargar modelos y conectar base de datos
app.use(express.json());

const db = require('./models');
const { Sequelize } = require('sequelize');

async function initializeDatabase() {
  try {
    console.log('[DB] Iniciando autenticacion con la base de datos...');
    await db.sequelize.authenticate();
    console.log('[DB] Autenticacion exitosa - conectado a TiDB');
    
    console.log('[DB] Sincronizando modelos (sin modificar existentes)...');
    // sync con alter: false solo crea tablas nuevas, no modifica las existentes
    await db.sequelize.sync({ alter: false, logging: false });
    console.log('[DB] Sincronizacion de modelos completada - tablas seguras');
    
  } catch (err) {
    console.error('[DB ERROR] Error de conexion a la base de datos:');
    console.error('[DB ERROR] Tipo:', err.name);
    console.error('[DB ERROR] Mensaje:', err.message);
    console.error('[DB ERROR] Host:', process.env.DB_HOST);
    console.error('[DB ERROR] Usuario:', process.env.DB_USERNAME);
    console.error('[DB ERROR] Base de datos:', process.env.DB_DATABASE);
    console.error('[DB ERROR] Puerto:', process.env.DB_PORT);
    process.exit(1);
  }
}

initializeDatabase();

// --- Rutas web ---
app.use('/api/auth', authRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/jornadas', jornadaRoutes);
app.use('/api/', horarioEmpleadoRoutes);
app.use('/api/asistencias', asistenciaRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/calculo-horas', calcularHorasRoutes);

// --- Rutas para tablet ---
app.use('/api/tablet/empleados', tabletEmpleadoRoutes);
app.use('/api/tablet/asistencias', tabletAsistenciaRoutes);
app.use('/api/tablet/horarios', tabletHorarioRoutes);
app.use('/api/tablet/notificaciones', tabletNotificacionRoutes);
// ---

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

// Manejadores de websocket para asistencias
io.on('connection', (socket) => {
  console.log('[WS] Cliente conectado a WebSocket:', socket.id);

  // Sala general de asistencias
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`[WEBSOCKET] Cliente ${socket.id} se unió a sala: ${room}`);
    socket.emit('joined_room', { room, message: `Unido a sala ${room}` });
  });

  socket.on('subscribeAsistencias', (filtro) => {
    socket.join(`asistencias:${JSON.stringify(filtro)}`);
    console.log(`Cliente suscrito a asistencias con filtro:`, filtro);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado de WebSocket:', socket.id);
  });
});

// Configurar websocket especifico para notificaciones
NotificacionesWebSocket.setupWebSocket(io);

console.log('[WS] WebSocket de notificaciones configurado correctamente');