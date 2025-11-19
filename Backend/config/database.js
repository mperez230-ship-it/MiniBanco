// backend/config/database.js
const { Sequelize } = require("sequelize");
require("dotenv").config();

// Variables tomadas desde Railway
const DB_NAME = process.env.MYSQLDATABASE;
const DB_USER = process.env.MYSQLUSER;
const DB_PASS = process.env.MYSQLPASSWORD;
const DB_HOST = process.env.MYSQLHOST;
const DB_PORT = process.env.MYSQLPORT || 3306;

console.log(">>> DEBUG DB CONFIG (Render + Railway):", {
  DB_NAME,
  DB_USER,
  DB_PASS: DB_PASS ? "***" : "(VACÍO)",
  DB_HOST,
  DB_PORT
});

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
  logging: false,
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
});

module.exports = sequelize;
