'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('empleados', {
      id_empleado: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      cedula: Sequelize.STRING(10),
      nombres: Sequelize.STRING(100),
      apellidos: Sequelize.STRING(100),
      id_cargo: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cargos',
          key: 'id_cargo'
        }
      },
      id_area: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2,
        references: {
          model: 'areas',
          key: 'id_area'
        }
      },
      correo: Sequelize.STRING(100),
      direccion: Sequelize.STRING(100),
      fecha_nacimiento: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      edad: Sequelize.INTEGER,
      telefono: Sequelize.STRING(20),
      estado: Sequelize.STRING(20),
      fecha_ingreso: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      sueldo: Sequelize.DECIMAL(10,2),
      pin: Sequelize.INTEGER,
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
    // FK para id_area
    await queryInterface.addConstraint('empleados', {
      fields: ['id_area'],
      type: 'foreign key',
      name: 'fk_empleado_area',
      references: {
        table: 'areas',
        field: 'id_area'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });
    // FK para id_cargo
    await queryInterface.addConstraint('empleados', {
      fields: ['id_cargo'],
      type: 'foreign key',
      name: 'fk_empleado_cargo',
      references: {
        table: 'cargos',
        field: 'id_cargo'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('empleados');
  }
};
