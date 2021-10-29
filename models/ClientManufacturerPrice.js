'use strict';
const {
  Model
} = require('sequelize');
module.exports = function(sequelize, DataTypes) {

  class ClientManufacturerPrice extends Model {
    static associate(models) {
      this.belongsTo(models['Organization'], {as: 'Client', foreignKey: 'organization_id_client'});
      this.belongsTo(models['Organization'], {as: 'Manufacturer', foreignKey: 'organization_id_manufacturer'});
      this.belongsTo(models['PriceType'], {foreignKey: 'price_type_id'});
    }
  }

  ClientManufacturerPrice.init({
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
    organization_id_manufacturer: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      comment: "Производитель",
      references: {
        model: 'organizations',
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
    tableName: 'client_manufacturer_price',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "organization_id_client" },
          { name: "organization_id_manufacturer" },
        ]
      },
      {
        name: "client_manufacturer_price_organization_id_manufacturer_fk",
        using: "BTREE",
        fields: [
          { name: "organization_id_manufacturer" },
        ]
      },
      {
        name: "client_manufacturer_price_price_type_id_fk",
        using: "BTREE",
        fields: [
          { name: "price_type_id" },
        ]
      },
    ]
  }, {
    sequelize,
    modelName: 'ClientManufacturerPrice',
    timestamps: false,
    underscored: true,
  });

  return ClientManufacturerPrice;
};
