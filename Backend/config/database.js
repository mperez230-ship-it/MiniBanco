const { Sequelize } = require("sequelize");
require("dotenv").config();

// Prioriza URI (Railway public URL) y hace fallback a variables separadas.
// Acepta varios nombres comunes de variables de entorno (Railway / Render / DB_*)
const DB_URL = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL || process.env.MYSQL_URI;

const DB_NAME = process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME || process.env.DATABASE;
const DB_USER = process.env.MYSQLUSER || process.env.MYSQL_USER || process.env.DB_USER;
const DB_PASS = process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || process.env.DB_PASS || process.env.DB_PASSWORD;
const DB_HOST = process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DB_HOST || "localhost";
const DB_PORT = process.env.MYSQLPORT || process.env.MYSQL_PORT || process.env.DB_PORT || 3306;

console.log(">>> DEBUG DB CONFIG (Render + Railway):", {
  DB_URL: DB_URL ? "*** (uri presente)" : "(vacía)",
  DB_NAME,
  DB_USER,
  DB_PASS: DB_PASS ? "***" : "(VACÍO)",
  DB_HOST,
  DB_PORT
});

let sequelize;
if (DB_URL) {
  // Usar URI completa cuando esté disponible (recomendado)
  sequelize = new Sequelize(DB_URL, {
    dialect: "mysql",
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  });
} else {
  // Fallback a variables separadas
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: "mysql",
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  });
}

module.exports = sequelize;
