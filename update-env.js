// Update .env file with correct DATABASE_URL
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = `# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

# Database Connection (SQLite for local development)
DATABASE_URL="file:./dev.db"
`;

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file updated successfully with DATABASE_URL="file:./dev.db"');
} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
}
