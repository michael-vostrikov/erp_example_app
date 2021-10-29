'use strict';
const {
  Model
} = require('sequelize');
module.exports = function(sequelize, DataTypes) {

  class Price extends Model {
    static associate(models) {
      this.belongsTo(models['PriceType'], {foreignKey: 'price_type_id'});
      this.belongsTo(models['Material'], {foreignKey: 'material_id'});
      this.belongsTo(models['Currency'], {foreignKey: 'currency_id'});
    }
  }

  Price.init({
    price_type_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      comment: "Тип прайса",
      references: {
        model: 'price_types',
        key: 'id'
      }
    },
    material_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      comment: "Материал",
      references: {
        model: 'materials',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      primaryKey: true
    },
    price: {
      type: DataTypes.DECIMAL(29,15),
      allowNull: false,
      comment: "Цена"
    },
    currency_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: "Валюта",
      references: {
        model: 'currency',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'prices',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "price_type_id" },
          { name: "material_id" },
          { name: "date" },
        ]
      },
      {
        name: "material_id",
        using: "BTREE",
        fields: [
          { name: "material_id" },
        ]
      },
      {
        name: "currency_id",
        using: "BTREE",
        fields: [
          { name: "currency_id" },
        ]
      },
    ]
  }, {
    sequelize,
    modelName: 'Price',
    timestamps: false,
    underscored: true,
  });

  return Price;
};
