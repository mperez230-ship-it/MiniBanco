// backend/routes_sql/accountRoutes.js
const express = require('express');
const router = express.Router();
const accountController = require('../controllers_sql/accountController');

// Todas las rutas requieren userId y role en query params
router.post('/', accountController.createAccount);        // ?userId=...&role=...
router.get('/', accountController.getAccounts);           // ?userId=...&role=...
router.put('/:accountId', accountController.updateAccount); // ?userId=...&role=...
router.delete('/:accountId', accountController.deleteAccount); // ?userId=...&role=... (solo admin)

module.exports = router;