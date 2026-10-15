require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function inicializarBaseDatos() {
  const esPrueba = process.argv.includes('--test') || process.env.NODE_ENV === 'test';
  const nombreBaseDatos = esPrueba
    ? (process.env.DB_NAME_TEST || 'sistema_reservas_test')
    : (process.env.DB_NAME || 'sistema_reservas');

  console.log(`Inicializando base de datos MySQL [${nombreBaseDatos}]...`);

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

    await conexion.query(
      `CREATE DATABASE IF NOT EXISTS \`${nombreBaseDatos}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await conexion.query(`USE \`${nombreBaseDatos}\`;`);

    const rutaEsquema = path.join(__dirname, '..', 'database', 'schema.sql');
    const sql = fs.readFileSync(rutaEsquema, 'utf8');

    console.log(`Ejecutando script DDL y datos semilla en [${nombreBaseDatos}] desde: ${rutaEsquema}`);
    await conexion.query(sql);

    console.log(`Base de datos [${nombreBaseDatos}] inicializada y poblada con exito.`);
  } catch (error) {
    console.error(`Error inicializando la base de datos [${nombreBaseDatos}]:`, error.message);
    process.exit(1);
  } finally {
    if (conexion) {
      await conexion.end();
    }
  }
}

inicializarBaseDatos();
