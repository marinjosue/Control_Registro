'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('areas', {
      id_area: {
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

    // Inserta las áreas básicas
    await queryInterface.bulkInsert('areas', [
      { nombre: 'CALIDAD', descripcion: 'Área de calidad' },
      { nombre: 'BODEGA', descripcion: 'Área de bodega' },
      { nombre: 'PRODUCCION', descripcion: 'Área de producción' },
      { nombre: 'ADMINISTRACION', descripcion: 'Área de administración' },
      { nombre: 'MANTENIMIENTO', descripcion: 'Área de mantenimiento' }
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('areas');
  }
};
