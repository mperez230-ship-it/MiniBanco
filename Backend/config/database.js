// backend/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'minibanco_sql';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS ?? '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;

console.log(">>> DEBUG DB CONFIG:", {
  DB_NAME,
  DB_USER,
  DB_PASS: DB_PASS === "" ? "(VACÍO)" : "***",
  DB_HOST,
  DB_PORT
});

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: false,
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
});

module.exports = sequelize;