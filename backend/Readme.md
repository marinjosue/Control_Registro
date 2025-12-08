# Registro de Asistencias - Amaya Estética Backend

Backend para el sistema de registro de asistencias de Amaya Estética e Importaciones.

## Instalación

```bash
npm install
```

## Configuración

1. Crear archivo `.env` basado en `.env.example`
2. Configurar variables de entorno necesarias:
   - Base de datos
   - Puerto del servidor
   - Claves secretas

## Base de Datos

### Migraciones

#### Crear nueva migración
```bash
npx sequelize-cli migration:generate --name create-feriado
```

#### Ejecutar migraciones
```bash
npx sequelize-cli db:migrate
```
#### Revertir migraciones
```bash
# Revertir todas las migraciones
npx sequelize-cli db:migrate:undo:all

# Ejecutar migraciones nuevamente
npx sequelize-cli db:migrate
```

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm start
```

## Estructura del Proyecto

```
backend/
├── config/          # Configuración de base de datos
├── migrations/      # Migraciones de Sequelize
├── models/          # Modelos de datos
├── routes/          # Rutas de la API
├── controllers/     # Controladores
└── middlewares/     # Middlewares personalizados
```
