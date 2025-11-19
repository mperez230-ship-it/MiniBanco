// backend/models_sql/index.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const DB_NAME = process.env.DB_NAME || 'minibanco_sql';

// MODELOS
const User = sequelize.define('User', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('user','admin'), defaultValue: 'user' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'users',
  timestamps: false
});

const Account = sequelize.define('Account', {
  id: { type: DataTypes.STRING, primaryKey: true },
  type: { type: DataTypes.ENUM('ahorro','corriente','cdt'), allowNull: false },
  balance: { type: DataTypes.FLOAT, defaultValue: 0 },
  createdAtText: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'accounts',
  timestamps: false
});

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.BIGINT, primaryKey: true },
  accountId: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('consignacion','retiro'), allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  date: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING }
}, {
  tableName: 'transactions',
  timestamps: false
});

// RELACIONES
User.hasMany(Account, { foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' });
Account.belongsTo(User, { foreignKey: 'userId', targetKey: 'id' });

Account.hasMany(Transaction, { foreignKey: 'accountId', sourceKey: 'id', onDelete: 'CASCADE' });
Transaction.belongsTo(Account, { foreignKey: 'accountId', targetKey: 'id' });

// CREAR DB AUTOMÁTICAMENTE
async function createDatabaseIfNotExists() {
  const mysql = require('mysql2/promise');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    port: process.env.DB_PORT || 3306
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
  await connection.end();

  console.log(`📦 Database checked/created: ${DB_NAME}`);
}

// SINCRONIZAR BASE + TABLAS
async function syncDatabase() {
  try {
    await createDatabaseIfNotExists();

    await sequelize.authenticate();
    console.log('✅ MySQL connected.');

    await sequelize.sync({ alter: true });
    console.log('✅ Tables synchronized.');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    process.exit(1);
  }
}

module.exports = {
  sequelize,
  User,
  Account,
  Transaction,
  syncDatabase
};