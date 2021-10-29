'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {

  class Document extends Model {
    static associate(models) {
      this.belongsTo(models['DocumentType'], {foreignKey: 'document_type_id'});
      this.belongsTo(models['Organization'], {as: 'Address', foreignKey: 'organization_id_address'});
      this.belongsTo(models['Organization'], {as: 'Ur', foreignKey: 'organization_id_ur'});
      this.belongsTo(models['Organization'], {as: 'Client', foreignKey: 'organization_id_client'});

      this.hasMany(models['DocumentPosition'], {foreignKey: 'document_id'});
    }
  }

  Document.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, autoIncrement: true },
    date: { type: DataTypes.DATE, allowNull: false },
    document_type_id: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Тип документа',
      references: { model: 'document_types', key: 'id' },
    },
    organization_id_address: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Склад',
      references: { model: 'organizations', key: 'id' },
    },
    organization_id_ur: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Юрлицо',
      references: { model: 'organizations', key: 'id' },
    },
    organization_id_client: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Клиент',
      references: { model: 'organizations', key: 'id' },
    },
    closed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: 0, comment: '1 - документ закрыт, 0 - документ открыт' },
  }, {
    sequelize,
    modelName: 'Document',
    timestamps: false,
    underscored: true,
  });

  return Document;
};