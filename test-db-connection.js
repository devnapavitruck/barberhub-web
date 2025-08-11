// test-db-connection.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  try {
    const conn = await mysql.createConnection(process.env.DATABASE_URL + '?ssl=false');
    console.log('✅ Conexión exitosa a MySQL');
    await conn.end();
  } catch (err) {
    console.error('❌ Error al conectar a MySQL:', err.message);
  }
})();
