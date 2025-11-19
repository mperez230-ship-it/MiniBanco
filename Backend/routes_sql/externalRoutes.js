const express = require('express');
const router = express.Router();
const { fetchExchangeRates, addWithSoap } = require('../externalConsumer');

/**
 * GET /api/external/rates?base=USD
 * Retorna tasas de cambio de una moneda base
 */
router.get('/rates', async (req, res) => {
  try {
    const base = req.query.base || 'USD';
    const data = await fetchExchangeRates(base);
    res.json(data);
  } catch (err) {
    console.error('[externalRoutes] /rates error:', err);
    res.status(500).json({ error: err.message || 'Error servicio REST' });
  }
});

/**
 * GET /api/external/add?a=5&b=7
 * Retorna la suma de a + b usando SOAP externo
 */
router.get('/add', async (req, res) => {
  try {
    const a = parseInt(req.query.a) || 0;
    const b = parseInt(req.query.b) || 0;
    const data = await addWithSoap(a, b);
    res.json(data);
  } catch (err) {
    console.error('[externalRoutes] /add error:', err);
    res.status(500).json({ error: err.message || 'Error servicio SOAP' });
  }
});

module.exports = router;
