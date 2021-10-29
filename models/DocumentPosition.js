'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {

  class DocumentPosition extends Model {
    static associate(models) {
      this.belongsTo(models['Document'], {foreignKey: 'document_id'});
      this.belongsTo(models['Material'], {foreignKey: 'material_id'});
    }
  }

  DocumentPosition.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, autoIncrement: true },
    document_id: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Документ',
      references: { model: 'documents', key: 'id' },
    },
    material_id: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Материал',
      references: { model: 'materials', key: 'id' },
    },
    cnt: { type: DataTypes.INTEGER, allowNull: true, comment: 'Количество' },
    price: { type: DataTypes.DECIMAL(29, 15), allowNull: true, comment: 'Цена' },
  }, {
    sequelize,
    modelName: 'DocumentPosition',
    timestamps: false,
    underscored: true,
  });

  return DocumentPosition;
};