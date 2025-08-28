// Test remote database connection with the correct hostname
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('🔍 Testing connection to: horizon.server.gb.net');
    
    const connection = await mysql.createConnection({
      host: 'horizon.server.gb.net',
      port: 3306,
      user: 'freemdcat_freemdcat',
      password: 'YOUR_PASSWORD', // Replace with your actual password
      database: 'freemdcat_studyplanner123',
      connectTimeout: 10000, // 10 second timeout
      acquireTimeout: 10000
    });
    
    console.log('✅ SUCCESS! Connected to horizon.server.gb.net');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Found ${rows[0].count} users in the database`);
    
    await connection.end();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔑 Check your username and password');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('🌐 Check your hostname and port');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('🗄️ Check your database name');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⏰ Connection timed out');
    }
  }
}

testConnection();
