'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id_rol: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      nombre: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      descripcion: Sequelize.STRING(100)
    });

    // Inserta los roles básicos al crear la tabla
    await queryInterface.bulkInsert('roles', [
      { nombre: 'RH', descripcion: 'Recursos Humanos' },
      { nombre: 'CALIDAD', descripcion: 'Área de calidad' },
      { nombre: 'BODEGA', descripcion: 'Área de bodega' },
      { nombre: 'PRODUCCION', descripcion: 'Área de producción' }
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('roles');
  }
};
