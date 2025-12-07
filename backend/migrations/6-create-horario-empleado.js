'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('horarioempleados', {
      id_horario: {
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
        onDelete: 'SET NULL'
      },
      id_jornada: {
        type: Sequelize.INTEGER,
        references: {
          model: 'jornadas',
          key: 'id_jornada'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
       fecha_horario: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      es_dia_libre: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('horarioempleados');
  }
};
