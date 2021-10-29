'use strict';
const {
  Model
} = require('sequelize');
module.exports = function(sequelize, DataTypes) {

  class PriceType extends Model {
    static associate(models) {
      // define association here
    }
  }

  PriceType.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: "name"
    }
  }, {
    sequelize,
    tableName: 'price_types',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "name",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "name" },
        ]
      },
    ]
  }, {
    sequelize,
    modelName: 'PriceType',
    timestamps: false,
    underscored: true,
  });

  return PriceType;
};
