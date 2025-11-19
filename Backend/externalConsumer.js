const axios = require('axios');
const soap = require('soap');

/**
 * Obtener tasas de cambio REST
 * @param {string} base - Moneda base (ej: 'USD')
 * @returns {Promise<Object>} - { success, provider, base, date, rates }
 */
async function fetchExchangeRates(base = 'USD') {
  try {
    const res = await axios.get('https://api.frankfurter.app/latest', { params: { base } });
    return {
      success: true,
      provider: 'Frankfurter',
      base: res.data.base,
      date: res.data.date,
      rates: res.data.rates
    };
  } catch (err) {
    console.error('[externalConsumer] Error REST:', err.message);
    throw new Error('No se pudo obtener las tasas externas');
  }
}

/**
 * Suma mediante SOAP externo
 * @param {number} a 
 * @param {number} b 
 * @returns {Promise<Object>} - { result: number }
 */
async function addWithSoap(a = 0, b = 0) {
  try {
    const wsdl = 'http://www.dneonline.com/calculator.asmx?WSDL';
    const client = await soap.createClientAsync(wsdl);
    const [result] = await client.AddAsync({ intA: a, intB: b });
    return { result: parseInt(result.AddResult, 10) };
  } catch (err) {
    console.error('[externalConsumer] Error SOAP:', err.message);
    throw new Error('Error en servicio SOAP');
  }
}

module.exports = { fetchExchangeRates, addWithSoap };
