'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class Material extends Model {
    static associate(models) {
      this.belongsTo(models['Organization'], {as: 'Manufacturer', foreignKey: 'organization_id_manufacturer'});
    }
  }

  Material.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER.UNSIGNED
    },
    name: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true
    },
    organization_id_manufacturer: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: 'Производитель',
      references: { model: 'organizations',  key: 'id' }
    }
  }, {
    sequelize,
    modelName: 'Material',
    timestamps: false,
    underscored: true,
  });

  return Material;
};
