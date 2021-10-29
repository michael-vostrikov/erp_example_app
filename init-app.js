const mysql = require('mysql2');
const sequelizeConfig = require('./config/sequelize');
const fastify = require('fastify')({
  logger: false,
  pluginTimeout: 3600 * 1000
})

async function init()
{
  await fastify.register(
    require('sequelize-fastify'),
    {
      instance: 'sequelize',
      sequelizeOptions: require('./config/sequelize'),
    }
  )

  async function createDatabase() {
    const dbConfig = {
      host: 'mysql',
      user: sequelizeConfig.username,
      password: sequelizeConfig.password,
      charset: sequelizeConfig.dialectOptions.charset,
      multipleStatements: true,
    };
    const dbConnection = mysql.createConnection(dbConfig).promise();

    await dbConnection.connect();


    let sql = 'CREATE DATABASE IF NOT EXISTS ' + sequelizeConfig.database;
    await dbConnection.query(sql);

    console.log('Database created\n');

    await dbConnection.end();
  }

  await createDatabase();

  const sql = 'SELECT * FROM documents LIMIT 1';
  let [res] = await fastify.sequelize.query(sql);
  if (res.length > 0) {
    let initModels = require('./models/models');
    await initModels(fastify);

    await fastify.sequelize.sync({force: true});

    console.log('Tables created\n');
  } else {
    console.log('Tables already exist\n');
  }
}

init().then(function() {
  process.exit(0);
});
