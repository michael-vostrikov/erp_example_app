'use strict';
const {
  Model
} = require('sequelize');
module.exports = function(sequelize, DataTypes) {

  class Currency extends Model {
    static associate(models) {
      // define association here
    }
  }

  Currency.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "name"
    },
    abbr: {
      type: DataTypes.STRING(4),
      allowNull: false,
      comment: "Аббревиатура",
      unique: "abbr"
    }
  }, {
    sequelize,
    tableName: 'currency',
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
      {
        name: "abbr",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "abbr" },
        ]
      },
    ]
  }, {
    sequelize,
    modelName: 'Currency',
    timestamps: false,
    underscored: true,
  });

  return Currency;
};
