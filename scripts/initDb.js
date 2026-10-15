require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function inicializarBaseDatos() {
  console.log('Inicializando base de datos MySQL...');

  const host = process.env.DB_HOST || 'localhost';
  const puerto = Number(process.env.DB_PORT) || 3306;
  const usuario = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  let conexion;
  try {
    conexion = await mysql.createConnection({
      host,
      port: puerto,
      user: usuario,
      password,
      multipleStatements: true
    });

    const rutaEsquema = path.join(__dirname, '..', 'database', 'schema.sql');
    const sql = fs.readFileSync(rutaEsquema, 'utf8');

    console.log(`Ejecutando script DDL y datos semilla desde: ${rutaEsquema}`);
    await conexion.query(sql);

    console.log('Base de datos inicializada y poblada con exito.');
  } catch (error) {
    console.error('Error inicializando la base de datos:', error.message);
    process.exit(1);
  } finally {
    if (conexion) {
      await conexion.end();
    }
  }
}

inicializarBaseDatos();
