'use strict';
const {
  Model
} = require('sequelize');
module.exports = function(sequelize, DataTypes) {

  class ClientMaterialPrice extends Model {
    static associate(models) {
      this.belongsTo(models['Organization'], {as: 'Client', foreignKey: 'organization_id_client'});
      this.belongsTo(models['Material'], {foreignKey: 'material_id'});
      this.belongsTo(models['PriceType'], {foreignKey: 'price_type_id'});
    }
  }

  ClientMaterialPrice.init({
    organization_id_client: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      comment: "Клиент",
      references: {
        model: 'organizations',
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
    tableName: 'client_material_price',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "organization_id_client" },
          { name: "material_id" },
        ]
      },
      {
        name: "client_material_price_price_type_id_fk",
        using: "BTREE",
        fields: [
          { name: "price_type_id" },
        ]
      },
      {
        name: "client_material_price_material_id_fk",
        using: "BTREE",
        fields: [
          { name: "material_id" },
        ]
      },
    ]
  }, {
    sequelize,
    modelName: 'ClientMaterialPrice',
    timestamps: false,
    underscored: true,
  });

  return ClientMaterialPrice;
};
