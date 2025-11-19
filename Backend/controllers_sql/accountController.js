// backend/controllers_sql/accountController.js
const { Account, Transaction } = require('../models_sql');

exports.createAccount = async (req, res) => {
  try {
    const { id, type, balance = 0, userId, createdAt } = req.body;
    const { userId: requestUserId, role: requestRole } = req.query;

    if (!id || !type || !userId) return res.status(400).json({ error: 'Faltan datos de cuenta' });

    // Verificar que el usuario solo pueda crear cuentas para sí mismo (excepto admin)
    if (requestRole !== 'admin' && userId !== requestUserId) {
      return res.status(403).json({ error: 'No autorizado. Solo puedes crear cuentas para ti mismo.' });
    }

    const exists = await Account.findByPk(id);
    if (exists) return res.status(409).json({ error: 'La cuenta ya existe' });

    const account = await Account.create({ 
      id, 
      type, 
      balance, 
      userId, 
      createdAtText: createdAt || new Date().toLocaleString('es-CO') 
    });

    if (balance > 0) {
      await Transaction.create({
        id: Date.now(),
        accountId: account.id,
        type: 'consignacion',
        amount: balance,
        date: new Date().toLocaleString('es-CO'),
        description: 'Depósito inicial'
      });
    }

    res.json(account);
  } catch (err) {
    console.error('MYSQL createAccount:', err);
    res.status(500).json({ error: 'Error al crear cuenta' });
  }
};

exports.getAccounts = async (req, res) => {
  try {
    const { userId, role } = req.query;
    
    // Admin ve todas las cuentas, usuarios normales solo ven las suyas
    const filter = (role === 'admin' || !userId) ? {} : { userId };
    const accounts = await Account.findAll({ where: filter, raw: true });
    res.json(accounts);
  } catch (err) {
    console.error('MYSQL getAccounts:', err);
    res.status(500).json({ error: 'Error al obtener cuentas' });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { type } = req.body;
    const { userId: requestUserId, role: requestRole } = req.query;

    const account = await Account.findByPk(accountId);
    if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });

    // Verificar que el usuario solo pueda actualizar sus propias cuentas (excepto admin)
    if (requestRole !== 'admin' && account.userId !== requestUserId) {
      return res.status(403).json({ error: 'No autorizado. Solo puedes actualizar tus propias cuentas.' });
    }

    account.type = type || account.type;
    await account.save();
    res.json(account);
  } catch (err) {
    console.error('MYSQL updateAccount:', err);
    res.status(500).json({ error: 'Error al actualizar cuenta' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { userId: requestUserId, role: requestRole } = req.query;

    const account = await Account.findByPk(accountId);
    if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });

    // SOLO ADMIN puede eliminar cuentas
    if (requestRole !== 'admin') {
      return res.status(403).json({ error: 'No autorizado. Solo el administrador puede eliminar cuentas.' });
    }

    await Account.destroy({ where: { id: accountId } });
    await Transaction.destroy({ where: { accountId } });
    
    res.json({ ok: true, message: 'Cuenta eliminada correctamente' });
  } catch (err) {
    console.error('MYSQL deleteAccount:', err);
    res.status(500).json({ error: 'Error al eliminar cuenta' });
  }
};