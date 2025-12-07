'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Empleado extends Model {
    static associate(models) {
      Empleado.hasMany(models.Asistencia, { foreignKey: 'id_empleado' });
      Empleado.hasMany(models.HorarioEmpleado, { foreignKey: 'id_empleado' });
      Empleado.belongsTo(models.Area, { foreignKey: 'id_area' });
      Empleado.belongsTo(models.Cargo, { foreignKey: 'id_cargo' });
    }
  }
  Empleado.init({
    id_empleado: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cedula: DataTypes.STRING(10),
    nombres: DataTypes.STRING(100),
    apellidos: DataTypes.STRING(100),
    id_cargo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cargos',
        key: 'id_cargo'
      }
    },
    id_area: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
      references: {
        model: 'areas',
        key: 'id_area'
      }
    },
    correo: DataTypes.STRING(100),
    direccion: DataTypes.STRING(100),
    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    edad: DataTypes.INTEGER,
    telefono: DataTypes.STRING(20),
    estado: DataTypes.STRING(20),
    fecha_ingreso: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    sueldo: DataTypes.DECIMAL(10,2),
    pin: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Empleado',
    tableName: 'empleados',
    timestamps: true
  });
  return Empleado;
};
