'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('asistencias', {
      id_asistencia: {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
      },
      id_empleado: {
      type: Sequelize.INTEGER,
      references: {
        model: 'empleados',
        key: 'id_empleado'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
      },
      fecha_entrada: Sequelize.DATEONLY,
      hora_entrada: Sequelize.TIME,
      fecha_salida: Sequelize.DATEONLY,
      hora_salida: Sequelize.TIME,
      hora_entrada_desayuno: Sequelize.TIME,
      hora_salida_desayuno: Sequelize.TIME,
      hora_entrada_almuerzo: Sequelize.TIME,
      hora_salida_almuerzo: Sequelize.TIME,
      hora_entrada_merienda: Sequelize.TIME,
      hora_salida_merienda: Sequelize.TIME,
      estado: Sequelize.STRING(20),
      tipo_registro: Sequelize.STRING(10),
      horas_trabajadas: Sequelize.FLOAT,
      horas_normales: Sequelize.FLOAT, // Sin recargo
      horas_25: Sequelize.FLOAT,       // Recargo 25%
      horas_50: Sequelize.FLOAT,       // Recargo 50%
      horas_100: Sequelize.FLOAT,      // Recargo 100% (extraordinarias)
      horas_feriado: Sequelize.FLOAT,  // Horas en feriado
      createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('asistencias');
  }
};
