// backend/controllers_sql/transactionController.js
const { Account, Transaction } = require('../models_sql');

exports.createTransaction = async (req, res) => {
  try {
    const { accountId, type, amount, description } = req.body;
    const { userId: requestUserId, role: requestRole } = req.query;

    if (!accountId || !type || !amount) {
      return res.status(400).json({ error: 'Faltan datos de transacción' });
    }

    const account = await Account.findByPk(accountId);
    if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });

    // Verificar que el usuario solo pueda hacer transacciones en sus propias cuentas (excepto admin)
    if (requestRole !== 'admin' && account.userId !== requestUserId) {
      return res.status(403).json({ error: 'No autorizado. Solo puedes hacer transacciones en tus propias cuentas.' });
    }

    if (type === 'retiro' && amount > account.balance) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    account.balance = type === 'consignacion' ? account.balance + amount : account.balance - amount;
    await account.save();

    const tx = await Transaction.create({
      id: Date.now(),
      accountId,
      type,
      amount,
      date: new Date().toLocaleString('es-CO'),
      description: description || (type === 'consignacion' ? 'Consignación' : 'Retiro')
    });

    res.json({ transaction: tx, account });
  } catch (err) {
    console.error('MYSQL createTransaction:', err);
    res.status(500).json({ error: 'Error en transacción' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { accountId, userId, role } = req.query;
    const { Account: AccountModel } = require('../models_sql');

    let where = {};

    if (accountId) {
      where.accountId = accountId;
      
      // Verificar que el usuario solo pueda ver transacciones de sus cuentas (excepto admin)
      if (role !== 'admin') {
        const account = await AccountModel.findByPk(accountId);
        if (!account || account.userId !== userId) {
          return res.status(403).json({ error: 'No autorizado' });
        }
      }
    }

    if (role !== 'admin' && userId && !accountId) {
      const accounts = await AccountModel.findAll({ where: { userId }, attributes: ['id'] });
      const ids = accounts.map(a => a.id);
      if (ids.length === 0) return res.json([]);
      where.accountId = ids;
    }

    const txs = await Transaction.findAll({
      where,
      order: [['id', 'DESC']],
      raw: true
    });

    res.json(txs);
  } catch (err) {
    console.error('MYSQL getTransactions:', err);
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { txId } = req.params;
    const { description } = req.body;
    const { userId: requestUserId, role: requestRole } = req.query;

    const tx = await Transaction.findByPk(txId);
    if (!tx) return res.status(404).json({ error: 'Transacción no encontrada' });

    // Verificar que el usuario solo pueda actualizar transacciones de sus cuentas (excepto admin)
    if (requestRole !== 'admin') {
      const account = await Account.findByPk(tx.accountId);
      if (!account || account.userId !== requestUserId) {
        return res.status(403).json({ error: 'No autorizado. Solo puedes actualizar transacciones de tus propias cuentas.' });
      }
    }

    tx.description = description || tx.description;
    await tx.save();
    res.json(tx);
  } catch (err) {
    console.error('MYSQL updateTransaction:', err);
    res.status(500).json({ error: 'Error al actualizar transacción' });
  }
};