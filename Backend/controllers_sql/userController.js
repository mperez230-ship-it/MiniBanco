// backend/controllers_sql/userController.js
const bcrypt = require('bcryptjs');
const { User, Account } = require('../models_sql');

const SALT_ROUNDS = 10;

// Crear usuario admin por defecto si no existe
async function createAdminIfNotExists() {
  try {
    const adminExists = await User.findByPk('admin');
    if (!adminExists) {
      const hash = await bcrypt.hash('admin123', SALT_ROUNDS);
      await User.create({ 
        id: 'admin', 
        name: 'Administrador', 
        password: hash, 
        role: 'admin' 
      });
      console.log('✅ Usuario admin creado: ID=admin, Password=admin123');
    }
  } catch (err) {
    console.error('Error creando admin:', err);
  }
}

// Llamar al iniciar
createAdminIfNotExists();

exports.createUser = async (req, res) => {
  try {
    const { id, name, password, role } = req.body;
    if (!id || !name || !password) return res.status(400).json({ error: 'Faltan datos' });

    const exists = await User.findByPk(id);
    if (exists) return res.status(409).json({ error: 'Usuario ya existe' });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    // Solo admin puede crear otros admins
    const finalRole = (role === 'admin' && req.query.role === 'admin') ? 'admin' : 'user';
    
    const user = await User.create({ id, name, password: hash, role: finalRole });

    const userObj = user.toJSON(); 
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    console.error('MYSQL createUser:', err);
    res.status(500).json({ error: 'Error interno al crear usuario' });
  }
};

exports.login = async (req, res) => {
  try {
    const { id, password } = req.body;
    if (!id || !password) return res.status(400).json({ error: 'Faltan credenciales' });

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const userObj = user.toJSON(); 
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    console.error('MYSQL login:', err);
    res.status(500).json({ error: 'Error interno en login' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    if (role !== 'admin') return res.status(403).json({ error: 'No autorizado. Solo admin.' });

    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    res.json(users);
  } catch (err) {
    console.error('MYSQL getUsers:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, role } = req.body;
    const { role: requestRole, userId: requestUserId } = req.query;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Solo admin puede actualizar otros usuarios o cambiar roles
    if (requestRole !== 'admin' && userId !== requestUserId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    user.name = name || user.name;
    
    // Solo admin puede cambiar roles
    if (role && requestRole === 'admin') {
      user.role = role;
    }
    
    await user.save();

    const obj = user.toJSON(); 
    delete obj.password;
    res.json(obj);
  } catch (err) {
    console.error('MYSQL updateUser:', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role: requestRole } = req.query;

    // Solo admin puede eliminar usuarios
    if (requestRole !== 'admin') {
      return res.status(403).json({ error: 'No autorizado. Solo admin puede eliminar usuarios.' });
    }

    // No se puede eliminar el admin principal
    if (userId === 'admin') {
      return res.status(403).json({ error: 'No se puede eliminar el usuario admin principal' });
    }

    const deleted = await User.destroy({ where: { id: userId } });
    if (!deleted) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    // Eliminar todas las cuentas del usuario
    await Account.destroy({ where: { userId } });
    
    res.json({ ok: true });
  } catch (err) {
    console.error('MYSQL deleteUser:', err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};
