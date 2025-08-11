// test-connection.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  try {
    const conn = await mysql.createConnection({
      host: 'auth-db1604.hstgr.io',
      port: 3306,
      user: 'u612688719_barberhub',
      password: 'NfNd0893',
      database: 'u612688719_barberhub'
    });
    console.log('✅ Conexión exitosa a MySQL');
    await conn.end();
  } catch (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
  }
}

main();
