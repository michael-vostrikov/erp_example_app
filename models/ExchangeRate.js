'use strict';
const {
  Model
} = require('sequelize');
module.exports = function(sequelize, DataTypes) {

  class ExchangeRate extends Model {
    static associate(models) {
      this.belongsTo(models['Currency'], {foreignKey: 'currency_id'});
    }
  }

  ExchangeRate.init({
    currency_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      comment: "Валюта",
      references: {
        model: 'currency',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      primaryKey: true,
      comment: "Дата"
    },
    value: {
      type: DataTypes.DECIMAL(29,15),
      allowNull: false,
      comment: "Курс к рублю"
    }
  }, {
    sequelize,
    tableName: 'exchange_rate',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "currency_id" },
          { name: "date" },
        ]
      },
    ]
  }, {
    sequelize,
    modelName: 'ExchangeRate',
    timestamps: false,
    underscored: true,
  });

  return ExchangeRate;
};
