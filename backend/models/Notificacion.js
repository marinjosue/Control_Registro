'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Notificacion extends Model {
        static associate(models) {
            Notificacion.belongsTo(models.Empleado, { foreignKey: 'id_empleado' });
        }
    }
    Notificacion.init({
        id_notificacion: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        id_empleado: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        tipo: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        leida: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        mensaje: {
            type: DataTypes.STRING(255),
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Notificacion',
        tableName: 'notificaciones',
        timestamps: true
    });
    return Notificacion;
};
