const { Sequelize } = require('sequelize');
require('dotenv').config();

// Prioridad y detección
const RAW_DB_URL = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL || process.env.MYSQL_URI;

// Vars locales / por defecto
const LOCAL_DB_NAME = process.env.DB_NAME || 'minibanco_sql';
const LOCAL_DB_USER = process.env.DB_USER || 'root';
const LOCAL_DB_PASS = process.env.DB_PASS ?? 'tqvHyrOUGoouJRxefYpmdjyqgJbzOnCR';
const LOCAL_DB_HOST = process.env.DB_HOST || 'mysql.railway.internal';
const LOCAL_DB_PORT = Number(process.env.DB_PORT || 3306);

// Forzar modo local si se desea
const FORCE_LOCAL = (String(process.env.USE_LOCAL_DB || '').toLowerCase() === 'true');

// Determinar entorno (considera 'development' como local)
const IS_DEV = process.env.NODE_ENV === 'development';

// Decidir usar DB_URL o variables locales:
// - Si FORCE_LOCAL === true -> usar local
// - Si RAW_DB_URL existe y no estamos forzando local y no estamos en dev -> usar RAW_DB_URL
// - Si RAW_DB_URL no existe -> usar local
const useLocal = FORCE_LOCAL || !RAW_DB_URL || IS_DEV;
const DB_URL = RAW_DB_URL;

console.log('>>> DB CONFIG DECISION:', { IS_DEV, FORCE_LOCAL, hasRawUrl: !!RAW_DB_URL, useLocal });

if (useLocal) {
  console.log('>>> DEBUG DB CONFIG: usando configuración LOCAL', {
    DB_NAME: LOCAL_DB_NAME,
    DB_USER: LOCAL_DB_USER,
    DB_PASS: LOCAL_DB_PASS === '' ? '(VACÍO)' : '***',
    DB_HOST: LOCAL_DB_HOST,
    DB_PORT: LOCAL_DB_PORT
  });
} else {
  console.log('>>> DEBUG DB CONFIG: usando DB_URL (ocultando credenciales)', {
    DB_URL: DB_URL ? '*** (uri presente)' : '(vacía)'
  });
}

let sequelize;
if (!useLocal && DB_URL) {
  // Usar URI completa cuando esté disponible y no se esté forzando local
  sequelize = new Sequelize(DB_URL, {
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  });
} else {
  // Usar configuración local
  sequelize = new Sequelize(LOCAL_DB_NAME, LOCAL_DB_USER, LOCAL_DB_PASS, {
    host: LOCAL_DB_HOST,
    port: LOCAL_DB_PORT,
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  });
}

module.exports = sequelize;
