const env = process.env.NODE_ENV || 'development';
const config = require('./config.js')[env];

module.exports = config;
