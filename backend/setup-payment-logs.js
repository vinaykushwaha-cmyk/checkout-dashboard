const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupPaymentLogsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '192.168.2.2',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'checkout'
  });

  console.log('Connected to database');

  try {
    // Create appypie_payment_log table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS checkout.appypie_payment_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        app_id VARCHAR(100),
        app_name VARCHAR(255),
        email VARCHAR(255),
        message TEXT,
        payment_period VARCHAR(50),
        amount DECIMAL(10, 2),
        currency VARCHAR(10) DEFAULT 'USD',
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        invoice_id VARCHAR(100),
        transaction_id VARCHAR(255),
        payment_mode VARCHAR(50),
        payment_source VARCHAR(50),
        device_selection VARCHAR(20),
        refund_status VARCHAR(20) DEFAULT 'No',
        ip_address VARCHAR(50),
        payment_date DATETIME,
        claim_to VARCHAR(100),
        subscription_type VARCHAR(50),
        product_name VARCHAR(255),
        product_id VARCHAR(100),
        addon_id INT,
        addon_name VARCHAR(255),
        language VARCHAR(10) DEFAULT 'en',
        claimed_user VARCHAR(100),
        signed_agreement VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_app_id (app_id),
        INDEX idx_transaction_id (transaction_id),
        INDEX idx_payment_date (payment_date),
        INDEX idx_subscription_type (subscription_type),
        INDEX idx_product_id (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createTableQuery);
    console.log('Table appypie_payment_log created or already exists');

    // Create appypie_addon table if it doesn't exist
    const createAddonTableQuery = `
      CREATE TABLE IF NOT EXISTS checkout.appypie_addon (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2),
        status TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createAddonTableQuery);
    console.log('Table appypie_addon created or already exists');

    // Insert sample addons if table is empty
    const [addonCount] = await connection.execute('SELECT COUNT(*) as count FROM checkout.appypie_addon');
    if (addonCount[0].count === 0) {
      const insertAddonsQuery = `
        INSERT INTO checkout.appypie_addon (name, description, price, status) VALUES
        ('Premium Support', '24/7 Premium Support', 49.99, 1),
        ('Extra Storage', '100GB Additional Storage', 29.99, 1),
        ('API Access', 'Full API Access', 99.99, 1),
        ('White Label', 'White Label Branding', 149.99, 1),
        ('Analytics Pro', 'Advanced Analytics Dashboard', 79.99, 1)
      `;
      await connection.execute(insertAddonsQuery);
      console.log('Sample addons inserted');
    }

    // Insert sample payment logs if table is empty
    const [paymentCount] = await connection.execute('SELECT COUNT(*) as count FROM checkout.appypie_payment_log');
    if (paymentCount[0].count === 0) {
      const sampleData = generateSampleData();

      for (const data of sampleData) {
        const insertQuery = `
          INSERT INTO checkout.appypie_payment_log
          (app_id, app_name, email, message, payment_period, amount, currency, tax_amount,
           invoice_id, transaction_id, payment_mode, payment_source, device_selection,
           refund_status, ip_address, payment_date, claim_to, subscription_type,
           product_name, product_id, addon_name, language, signed_agreement)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.execute(insertQuery, [
          data.app_id, data.app_name, data.email, data.message, data.payment_period,
          data.amount, data.currency, data.tax_amount, data.invoice_id, data.transaction_id,
          data.payment_mode, data.payment_source, data.device_selection, data.refund_status,
          data.ip_address, data.payment_date, data.claim_to, data.subscription_type,
          data.product_name, data.product_id, data.addon_name, data.language, data.signed_agreement
        ]);
      }
      console.log(`${sampleData.length} sample payment logs inserted`);
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await connection.end();
  }
}

function generateSampleData() {
  const appNames = ['Appy Pie App', 'Design Studio', 'Chatbot Builder', 'Website Builder', 'Form Builder'];
  const subscriptionTypes = ['trial', 'upgrade', 'renewal'];
  const paymentModes = ['stripe', 'paypal', 'razorpay', 'ccavenue', 'ebanx'];
  const paymentSources = ['web', 'Manual', 'ios', 'android'];
  const periods = ['monthly', 'yearly', 'lifetime'];
  const currencies = ['USD', 'AUD', 'EUR', 'GBP', 'INR'];

  const sampleData = [];

  for (let i = 0; i < 50; i++) {
    const subscriptionType = subscriptionTypes[Math.floor(Math.random() * subscriptionTypes.length)];
    const amount = subscriptionType === 'trial' ? 16 : Math.floor(Math.random() * 300) + 36;
    const appIndex = Math.floor(Math.random() * appNames.length);

    sampleData.push({
      app_id: `${Math.random().toString(36).substring(2, 12)}`,
      app_name: appNames[appIndex],
      email: `user${i + 1}@example.com`,
      message: `${subscriptionType === 'renewal' ? 'Renewal' : subscriptionType === 'upgrade' ? 'Upgrade' : ''} subscription for ${appNames[appIndex]} ${periods[Math.floor(Math.random() * periods.length)]} Plan - ${Math.random().toString(36).substring(2, 8)}`,
      payment_period: periods[Math.floor(Math.random() * periods.length)],
      amount: amount,
      currency: currencies[Math.floor(Math.random() * currencies.length)],
      tax_amount: 0,
      invoice_id: `C${387340 + i}`,
      transaction_id: `ch_${Math.random().toString(36).substring(2, 30)}`,
      payment_mode: paymentModes[Math.floor(Math.random() * paymentModes.length)],
      payment_source: paymentSources[Math.floor(Math.random() * paymentSources.length)],
      device_selection: Math.random() > 0.7 ? 'mobile' : 'desktop',
      refund_status: 'No',
      ip_address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      payment_date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
      claim_to: Math.random() > 0.8 ? null : null,
      subscription_type: subscriptionType,
      product_name: appNames[appIndex],
      product_id: `prod_${appIndex + 1}`,
      addon_name: Math.random() > 0.7 ? 'Premium Support' : null,
      language: 'en',
      signed_agreement: Math.random() > 0.5 ? 'signed_agreement.pdf' : null
    });
  }

  return sampleData;
}

// Run the setup
setupPaymentLogsTable();
