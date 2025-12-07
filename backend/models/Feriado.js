'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Feriado extends Model {
    static associate(models) {
      // No tiene relaciones directas
    }
  }
  Feriado.init({
    id_feriado: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fecha: DataTypes.DATEONLY,
    descripcion: DataTypes.STRING(255),
    tipo: DataTypes.STRING(50)
  }, {
    sequelize,
    modelName: 'Feriado',
    tableName: 'feriados',
    timestamps: true
  });
  return Feriado;
};
