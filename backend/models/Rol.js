'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Rol extends Model {
        static associate(models) {
            Rol.hasMany(models.Usuario, { foreignKey: 'id_rol' });
        }
    }
    Rol.init({
        id_rol: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nombre: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        descripcion: DataTypes.STRING(100)
    }, {
        sequelize,
        modelName: 'Rol',
        tableName: 'roles',
        timestamps: false
    });
    return Rol;
};
