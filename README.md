# Sistema de Control de Registro y Asistencia

## 📋 Descripción del Proyecto

Sistema integral compuesto por tres módulos principales para la gestión empresarial:

### 🏠 1. Principal (Landing Page)
Página de inicio que presenta el sistema y proporciona acceso a los diferentes módulos.

**Características:**
- Diseño moderno y responsive
- Presentación de servicios
- Navegación a los módulos de Registro de Asistencia y Agenda
- Información de contacto

### 👥 2. Registro de Asistencia (Recursos Humanos)
Módulo completo para la gestión de recursos humanos y control de asistencia de empleados.

**Funcionalidades principales:**
- ✅ Gestión de empleados
- 📊 Control de asistencias con códigos QR
- ⏰ Administración de horarios y jornadas
- 📈 Generación de reportes
- 👤 Gestión de usuarios del sistema
- 🔔 Sistema de notificaciones
- 🔐 Autenticación y control de acceso por roles

### 📅 3. Agenda
Módulo para el agendamiento de citas y reuniones.

**Características:**
- 📝 Formulario de solicitud de citas
- 📧 Sistema de notificaciones por email
- 📞 Información de contacto
- ⏰ Selección de fecha y hora preferida
- 📱 Diseño responsive

## 🚀 Estructura del Proyecto

```
Control_Registro/
├── backend/                    # API y lógica del servidor
│   ├── controllers/           # Controladores de negocio
│   ├── models/               # Modelos de base de datos
│   ├── routes/               # Rutas de la API
│   ├── middlewares/          # Middleware de autenticación
│   └── services/             # Servicios adicionales
│
└── frontend/                  # Interfaz de usuario
    └── src/
        ├── pages/
        │   ├── principal/    # Landing page
        │   ├── registro_asistencia/  # Módulo de RH
        │   ├── agenda/       # Módulo de citas
        │   ├── auth/         # Autenticación
        │   └── shared/       # Componentes compartidos
        ├── routes/           # Configuración de rutas
        ├── services/         # Servicios de API
        └── context/          # Context API de React
```

## 🛠️ Tecnologías Utilizadas

### Backend
- Node.js
- Express.js
- Sequelize ORM
- PostgreSQL
- JWT para autenticación
- QR Code Generator

### Frontend
- React.js
- React Router
- Context API
- CSS Modules
- Axios

## 📦 Instalación

### Requisitos previos
- Node.js (v14 o superior)
- PostgreSQL
- npm o yarn

### Configuración del Backend

```bash
cd backend
npm install
```

Crear archivo `.env`:
```env
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=control_registro
DB_PORT=5432
JWT_SECRET=tu_secreto_jwt
```

Ejecutar migraciones:
```bash
npx sequelize-cli db:migrate
```

Iniciar servidor:
```bash
npm start
```

### Configuración del Frontend

```bash
cd frontend
npm install
```

Crear archivo `.env`:
```env
REACT_APP_API_URL=http://localhost:3000/api
```

Iniciar aplicación:
```bash
npm start
```

## 🔑 Roles y Permisos

### RH (Recursos Humanos)
- Acceso completo al módulo de Registro de Asistencia
- Gestión de empleados, horarios, jornadas
- Generación de reportes
- Gestión de códigos QR

### ADMIN (Administrador)
- Acceso completo a todos los módulos
- Gestión de usuarios del sistema

## 📱 Módulos Detallados

### Principal
- **Ruta:** `/`
- **Acceso:** Público
- **Componente principal:** `Principal.jsx`

### Registro de Asistencia
- **Ruta base:** `/rh`
- **Acceso:** Requiere autenticación (rol RH o ADMIN)
- **Funcionalidades:**
  - Dashboard de recursos humanos
  - Gestión de empleados
  - Control de asistencias
  - Gestión de horarios
  - Gestión de jornadas
  - Generación de reportes
  - Códigos QR
  - Notificaciones

### Agenda
- **Ruta:** `/agenda`
- **Acceso:** Público
- **Funcionalidades:**
  - Formulario de solicitud de citas
  - Información de contacto
  - Validación de datos

## 🤝 Contribución

Este proyecto está siendo desarrollado por el equipo de ESPE. Para contribuir:

1. Los módulos Principal y Registro de Asistencia están completados
2. El módulo de Agenda está preparado para desarrollo adicional
3. Cada módulo es independiente y puede ser desarrollado por separado

## 📝 Notas de Desarrollo

- El proyecto ha sido reorganizado de una estructura multi-módulo a tres módulos principales
- Se eliminaron los módulos de Bodega, Calidad y Producción
- El módulo de Recursos Humanos se renombró a Registro de Asistencia
- Se creó una nueva landing page (Principal)
- Se agregó el módulo de Agenda para futuro desarrollo

## 📄 Licencia

Proyecto académico - ESPE 2025