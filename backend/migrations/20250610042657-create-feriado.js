'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('feriados', {
      id_feriado: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      descripcion: Sequelize.STRING(255),
      tipo: Sequelize.STRING(50),
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
    await queryInterface.dropTable('feriados');
  }
};
