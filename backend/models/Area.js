'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Area extends Model {
    static associate(models) {
      Area.hasMany(models.Empleado, { foreignKey: 'id_area' });
    }
  }
  Area.init({
    id_area: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    descripcion: DataTypes.STRING(100)
  }, {
    sequelize,
    modelName: 'Area',
    tableName: 'areas',
    timestamps: false
  });
  return Area;
};
