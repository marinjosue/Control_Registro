module.exports = (sequelize, DataTypes) => {
  const Cargo = sequelize.define('Cargo', {
    id_cargo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    cargo: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'cargos',
    timestamps: true
  });

  Cargo.associate = function(models) {
    Cargo.hasMany(models.Empleado, { foreignKey: 'id_cargo' });
  };

  return Cargo;
};
