'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {

  class Organization extends Model {
    static get TYPE_MANUFACTURER() { return 'manufacturer'; }

    static associate(models) {
      // define association here
    }
  }

  Organization.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER.UNSIGNED
    },
    type: {
      type: DataTypes.ENUM(['address', 'ur', 'manufacturer', 'client']),
      comment: 'address - подразделение/склад, ur - Юрлицо, manufacturer - производитель, client - клиент'
    },
    name: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'Organization',
    timestamps: false,
    underscored: true,
  });

  return Organization;
};
