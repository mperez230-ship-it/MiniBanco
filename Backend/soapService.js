const soap = require('soap');
const fs = require('fs');
const path = require('path');

/**
 * attachSoap(server)
 *
 * - Lee backend/Minibanco.wsdl
 * - Espera a que el servidor HTTP esté "listening" para conocer el puerto/host
 * - Reescribe la <soap:address location="..."/> del WSDL para exponer la URL pública correcta
 *   (usa process.env.SOAP_PUBLIC_URL si está definida; si no, usa tu dominio Render por defecto)
 * - Monta el servicio SOAP en /wsdl
 *
 * Nota: tu dominio Render: https://minibanco-x5nd.onrender.com
 */
module.exports = function attachSoap(server) {
  const service = {
    MiniBancoService: {
      MiniBancoPort: {
        GetBalance(args) {
          const balance = 1500.75; // ejemplo - reemplaza por lógica real si hace falta
          console.log('[SOAP] GetBalance llamado:', args);
          // Debe coincidir con <part name="balance" type="xsd:float"/> en el WSDL
          return { balance };
        },
        Transfer(args) {
          console.log('[SOAP] Transfer llamado:', args);
          // validar args.amount, args.to antes de operar en producción
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

  const rawXml = fs.readFileSync(xmlPath, 'utf8');

  function startSoap() {
    try {
      // Determinar puerto/host del server
      const addr = server.address && server.address();
      const port = (addr && addr.port) ? addr.port : process.env.PORT || 3001;

      // Priorizar variable de entorno, si no existe usar tu dominio Render (proporcionado)
      const publicBase = (process.env.SOAP_PUBLIC_URL && process.env.SOAP_PUBLIC_URL.trim() !== '')
        ? process.env.SOAP_PUBLIC_URL.replace(/\/$/, '')
        : 'https://minibanco-x5nd.onrender.com';

      const wsdlBase = publicBase; // ya sin slash final
      const wsdlUrl = `${wsdlBase}/wsdl`;

      // Reemplazar la soap:address en el WSDL por la URL pública detectada
      const modifiedXml = rawXml.replace(
        /<soap:address[^>]*location="[^"]*"\/?>/i,
        `<soap:address location="${wsdlUrl}"/>`
      );

      const soapPath = '/wsdl';
      soap.listen(server, soapPath, service, modifiedXml);

      console.log(`[SOAP] Servicio SOAP montado en ${soapPath}`);
      console.log(`[SOAP] WSDL disponible en ${wsdlUrl}?wsdl`);
    } catch (err) {
      console.error('[SOAP] Error al iniciar servicio SOAP:', err);
    }
  }

  // Si el server ya está escuchando, arrancamos; si no, esperamos al evento 'listening'
  try {
    const addr = server.address && server.address();
    if (addr && addr.port) {
      startSoap();
    } else {
      server.on('listening', startSoap);
    }
  } catch (err) {
    server.on('listening', startSoap);
  }
};
