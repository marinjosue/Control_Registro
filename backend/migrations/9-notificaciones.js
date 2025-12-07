'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('notificaciones', {
      id_notificacion: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      id_empleado: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'empleados',
          key: 'id_empleado'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tipo: {
        type: Sequelize.STRING(20), // Ej: 'atraso', 'falta'
        allowNull: false
      },
      leida: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      mensaje: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
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

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('notificaciones');
  }
};
