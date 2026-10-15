require('dotenv').config();
const mysql = require('mysql2/promise');

const esEntornoPrueba = process.env.NODE_ENV === 'test';
const baseDatosDesarrollo = process.env.DB_NAME || 'sistema_reservas';
const baseDatosPrueba = process.env.DB_NAME_TEST || 'sistema_reservas_test';

const nombreBaseDatos = esEntornoPrueba ? baseDatosPrueba : baseDatosDesarrollo;

// Salvaguarda: impide ejecutar pruebas o scripts destructivos sobre la base principal
if (esEntornoPrueba && nombreBaseDatos === baseDatosDesarrollo) {
  throw new Error('Configuracion invalida: las pruebas exigen una base de datos MySQL exclusiva y separada.');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: nombreBaseDatos,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

module.exports = pool;
