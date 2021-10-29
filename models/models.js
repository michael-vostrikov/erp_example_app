'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const cls = require('cls-hooked');

async function initModels(fastify)
{
  const namespace = cls.createNamespace('sequelize');
  Sequelize.useCLS(namespace);

  let sequelize = fastify.sequelize;

  const db = {};
  const dirname = __dirname;

  fs
    .readdirSync(dirname)
    .filter(file => {
      return (file.indexOf('.') !== 0) && (file !== path.basename(__filename)) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
      const model = require(path.join(dirname, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    });

  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  fastify.sequelize.models = db;
}

module.exports = initModels;
