'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Jornada extends Model {
    static associate(models) {
      Jornada.hasMany(models.HorarioEmpleado, { foreignKey: 'id_jornada' });
    }
  }
  Jornada.init({
    id_jornada: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre_jornada: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: false
    },
    tipo_turno: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['Matutino', 'Vespertino', 'mixto']]
      }
  
    }
  }, {
    sequelize,
    modelName: 'Jornada',
    tableName: 'jornadas',
    timestamps: false
  });
  return Jornada;
};
