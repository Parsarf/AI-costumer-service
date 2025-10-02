const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const logger = require('../src/utils/logger');

const prisma = new PrismaClient();

/**
 * Run database migrations
 */
async function runMigrations() {
  try {
    logger.info('Starting database migrations...');

    // Create migrations table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Get list of migration files
    const migrationsDir = path.join(__dirname);
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    logger.info(`Found ${migrationFiles.length} migration files`);

    // Get already executed migrations
    const executedMigrations = await prisma.$queryRaw`
      SELECT filename FROM migrations ORDER BY id
    `;
    const executedFilenames = executedMigrations.map(m => m.filename);

    let executed = 0;
    let skipped = 0;

    for (const filename of migrationFiles) {
      if (executedFilenames.includes(filename)) {
        logger.info(`Skipping already executed migration: ${filename}`);
        skipped++;
        continue;
      }

      try {
        logger.info(`Executing migration: ${filename}`);
        
        const migrationPath = path.join(migrationsDir, filename);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute migration
        await prisma.$executeRawUnsafe(migrationSQL);

        // Record migration as executed
        await prisma.$executeRaw`
          INSERT INTO migrations (filename) VALUES (${filename})
        `;

        logger.info(`Migration executed successfully: ${filename}`);
        executed++;

      } catch (error) {
        logger.error(`Error executing migration ${filename}:`, error);
        throw error;
      }
    }

    logger.info('Database migrations completed', { executed, skipped });

    // Generate Prisma client
    logger.info('Generating Prisma client...');
    const { execSync } = require('child_process');
    execSync('npx prisma generate', { stdio: 'inherit' });
    logger.info('Prisma client generated successfully');

  } catch (error) {
    logger.error('Migration error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Check migration status
 */
async function checkMigrationStatus() {
  try {
    const migrations = await prisma.$queryRaw`
      SELECT filename, executed_at FROM migrations ORDER BY executed_at
    `;
    
    logger.info('Migration status:', migrations);
    return migrations;
  } catch (error) {
    logger.error('Error checking migration status:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migrations if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'status') {
    checkMigrationStatus()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    runMigrations()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

module.exports = {
  runMigrations,
  checkMigrationStatus
};
