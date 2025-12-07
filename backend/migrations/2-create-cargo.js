'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('cargos', {
      id_cargo: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      cargo: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Insertar cargos por defecto
    await queryInterface.bulkInsert('cargos', [
      { cargo: 'ASISTENTE DE PRODUCCION', createdAt: new Date(), updatedAt: new Date() },
      { cargo: 'AUXILIAR DE BODEGA', createdAt: new Date(), updatedAt: new Date() },
      { cargo: 'ELECTROMECANICO', createdAt: new Date(), updatedAt: new Date() },
      { cargo: 'GERENTE DE CALIDAD', createdAt: new Date(), updatedAt: new Date() },
      { cargo: 'GERENTE DE OPERACIONES', createdAt: new Date(), updatedAt: new Date() },
      { cargo: 'GERENTE DE PRODUCCION', createdAt: new Date(), updatedAt: new Date() },
      { cargo: 'JEFE DE BODEGA', createdAt: new Date(), updatedAt: new Date() },
      { cargo: 'JEFE DE PRODUCCION', createdAt: new Date(), updatedAt: new Date() },
      { cargo: 'JEFE DE VENTAS', createdAt: new Date(), updatedAt: new Date() },
      { cargo: 'OPERADOR DE PRODUCCION', createdAt: new Date(), updatedAt: new Date() },
      { cargo: 'OPERATIVO DE BODEGA', createdAt: new Date(), updatedAt: new Date() },
      { cargo: 'SUPERVISOR DE CALIDAD', createdAt: new Date(), updatedAt: new Date() },
      { cargo: 'SUPERVISOR DE PRODUCCION', createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('cargos');
  }
};
