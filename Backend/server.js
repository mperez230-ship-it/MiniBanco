// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

// Sync DB + modelos
const { syncDatabase } = require('./models_sql');

// Rutas SQL
const userRoutes = require('./routes_sql/userRoutes');
const accountRoutes = require('./routes_sql/accountRoutes');
const transactionRoutes = require('./routes_sql/transactionRoutes');
const externalRoutes = require('./routes_sql/externalRoutes');

// SOAP
const attachSoap = require('./soapService');

const app = express();
app.use(express.json());

// 🔥 CORS: permitir todos los orígenes (necesario para Render)
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true
}));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Sincronizar MySQL
syncDatabase();

// Rutas API
app.post('/api/login', require('./controllers_sql/userController').login);

app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/external', externalRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    ok: true,
    app: 'MiniBanco API - SQL Version',
    version: '2.0',
    endpoints: {
      login: '/api/login',
      users: '/api/users',
      accounts: '/api/accounts',
      transactions: '/api/transactions',
      rates: '/api/external/rates',
      soap_add: '/api/external/add',
      wsdl: '/wsdl?wsdl'
    }
  });
});

// Error global
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Servidor HTTP + SOAP
const server = http.createServer(app);
attachSoap(server);

// Puerto dinámico (Render)
const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MiniBanco SQL running on port ${PORT}`);
  console.log(`📊 Health check: /health`);
  console.log(`📋 API Base: /api`);
});
