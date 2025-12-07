'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuarios', {
      id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      nombre_usuario: Sequelize.STRING(50),
      correo: Sequelize.STRING(100),
      contrasena_hash: Sequelize.STRING(255),
      id_rol:{
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1 
      },
      reset_token: Sequelize.STRING,
      reset_token_expires: Sequelize.DATE,
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
       // Agrega FK
    await queryInterface.addConstraint('usuarios', {
      fields: ['id_rol'],
      type: 'foreign key',
      name: 'fk_usuario_rol',
      references: { 
        table: 'roles',
        field: 'id_rol'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });
  },
  
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('usuarios');
  }
};
