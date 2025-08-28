// Test different MySQL ports on your server
const mysql = require('mysql2/promise');

const ports = [3306, 3307, 33060, 33061, 33062];

async function testPort(port) {
  try {
    console.log(`🔍 Testing port ${port} on horizon.server.gb.net...`);
    
    const connection = await mysql.createConnection({
      host: 'horizon.server.gb.net',
      port: port,
      user: 'freemdcat_freemdcat',
      password: 'YOUR_PASSWORD', // Replace with your actual password
      database: 'freemdcat_studyplanner123',
      connectTimeout: 5000, // 5 second timeout
    });
    
    console.log(`✅ SUCCESS! Port ${port} is open and working!`);
    
    await connection.end();
    return port;
    
  } catch (error) {
    if (error.code === 'ETIMEDOUT') {
      console.log(`❌ Port ${port}: Connection timed out (blocked)`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`❌ Port ${port}: Connection refused (not listening)`);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log(`✅ Port ${port}: Port is open but authentication failed (good sign!)`);
      return port;
    } else {
      console.log(`❌ Port ${port}: ${error.code} - ${error.message}`);
    }
    return null;
  }
}

async function testAllPorts() {
  console.log('🚀 Testing different MySQL ports...\n');
  
  for (const port of ports) {
    const result = await testPort(port);
    if (result) {
      console.log(`\n🎉 SUCCESS! Use port ${result} for your connection!`);
      return result;
    }
    console.log(''); // Empty line for readability
  }
  
  console.log('\n❌ All ports failed. We need to find alternative connection methods.');
}

testAllPorts();
