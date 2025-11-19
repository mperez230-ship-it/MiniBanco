// backend/soapService.js
const soap = require('soap');
const fs = require('fs');
const path = require('path');

module.exports = function attachSoap(server) {
  const service = {
    MiniBancoService: {
      MiniBancoPort: {
        GetBalance(args) {
          const balance = 1500.75; // ejemplo
          console.log('[SOAP] GetBalance llamado:', args);
          return { balance };
        },
        Transfer(args) {
          console.log('[SOAP] Transfer llamado:', args);
          return { success: true, message: `Transferencia exitosa de ${args.amount} a ${args.to}` };
        }
      }
    }
  };

  const xmlPath = path.join(__dirname, 'Minibanco.wsdl');
  if (!fs.existsSync(xmlPath)) {
    console.warn('[SOAP] WSDL no encontrado en', xmlPath);
    return;
  }
  const xml = fs.readFileSync(xmlPath, 'utf8');
  const soapPath = '/wsdl';
  soap.listen(server, soapPath, service, xml);
  console.log(`[SOAP] Servicio SOAP disponible en http://localhost:3001${soapPath}?wsdl`);
};