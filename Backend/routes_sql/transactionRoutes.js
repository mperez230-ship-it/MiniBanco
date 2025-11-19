// backend/routes_sql/transactionRoutes.js
const express = require('express');
const router = express.Router();
const txController = require('../controllers_sql/transactionController');

// Todas las rutas requieren userId y role en query params
router.post('/', txController.createTransaction);      // ?userId=...&role=...
router.get('/', txController.getTransactions);         // ?userId=...&role=...
router.put('/:txId', txController.updateTransaction);  // ?userId=...&role=...

module.exports = router;