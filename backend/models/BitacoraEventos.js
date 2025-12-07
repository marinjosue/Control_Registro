'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BitacoraEventos extends Model {
    static associate(models) {
      BitacoraEventos.belongsTo(models.Usuario, { foreignKey: 'id_usuario' });
    }
  }
  BitacoraEventos.init({
    id_evento: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_usuario: DataTypes.INTEGER,
    accion_realizada: DataTypes.STRING(255),
    timestamp: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'BitacoraEventos',
    tableName: 'bitacoraeventos',
    timestamps: true
  });
  return BitacoraEventos;
};
