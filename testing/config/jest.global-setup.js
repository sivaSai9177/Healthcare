// Global setup for integration tests
require('dotenv').config({ path: '.env.test' });

module.exports = async () => {

  // Check if database is available
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {

    process.env.SKIP_DB_TESTS = 'true';
  } else {

    // You could add database migrations here if needed
    // await runMigrations();
  }
  
  // Set test environment flag
  process.env.NODE_ENV = 'test';
  process.env.IS_TEST = 'true';
};