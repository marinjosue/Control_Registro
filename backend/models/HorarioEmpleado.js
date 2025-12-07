'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HorarioEmpleado extends Model {
    static associate(models) {
      HorarioEmpleado.belongsTo(models.Empleado, { foreignKey: 'id_empleado' });
      HorarioEmpleado.belongsTo(models.Jornada, { foreignKey: 'id_jornada' });
    }
  }
  HorarioEmpleado.init({
    id_horario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    id_empleado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'empleados',
        key: 'id_empleado'
      }
    },
    id_jornada: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'jornadas',
        key: 'id_jornada'
      }
    },
    fecha_horario: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    es_dia_libre: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'HorarioEmpleado',
    tableName: 'horarioempleados',
    timestamps: false
  });
  return HorarioEmpleado;
};
