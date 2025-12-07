'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Asistencia extends Model {
    static associate(models) {
      Asistencia.belongsTo(models.Empleado, { foreignKey: 'id_empleado' });
    }
  }
  Asistencia.init({
    id_asistencia: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_empleado: DataTypes.INTEGER,
    fecha_entrada: DataTypes.DATEONLY,
    hora_entrada: DataTypes.TIME,
    fecha_salida: DataTypes.DATEONLY,
    hora_salida: DataTypes.TIME,
    // Nuevos campos para desayuno, almuerzo y merienda
    hora_entrada_desayuno: DataTypes.TIME,
    hora_salida_desayuno: DataTypes.TIME,
    hora_entrada_almuerzo: DataTypes.TIME,
    hora_salida_almuerzo: DataTypes.TIME,
    hora_entrada_merienda: DataTypes.TIME,
    hora_salida_merienda: DataTypes.TIME,
    estado: DataTypes.STRING(20),
    tipo_registro: DataTypes.STRING(10),
    horas_trabajadas: DataTypes.FLOAT,  // Total de horas trabajadas
    horas_normales: DataTypes.FLOAT,      // Sin recargo
    horas_25: DataTypes.FLOAT,            // Recargo 25%
    horas_50: DataTypes.FLOAT,            // Recargo 50%
    horas_100: DataTypes.FLOAT,           // Recargo 100% (extraordinarias)
    horas_feriado: DataTypes.FLOAT        // Horas en feriado
  }, {
    sequelize,
    modelName: 'Asistencia',
    tableName: 'asistencias',
    timestamps: true
  });
  return Asistencia;
};