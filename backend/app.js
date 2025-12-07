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

// ========== RUTAS PARA TABLET ==========
const tabletEmpleadoRoutes = require('./routes/tablet/empleados');
const tabletAsistenciaRoutes = require('./routes/tablet/asistencias');
const tabletHorarioRoutes = require('./routes/tablet/horarios');
const tabletNotificacionRoutes = require('./routes/tablet/notificaciones');
// =============================================

const http = require('http');
const { Server } = require('socket.io');

// IMPORTAR CONTROLADOR DE WEBSOCKET NOTIFICACIONES
const NotificacionesWebSocket = require('./controllers/tablet/notificacionesWebSocket');

const app = express();
app.use(express.json({ limit: '10mb' }));
const server = http.createServer(app);

//  Lista de orígenes permitidos (local + vercel)
const whitelist = [
  process.env.BASE_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`❌ Blocked by CORS: ${origin}`);
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

// Make io available to our controllers
app.set('io', io);
app.locals.io = io;

global.io = io;

// Middlewares
app.use(express.json());

// Carga modelos y conecta BD
const db = require('./models');
db.sequelize.authenticate()
  .then(() => console.log('Conexión con la base de datos exitosa!'))
  .catch(err => console.error('Error de conexión a la base de datos'));

// ========== RUTAS WEB ==========
app.use('/api/auth', authRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/jornadas', jornadaRoutes);
app.use('/api/', horarioEmpleadoRoutes);
app.use('/api/asistencias', asistenciaRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/calculo-horas', calcularHorasRoutes);

// ========== RUTAS PARA TABLET ==========
app.use('/api/tablet/empleados', tabletEmpleadoRoutes);
app.use('/api/tablet/asistencias', tabletAsistenciaRoutes);
app.use('/api/tablet/horarios', tabletHorarioRoutes);
app.use('/api/tablet/notificaciones', tabletNotificacionRoutes);
// =================================================================

// Servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

// WEBSOCKET HANDLERS - ASISTENCIAS
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado a WebSocket:', socket.id);

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

// CONFIGURAR WEBSOCKET ESPECÍFICO PARA NOTIFICACIONES
NotificacionesWebSocket.setupWebSocket(io);

console.log('✅ WebSocket de notificaciones configurado correctamente');