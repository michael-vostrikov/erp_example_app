'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {

  class CurrentStock extends Model {
    static associate(models) {
      this.belongsTo(models['Material'], {foreignKey: 'material_id'});
      this.belongsTo(models['Organization'], {as: 'Address', foreignKey: 'organization_id_address'});
      this.belongsTo(models['Organization'], {as: 'Ur', foreignKey: 'organization_id_ur'});
    }
  }

  CurrentStock.init({
    organization_id_address: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Склад', primaryKey: true,
      references: { model: 'organizations', key: 'id' },
    },
    organization_id_ur: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Юрлицо', primaryKey: true,
      references: { model: 'organizations', key: 'id' },
    },
    material_id: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Материал', primaryKey: true,
      references: { model: 'materials', key: 'id' },
    },
    cnt: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, comment: 'Количество' },
    reserve: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, comment: 'Резерв' },
  }, {
    sequelize,
    tableName: 'current_stock',
    modelName: 'CurrentStock',
    timestamps: false,
    underscored: true,
  });

  return CurrentStock;
};