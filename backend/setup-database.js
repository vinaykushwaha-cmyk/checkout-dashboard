require('dotenv').config();
const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  try {
    console.log('Checking if checkout_dashboard table exists...');

    // Check if table exists
    const [tables] = await pool.execute(
      "SHOW TABLES LIKE 'checkout_dashboard'"
    );

    if (tables.length === 0) {
      console.log('Table does not exist. Creating checkout_dashboard table...');

      // Create table
      await pool.execute(`
        CREATE TABLE checkout_dashboard (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      console.log('✅ Table created successfully!');

      // Create test user with hashed password
      const testPassword = 'password123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(testPassword, salt);

      await pool.execute(
        'INSERT INTO checkout_dashboard (email, password, name) VALUES (?, ?, ?)',
        ['test@example.com', hashedPassword, 'Test User']
      );

      console.log('✅ Test user created!');
      console.log('   Email: test@example.com');
      console.log('   Password: password123');

    } else {
      console.log('✅ Table already exists!');

      // Show table structure
      const [columns] = await pool.execute('DESCRIBE checkout_dashboard');
      console.log('\nTable structure:');
      columns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type})`);
      });

      // Count users
      const [count] = await pool.execute('SELECT COUNT(*) as count FROM checkout_dashboard');
      console.log(`\nTotal users: ${count[0].count}`);
    }

    await pool.end();
    console.log('\n✅ Database setup complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupDatabase();
