const sequelizeConfig = {
  dialect: 'mysql',
  host: 'mysql',
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  dialectOptions: {
    // connectionLimit: 40,
    namedPlaceholders: true,
    dateStrings: true,
    charset: 'utf8mb4_0900_ai_ci',
  },
  define: {
    timestamps: false
  },
  pool: {
    max: 40,
    min: 0,
    acquire: 6000,
    idle: 3000,
  },
  logging: false,
};

module.exports = {
  "development": sequelizeConfig,
  "test": sequelizeConfig,
  "production": sequelizeConfig
}
