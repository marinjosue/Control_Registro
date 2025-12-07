'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    static associate(models) {
      Usuario.hasMany(models.BitacoraEventos, { foreignKey: 'id_usuario' });
      Usuario.belongsTo(models.Rol, { foreignKey: 'id_rol' });

    }
  }
  Usuario.init({
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre_usuario: DataTypes.STRING(50),
    correo: DataTypes.STRING(100),
    contrasena_hash: DataTypes.STRING(255),
    id_rol: DataTypes.INTEGER,
    reset_token: DataTypes.STRING,
    reset_token_expires: DataTypes.DATE,

  }, {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    timestamps: true
  });
  return Usuario;
};
