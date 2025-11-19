// backend/models_sql/index.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/* ============================================================
   MODELO USER
============================================================ */
const User = sequelize.define('User', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'users',
  timestamps: false
});

/* ============================================================
   MODELO ACCOUNT
============================================================ */
const Account = sequelize.define('Account', {
  id: { type: DataTypes.STRING, primaryKey: true },

  // IMPORTANTE: Campo que faltaba
  userId: { type: DataTypes.STRING, allowNull: false },

  type: { type: DataTypes.ENUM('ahorro', 'corriente', 'cdt'), allowNull: false },
  balance: { type: DataTypes.FLOAT, defaultValue: 0 },
  createdAtText: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'accounts',
  timestamps: false
});

/* ============================================================
   MODELO TRANSACTION
============================================================ */
const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

  accountId: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('consignacion', 'retiro'), allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  date: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING }
}, {
  tableName: 'transactions',
  timestamps: false
});

/* ============================================================
   RELACIONES ENTRE MODELOS
============================================================ */
User.hasMany(Account, {
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE'
});

Account.belongsTo(User, {
  foreignKey: 'userId',
  targetKey: 'id'
});

Account.hasMany(Transaction, {
  foreignKey: 'accountId',
  sourceKey: 'id',
  onDelete: 'CASCADE'
});

Transaction.belongsTo(Account, {
  foreignKey: 'accountId',
  targetKey: 'id'
});

/* ============================================================
   SINCRONIZAR BASE (AJUSTADO PARA RENDER + RAILWAY)
============================================================ */
async function syncDatabase() {
  try {
    // Detectar producción (Render)
    const isProduction = process.env.RENDER || process.env.NODE_ENV === 'production';

    // Railway NO permite crear DB → solo local
    if (!isProduction) {
      console.log('📦 Local mode: Database auto-creation enabled');
    } else {
      console.log('🌐 Production mode: Skipping DB creation (Railway restricts it)');
    }

    await sequelize.authenticate();
    console.log('✅ MySQL connected.');

    // Crea tablas si no existen
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
