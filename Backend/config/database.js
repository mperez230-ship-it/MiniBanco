const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Database config that matches Railway env names and works both:
 * - locally (USE_LOCAL_DB=true or NODE_ENV=development) using DB_* / MYSQL_* local vars
 * - on Render (or any external host) using the public proxy URI from Railway (MYSQL_PUBLIC_URL)
 * - inside Railway (if deployed there) using the internal MYSQL_URL / MYSQLHOST
 *
 * Priority:
 * 1) MYSQL_PUBLIC_URL (public proxy URI from Railway)  --> best for Render
 * 2) MYSQL_URL / DATABASE_URL (internal URI; works inside Railway)
 * 3) Explicit DB_ / MYSQL_ individual vars (DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_PORT)
 * 4) Local defaults (minibanco_sql, root, '', localhost, 3306)
 *
 * Important:
 * - On Render set MYSQL_PUBLIC_URL to the full public URI Railway shows:
 *   mysql://root:<PASSWORD>@<proxy-host>:<proxy-port>/railway
 * - Do NOT set DB_HOST or MYSQLHOST to mysql.railway.internal when running on Render.
 * - If you want to force the use of local DB regardless of other envs set USE_LOCAL_DB=true
 */

const RAW_PUBLIC_URL = process.env.MYSQL_PUBLIC_URL || process.env.MYSQL_PUBLIC_URI || '';
const RAW_INTERNAL_URL = process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQL_URI || '';
const RAW_DB_URL = RAW_PUBLIC_URL || RAW_INTERNAL_URL || '';

// Individual variables (supporting names shown in your Railway screenshot)
const ENV_DB_NAME = process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME || process.env.DATABASE || 'minibanco_sql';
const ENV_DB_USER = process.env.MYSQLUSER || process.env.MYSQL_USER || process.env.DB_USER || 'root';
const ENV_DB_PASS = process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || process.env.DB_PASS || process.env.DB_PASSWORD || '';
const ENV_DB_HOST = process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost';
const ENV_DB_PORT = Number(process.env.MYSQLPORT || process.env.MYSQL_PORT || process.env.DB_PORT || 3306);

// Force local DB (useful for dev)
const FORCE_LOCAL = String(process.env.USE_LOCAL_DB || '').toLowerCase() === 'true';
const IS_DEV = process.env.NODE_ENV === 'development';

// Decision: should we use local individual vars or a DB URL?
// Use local if forced, or if in development and no explicit public/internal URL, otherwise prefer the URL.
const hasPublicUrl = !!RAW_PUBLIC_URL;
const hasInternalUrl = !!RAW_INTERNAL_URL;
const hasAnyUrl = !!RAW_DB_URL;
const useLocal = FORCE_LOCAL || (IS_DEV && !hasAnyUrl) || (!hasAnyUrl && !FORCE_LOCAL);

console.log('>>> DB CONFIG DECISION:', {
  NODE_ENV: process.env.NODE_ENV,
  FORCE_LOCAL,
  hasPublicUrl,
  hasInternalUrl,
  useLocal
});

if (useLocal) {
  console.log('>>> DEBUG DB CONFIG (LOCAL):', {
    DB_NAME: ENV_DB_NAME,
    DB_USER: ENV_DB_USER,
    DB_PASS: ENV_DB_PASS === '' ? '(VACÍO)' : '***',
    DB_HOST: ENV_DB_HOST,
    DB_PORT: ENV_DB_PORT
  });
} else {
  // show which URL we'll use but hide credentials
  const redacted = RAW_DB_URL ? RAW_DB_URL.replace(/\/\/.*?:.*?@/, '//***:***@') : '(vacía)';
  console.log('>>> DEBUG DB CONFIG (URL):', { DB_URL: redacted });
}

// Create Sequelize instance
let sequelize;
if (!useLocal && hasAnyUrl) {
  // Prefer the public proxy URL when available (this is what Render should use)
  const targetUrl = RAW_PUBLIC_URL || RAW_INTERNAL_URL;
  sequelize = new Sequelize(targetUrl, {
    dialect: 'mysql',
    logging: false,
    // optional: tune pool if necessary
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  });
} else {
  // Use individual connection params (local or explicit per-env)
  sequelize = new Sequelize(ENV_DB_NAME, ENV_DB_USER, ENV_DB_PASS, {
    host: ENV_DB_HOST,
    port: ENV_DB_PORT,
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  });
}

module.exports = sequelize;
