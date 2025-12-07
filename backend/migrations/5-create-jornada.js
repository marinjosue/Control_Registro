'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jornadas', {
      id_jornada: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre_jornada: Sequelize.STRING(50),
      hora_inicio: Sequelize.TIME,
      hora_fin: Sequelize.TIME,
      tipo_turno: Sequelize.STRING(20),
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
    await queryInterface.dropTable('jornadas');
  }
};
