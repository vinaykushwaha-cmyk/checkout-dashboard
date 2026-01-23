require('dotenv').config();
const { pool } = require('./config/database');

async function exploreTables() {
  try {
    console.log('Exploring checkout database tables...\n');

    // Get list of tables
    const [tables] = await pool.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'checkout'"
    );
    console.log('Tables in checkout database:');
    tables.forEach(t => console.log(`  - ${t.TABLE_NAME}`));

    // Explore key tables
    const tablesToExplore = [
      'appypie_country',
      'appypie_addon_plan',
      'appypie_charge_refund',
      'appypie_billing_address',
      'appypie_subscription',
      'appypie_plan',
      'appypie_pricing'
    ];

    for (const table of tablesToExplore) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Table: ${table}`);
      console.log('='.repeat(60));

      try {
        // Get column info
        const [columns] = await pool.execute(
          `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
           FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = 'checkout' AND TABLE_NAME = ?`,
          [table]
        );
        console.log('\nColumns:');
        columns.forEach(c => {
          console.log(`  ${c.COLUMN_NAME} (${c.DATA_TYPE})${c.COLUMN_KEY === 'PRI' ? ' [PRIMARY KEY]' : ''}`);
        });

        // Get sample data
        const [sample] = await pool.execute(`SELECT * FROM checkout.${table} LIMIT 3`);
        console.log('\nSample data:');
        if (sample.length > 0) {
          console.log(JSON.stringify(sample, null, 2));
        } else {
          console.log('  (No data)');
        }

        // Get count
        const [count] = await pool.execute(`SELECT COUNT(*) as count FROM checkout.${table}`);
        console.log(`\nTotal records: ${count[0].count}`);
      } catch (err) {
        console.log(`  Error: ${err.message}`);
      }
    }

    // Also check appypie_payment_log structure
    console.log(`\n${'='.repeat(60)}`);
    console.log('Table: appypie_payment_log (key columns)');
    console.log('='.repeat(60));

    const [paymentColumns] = await pool.execute(
      `SELECT COLUMN_NAME, DATA_TYPE
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = 'checkout' AND TABLE_NAME = 'appypie_payment_log'`
    );
    console.log('\nAll columns:');
    paymentColumns.forEach(c => console.log(`  ${c.COLUMN_NAME} (${c.DATA_TYPE})`));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

exploreTables();
