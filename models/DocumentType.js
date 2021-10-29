'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {

  class DocumentType extends Model {
    static associate(models) {
      // define association here
    }
  }

  DocumentType.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER.UNSIGNED
    },
    credit_type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: 'Влияние на баланс: -1 - кредитовый документ, 1 - дебетовый документ, 0 - не влияет на баланс'
    },
    name: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'DocumentType',
    timestamps: false,
    underscored: true,
  });

  return DocumentType;
};
