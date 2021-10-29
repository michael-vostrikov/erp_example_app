'use strict';
const {
  Model
} = require('sequelize');
module.exports = function(sequelize, DataTypes) {

  class PromoDiscount extends Model {
    static associate(models) {
      this.belongsTo(models['Material'], {foreignKey: 'material_id'});
      this.belongsTo(models['PriceType'], {foreignKey: 'price_type_id'});
    }
  }

  PromoDiscount.init({
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
    beg_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      primaryKey: true,
      comment: "Дата начала акции"
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Дата окончания акции"
    },
    price_type_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: "Тип прайса",
      references: {
        model: 'price_types',
        key: 'id'
      }
    },
    coefficient: {
      type: DataTypes.DECIMAL(10,5),
      allowNull: false,
      defaultValue: 1.00000,
      comment: "Коэффициент"
    }
  }, {
    sequelize,
    tableName: 'promo_discounts',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "material_id" },
          { name: "beg_date" },
        ]
      },
      {
        name: "price_type_id",
        using: "BTREE",
        fields: [
          { name: "price_type_id" },
        ]
      },
    ]
  }, {
    sequelize,
    modelName: 'PromoDiscount',
    timestamps: false,
    underscored: true,
  });

  return PromoDiscount;
};
