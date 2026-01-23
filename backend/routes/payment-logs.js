const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Format timestamp to readable date
function formatTimestamp(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);
  const day = date.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${displayHours}:${minutes} ${ampm}`;
}

// Format label helper - capitalize first letter and handle special cases
function formatLabel(value) {
  if (!value) return '';
  const specialLabels = {
    'ios': 'iOS',
    'android': 'Android',
    'web': 'Web',
    'paypal': 'PayPal',
    'stripe': 'Stripe',
    'razorpay': 'Razorpay',
    'ccavenue': 'CCAvenue',
    'ebanx': 'Ebanx',
    'InApp-iOS': 'In-App (iOS)',
    'InApp-Android': 'In-App (Android)',
    'app': 'App',
    'Manual': 'Manual',
    'manually': 'Manual'
  };
  return specialLabels[value] || value.charAt(0).toUpperCase() + value.slice(1);
}

// Format period label helper
function formatPeriodLabel(value) {
  if (!value) return '';
  const periodLabels = {
    'monthly': 'Monthly',
    'yearly': 'Yearly',
    'oneTime': 'One Time',
    'lifetime': 'Lifetime',
    'quarterly': 'Quarterly',
    'half-yearly': 'Half Yearly',
    'weekly': 'Weekly'
  };
  return periodLabels[value] || value.charAt(0).toUpperCase() + value.slice(1);
}

// Country code to name mapping
const countryNames = {
  'ae': 'United Arab Emirates', 'ar': 'Argentina', 'at': 'Austria', 'au': 'Australia',
  'as': 'American Samoa', 'be': 'Belgium', 'br': 'Brazil', 'ca': 'Canada', 'ch': 'Switzerland',
  'cl': 'Chile', 'cn': 'China', 'co': 'Colombia', 'de': 'Germany', 'dk': 'Denmark',
  'es': 'Spain', 'fi': 'Finland', 'fr': 'France', 'gb': 'United Kingdom', 'gr': 'Greece',
  'hk': 'Hong Kong', 'id': 'Indonesia', 'ie': 'Ireland', 'il': 'Israel', 'in': 'India',
  'it': 'Italy', 'jp': 'Japan', 'kr': 'South Korea', 'mx': 'Mexico', 'my': 'Malaysia',
  'nl': 'Netherlands', 'no': 'Norway', 'nz': 'New Zealand', 'pe': 'Peru', 'ph': 'Philippines',
  'pk': 'Pakistan', 'pl': 'Poland', 'pt': 'Portugal', 'ro': 'Romania', 'ru': 'Russia',
  'sa': 'Saudi Arabia', 'se': 'Sweden', 'sg': 'Singapore', 'th': 'Thailand', 'tr': 'Turkey',
  'tw': 'Taiwan', 'ua': 'Ukraine', 'us': 'United States', 'vn': 'Vietnam', 'za': 'South Africa'
};

// Get payment logs with pagination, filters, and summary - ALL FROM DATABASE
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build filters from query params
    const filters = [];
    const filterParams = [];

    if (req.query.searchByAppId) {
      filters.push('(product_id LIKE ? OR order_id LIKE ?)');
      filterParams.push(`%${req.query.searchByAppId}%`, `%${req.query.searchByAppId}%`);
    }
    if (req.query.searchByAppIdOrTransaction) {
      filters.push('(product_id LIKE ? OR transaction_id LIKE ?)');
      filterParams.push(`%${req.query.searchByAppIdOrTransaction}%`, `%${req.query.searchByAppIdOrTransaction}%`);
    }
    if (req.query.searchDate) {
      const searchDate = new Date(req.query.searchDate);
      const startOfDay = Math.floor(searchDate.getTime() / 1000);
      const endOfDay = startOfDay + 86400;
      filters.push('addedon >= ? AND addedon < ?');
      filterParams.push(startOfDay, endOfDay);
    }
    if (req.query.subscriptionType) {
      const typeMap = { 'new': 1, 'trial': 1, 'renewal': 2, 'upgrade': 3 };
      const termValue = typeMap[req.query.subscriptionType.toLowerCase()];
      if (termValue) {
        filters.push('payment_terms = ?');
        filterParams.push(termValue);
      }
    }
    if (req.query.productId) {
      filters.push('product_name = ?');
      filterParams.push(req.query.productId);
    }
    if (req.query.subscriptionPeriod) {
      filters.push('subscription_period = ?');
      filterParams.push(req.query.subscriptionPeriod);
    }
    if (req.query.addons) {
      filters.push('addon_type LIKE ?');
      filterParams.push(`%${req.query.addons}%`);
    }
    if (req.query.paymentMode) {
      filters.push('payment_method = ?');
      filterParams.push(req.query.paymentMode);
    }
    if (req.query.paymentSource) {
      filters.push('payment_source = ?');
      filterParams.push(req.query.paymentSource);
    }
    if (req.query.claimedUser) {
      if (req.query.claimedUser === 'claimed') {
        filters.push('claim_user IS NOT NULL AND claim_user != ""');
      } else if (req.query.claimedUser === 'unclaimed') {
        filters.push('(claim_user IS NULL OR claim_user = "")');
      } else {
        filters.push('claim_user = ?');
        filterParams.push(req.query.claimedUser);
      }
    }
    if (req.query.language) {
      filters.push('payment_country = ?');
      filterParams.push(req.query.language);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    // Count total records from database
    const countQuery = `SELECT COUNT(*) as total FROM checkout.appypie_payment_log ${whereClause}`;
    const [countResult] = await pool.execute(countQuery, filterParams);
    const total = countResult[0].total;

    // Calculate summary from database
    const summaryQuery = `
      SELECT
        SUM(CASE WHEN payment_terms = 1 THEN 1 ELSE 0 END) as trial_count,
        SUM(CASE WHEN payment_terms = 1 THEN CAST(COALESCE(net_amount, plan_price, 0) AS DECIMAL(10,2)) ELSE 0 END) as trial_amount,
        SUM(CASE WHEN payment_terms = 3 THEN 1 ELSE 0 END) as upgrade_count,
        SUM(CASE WHEN payment_terms = 3 THEN CAST(COALESCE(net_amount, plan_price, 0) AS DECIMAL(10,2)) ELSE 0 END) as upgrade_amount,
        SUM(CASE WHEN payment_terms = 2 THEN 1 ELSE 0 END) as renewal_count,
        SUM(CASE WHEN payment_terms = 2 THEN CAST(COALESCE(net_amount, plan_price, 0) AS DECIMAL(10,2)) ELSE 0 END) as renewal_amount
      FROM checkout.appypie_payment_log ${whereClause}
    `;
    const [summaryResult] = await pool.execute(summaryQuery, filterParams);
    const summaryRow = summaryResult[0];

    const summary = {
      trial: {
        count: parseInt(summaryRow.trial_count) || 0,
        amount: parseFloat(summaryRow.trial_amount) || 0
      },
      upgrade: {
        count: parseInt(summaryRow.upgrade_count) || 0,
        amount: parseFloat(summaryRow.upgrade_amount) || 0
      },
      renewal: {
        count: parseInt(summaryRow.renewal_count) || 0,
        amount: parseFloat(summaryRow.renewal_amount) || 0
      },
      total: {
        count: (parseInt(summaryRow.trial_count) || 0) + (parseInt(summaryRow.upgrade_count) || 0) + (parseInt(summaryRow.renewal_count) || 0),
        amount: (parseFloat(summaryRow.trial_amount) || 0) + (parseFloat(summaryRow.upgrade_amount) || 0) + (parseFloat(summaryRow.renewal_amount) || 0)
      }
    };

    // Get paginated data from database
    const dataQuery = `
      SELECT
        id,
        product_id as app_id,
        product_name as app_name,
        user_id,
        description as message,
        subscription_period as payment_period,
        COALESCE(net_amount, plan_price) as amount,
        currency,
        tax_amount,
        invoice_id,
        transaction_id,
        payment_method as payment_mode,
        payment_source,
        'desktop' as device_selection,
        COALESCE(refund_status, 'No') as refund_status,
        ip_address,
        addedon as last_payment_date,
        claim_user as claim_to,
        CASE
          WHEN payment_terms = 1 THEN 'New'
          WHEN payment_terms = 2 THEN 'Renewal'
          WHEN payment_terms = 3 THEN 'Upgrade'
          ELSE customer_payment_type
        END as subscription_type,
        product_name,
        product_id,
        addon_type as addon_name,
        payment_country as language,
        claim_user as claimed_user,
        plan_id,
        coupon_code,
        discount_amount,
        CASE WHEN invoice_id IS NOT NULL AND invoice_id != '' THEN 1 ELSE 0 END as has_invoice,
        0 as has_signed_agreement
      FROM checkout.appypie_payment_log
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;

    const [dbLogs] = await pool.execute(dataQuery, [...filterParams, limit, offset]);

    // Fetch billing emails from appypie_billing_address
    const userIds = [...new Set(dbLogs.map(log => log.user_id))];
    let billingEmails = {};

    if (userIds.length > 0) {
      try {
        const [billingData] = await pool.execute(
          `SELECT user_id, product_id, email, first_name, last_name
           FROM checkout.appypie_billing_address
           WHERE user_id IN (${userIds.map(() => '?').join(',')})`,
          userIds
        );
        billingData.forEach(b => {
          billingEmails[`${b.user_id}_${b.product_id}`] = b;
        });
      } catch (e) {
        console.log('Could not fetch billing emails:', e.message);
      }
    }

    // Map payment logs with billing info
    const paymentLogs = dbLogs.map(log => {
      const billingInfo = billingEmails[`${log.user_id}_${log.app_id}`] || {};
      return {
        ...log,
        email: billingInfo.email || `user${log.user_id}@appypie.com`,
        customer_name: billingInfo.first_name && billingInfo.last_name
          ? `${billingInfo.first_name} ${billingInfo.last_name}`
          : null,
        last_payment_date: formatTimestamp(log.last_payment_date),
        has_invoice: Boolean(log.has_invoice),
        has_signed_agreement: Boolean(log.has_signed_agreement)
      };
    });

    res.json({
      success: true,
      data: paymentLogs,
      summary,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching payment logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment logs',
      error: error.message
    });
  }
});

// Get all filter options - ALL FROM DATABASE
router.get('/filters/all', async (req, res) => {
  try {
    let products = [];
    let plans = [];
    let addons = [];
    let subscriptionTypes = [];
    let paymentModes = [];
    let paymentSources = [];
    let subscriptionPeriods = [];
    let languages = [];
    let claimedUsers = [];
    let currencies = [];

    // 1. Fetch products from appypie_product table
    const [dbProducts] = await pool.execute(
      'SELECT id, name FROM checkout.appypie_product WHERE status = 1 ORDER BY name ASC'
    );
    products = dbProducts;

    // 2. Fetch plans from appypie_plan table
    const [dbPlans] = await pool.execute(
      'SELECT id, plan_name as name, identifire as identifier, product_name as productName FROM checkout.appypie_plan WHERE status = 1 ORDER BY sortorder ASC'
    );
    plans = dbPlans;

    // 3. Fetch addons from appypie_addon_plan table
    const [dbAddonPlans] = await pool.execute(
      'SELECT id, plan_name as name, identifire as identifier, product_name as productName FROM checkout.appypie_addon_plan WHERE status = 1 ORDER BY sortorder ASC'
    );
    if (dbAddonPlans.length > 0) {
      addons = dbAddonPlans;
    } else {
      // Fallback to addon_type from payment_log
      const [dbAddons] = await pool.execute(
        'SELECT DISTINCT addon_type as name FROM checkout.appypie_payment_log WHERE addon_type IS NOT NULL AND addon_type != "" ORDER BY addon_type ASC'
      );
      addons = dbAddons.map((a, index) => ({ id: index + 1, name: a.name }));
    }

    // 4. Fetch subscription types from payment_terms in payment_log
    const [dbTypes] = await pool.execute(
      'SELECT DISTINCT payment_terms FROM checkout.appypie_payment_log WHERE payment_terms IS NOT NULL ORDER BY payment_terms'
    );
    const typeLabels = { 1: 'New', 2: 'Renewal', 3: 'Upgrade' };
    const typeValues = { 1: 'new', 2: 'renewal', 3: 'upgrade' };
    subscriptionTypes = dbTypes.map(t => ({
      value: typeValues[t.payment_terms] || t.payment_terms.toString(),
      label: typeLabels[t.payment_terms] || `Type ${t.payment_terms}`
    }));

    // 5. Fetch payment modes from appypie_payment_log
    const [dbModes] = await pool.execute(
      'SELECT DISTINCT payment_method as value FROM checkout.appypie_payment_log WHERE payment_method IS NOT NULL AND payment_method != "" ORDER BY payment_method ASC'
    );
    paymentModes = dbModes.map(m => ({
      value: m.value,
      label: formatLabel(m.value)
    }));

    // 6. Fetch payment sources from appypie_payment_log
    const [dbSources] = await pool.execute(
      'SELECT DISTINCT payment_source as value FROM checkout.appypie_payment_log WHERE payment_source IS NOT NULL AND payment_source != "" ORDER BY payment_source ASC'
    );
    paymentSources = dbSources.map(s => ({
      value: s.value,
      label: formatLabel(s.value)
    }));

    // 7. Fetch subscription periods from appypie_pricing table
    const [dbPricingPeriods] = await pool.execute(
      'SELECT DISTINCT plan_period as value FROM checkout.appypie_pricing WHERE status = 1 ORDER BY plan_period ASC'
    );
    if (dbPricingPeriods.length > 0) {
      subscriptionPeriods = dbPricingPeriods.map(p => ({
        value: p.value,
        label: formatPeriodLabel(p.value)
      }));
    } else {
      // Fallback to payment_log
      const [dbPeriods] = await pool.execute(
        'SELECT DISTINCT subscription_period as value FROM checkout.appypie_payment_log WHERE subscription_period IS NOT NULL AND subscription_period != "" ORDER BY subscription_period ASC'
      );
      subscriptionPeriods = dbPeriods.map(p => ({
        value: p.value,
        label: formatPeriodLabel(p.value)
      }));
    }

    // 8. Fetch countries from appypie_country table
    const [dbCountries] = await pool.execute(
      'SELECT country as code, currencyCode, currencySign FROM checkout.appypie_country WHERE status = 1 ORDER BY sortOrder ASC'
    );

    // Get distinct payment_country values from payment_log
    const [usedCountries] = await pool.execute(
      'SELECT DISTINCT payment_country as value FROM checkout.appypie_payment_log WHERE payment_country IS NOT NULL AND payment_country != "" ORDER BY payment_country ASC'
    );

    // Create currency map from appypie_country
    const countryCurrencyMap = {};
    dbCountries.forEach(c => {
      const code = c.code.toLowerCase();
      countryCurrencyMap[code] = { currencyCode: c.currencyCode, currencySign: c.currencySign };
      countryCurrencyMap[code.toUpperCase()] = { currencyCode: c.currencyCode, currencySign: c.currencySign };
    });

    // Map used countries with currency info
    languages = usedCountries.map(c => {
      const code = c.value.toLowerCase();
      const currencyInfo = countryCurrencyMap[code] || countryCurrencyMap[c.value] || {};
      const countryName = countryNames[code] || countryNames[c.value] || c.value.toUpperCase();
      return {
        value: c.value,
        label: currencyInfo.currencyCode ? `${countryName} (${currencyInfo.currencyCode})` : countryName,
        currencyCode: currencyInfo.currencyCode || '',
        currencySign: currencyInfo.currencySign || ''
      };
    });

    // 9. Fetch currencies from appypie_country
    const uniqueCurrencies = [...new Set(dbCountries.map(c => c.currencyCode))];
    currencies = uniqueCurrencies.map(code => {
      const country = dbCountries.find(c => c.currencyCode === code);
      return {
        code: code,
        sign: country ? country.currencySign : ''
      };
    });

    // 10. Fetch claimed users from appypie_payment_log
    const [dbClaimedUsers] = await pool.execute(
      'SELECT DISTINCT claim_user as value FROM checkout.appypie_payment_log WHERE claim_user IS NOT NULL AND claim_user != "" ORDER BY claim_user ASC'
    );
    claimedUsers = [
      { value: 'claimed', label: 'All Claimed' },
      { value: 'unclaimed', label: 'Unclaimed' },
      ...dbClaimedUsers.map(u => ({
        value: u.value,
        label: u.value
      }))
    ];

    res.json({
      success: true,
      data: {
        products,
        plans,
        addons,
        subscriptionTypes,
        paymentModes,
        paymentSources,
        subscriptionPeriods,
        languages,
        claimedUsers,
        currencies
      }
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching filter options',
      error: error.message
    });
  }
});

// Get all products from appypie_product
router.get('/products/list', async (req, res) => {
  try {
    const [products] = await pool.execute(
      'SELECT id, name FROM checkout.appypie_product WHERE status = 1 ORDER BY name ASC'
    );
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Error fetching products', error: error.message });
  }
});

// Get all addons from appypie_addon_plan
router.get('/addons/list', async (req, res) => {
  try {
    const [addons] = await pool.execute(
      'SELECT id, plan_name as name FROM checkout.appypie_addon_plan WHERE status = 1 ORDER BY sortorder ASC'
    );
    if (addons.length > 0) {
      res.json({ success: true, data: addons });
    } else {
      // Fallback to payment_log addon_type
      const [dbAddons] = await pool.execute(
        'SELECT DISTINCT addon_type as name FROM checkout.appypie_payment_log WHERE addon_type IS NOT NULL AND addon_type != ""'
      );
      const formattedAddons = dbAddons.map((a, index) => ({ id: index + 1, name: a.name }));
      res.json({ success: true, data: formattedAddons });
    }
  } catch (error) {
    console.error('Error fetching addons:', error);
    res.status(500).json({ success: false, message: 'Error fetching addons', error: error.message });
  }
});

// Get subscription types from payment_log
router.get('/subscription-types/list', async (req, res) => {
  try {
    const [types] = await pool.execute(
      'SELECT DISTINCT payment_terms FROM checkout.appypie_payment_log WHERE payment_terms IS NOT NULL ORDER BY payment_terms'
    );
    const typeLabels = { 1: 'New', 2: 'Renewal', 3: 'Upgrade' };
    const typeValues = { 1: 'new', 2: 'renewal', 3: 'upgrade' };
    const formattedTypes = types.map(t => ({
      value: typeValues[t.payment_terms] || t.payment_terms.toString(),
      label: typeLabels[t.payment_terms] || `Type ${t.payment_terms}`
    }));
    res.json({ success: true, data: formattedTypes });
  } catch (error) {
    console.error('Error fetching subscription types:', error);
    res.status(500).json({ success: false, message: 'Error fetching subscription types', error: error.message });
  }
});

// Get payment modes from payment_log
router.get('/payment-modes/list', async (req, res) => {
  try {
    const [modes] = await pool.execute(
      'SELECT DISTINCT payment_method as value FROM checkout.appypie_payment_log WHERE payment_method IS NOT NULL AND payment_method != "" ORDER BY payment_method ASC'
    );
    const formattedModes = modes.map(m => ({
      value: m.value,
      label: formatLabel(m.value)
    }));
    res.json({ success: true, data: formattedModes });
  } catch (error) {
    console.error('Error fetching payment modes:', error);
    res.status(500).json({ success: false, message: 'Error fetching payment modes', error: error.message });
  }
});

// Get payment sources from payment_log
router.get('/payment-sources/list', async (req, res) => {
  try {
    const [sources] = await pool.execute(
      'SELECT DISTINCT payment_source as value FROM checkout.appypie_payment_log WHERE payment_source IS NOT NULL AND payment_source != "" ORDER BY payment_source ASC'
    );
    const formattedSources = sources.map(s => ({
      value: s.value,
      label: formatLabel(s.value)
    }));
    res.json({ success: true, data: formattedSources });
  } catch (error) {
    console.error('Error fetching payment sources:', error);
    res.status(500).json({ success: false, message: 'Error fetching payment sources', error: error.message });
  }
});

// Get subscription periods from appypie_pricing
router.get('/subscription-periods/list', async (req, res) => {
  try {
    const [periods] = await pool.execute(
      'SELECT DISTINCT plan_period as value FROM checkout.appypie_pricing WHERE status = 1 ORDER BY plan_period ASC'
    );
    if (periods.length > 0) {
      const formattedPeriods = periods.map(p => ({
        value: p.value,
        label: formatPeriodLabel(p.value)
      }));
      res.json({ success: true, data: formattedPeriods });
    } else {
      // Fallback to payment_log
      const [dbPeriods] = await pool.execute(
        'SELECT DISTINCT subscription_period as value FROM checkout.appypie_payment_log WHERE subscription_period IS NOT NULL AND subscription_period != "" ORDER BY subscription_period ASC'
      );
      const formattedPeriods = dbPeriods.map(p => ({
        value: p.value,
        label: formatPeriodLabel(p.value)
      }));
      res.json({ success: true, data: formattedPeriods });
    }
  } catch (error) {
    console.error('Error fetching subscription periods:', error);
    res.status(500).json({ success: false, message: 'Error fetching subscription periods', error: error.message });
  }
});

// Get countries from appypie_country
router.get('/languages/list', async (req, res) => {
  try {
    const [dbCountries] = await pool.execute(
      'SELECT country as code, currencyCode, currencySign FROM checkout.appypie_country WHERE status = 1 ORDER BY sortOrder ASC'
    );
    const languages = dbCountries.map(c => {
      const code = c.code.toLowerCase();
      const countryName = countryNames[code] || c.code.toUpperCase();
      return {
        value: c.code,
        label: `${countryName} (${c.currencyCode})`,
        currencyCode: c.currencyCode,
        currencySign: c.currencySign
      };
    });
    res.json({ success: true, data: languages });
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ success: false, message: 'Error fetching languages', error: error.message });
  }
});

// Get claimed users from payment_log
router.get('/claimed-users/list', async (req, res) => {
  try {
    const [dbClaimedUsers] = await pool.execute(
      'SELECT DISTINCT claim_user as value FROM checkout.appypie_payment_log WHERE claim_user IS NOT NULL AND claim_user != "" ORDER BY claim_user ASC'
    );
    const claimedUsers = [
      { value: 'claimed', label: 'All Claimed' },
      { value: 'unclaimed', label: 'Unclaimed' },
      ...dbClaimedUsers.map(u => ({
        value: u.value,
        label: u.value
      }))
    ];
    res.json({ success: true, data: claimedUsers });
  } catch (error) {
    console.error('Error fetching claimed users:', error);
    res.status(500).json({ success: false, message: 'Error fetching claimed users', error: error.message });
  }
});

// Export payment logs as CSV - ALL FROM DATABASE
router.get('/export', async (req, res) => {
  try {
    const filters = [];
    const filterParams = [];

    if (req.query.searchByAppId) {
      filters.push('(product_id LIKE ? OR order_id LIKE ?)');
      filterParams.push(`%${req.query.searchByAppId}%`, `%${req.query.searchByAppId}%`);
    }
    if (req.query.searchByAppIdOrTransaction) {
      filters.push('(product_id LIKE ? OR transaction_id LIKE ?)');
      filterParams.push(`%${req.query.searchByAppIdOrTransaction}%`, `%${req.query.searchByAppIdOrTransaction}%`);
    }
    if (req.query.subscriptionType) {
      const typeMap = { 'new': 1, 'trial': 1, 'renewal': 2, 'upgrade': 3 };
      const termValue = typeMap[req.query.subscriptionType.toLowerCase()];
      if (termValue) {
        filters.push('payment_terms = ?');
        filterParams.push(termValue);
      }
    }
    if (req.query.paymentMode) {
      filters.push('payment_method = ?');
      filterParams.push(req.query.paymentMode);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const dataQuery = `
      SELECT
        id,
        product_id as app_id,
        product_name as app_name,
        CONCAT('user', user_id, '@appypie.com') as email,
        description as message,
        subscription_period as payment_period,
        COALESCE(net_amount, plan_price) as amount,
        currency,
        tax_amount,
        invoice_id,
        transaction_id,
        payment_method as payment_mode,
        payment_source,
        refund_status,
        ip_address,
        addedon as last_payment_date,
        claim_user as claim_to,
        CASE
          WHEN payment_terms = 1 THEN 'New'
          WHEN payment_terms = 2 THEN 'Renewal'
          WHEN payment_terms = 3 THEN 'Upgrade'
          ELSE customer_payment_type
        END as subscription_type,
        product_name,
        product_id
      FROM checkout.appypie_payment_log
      ${whereClause}
      ORDER BY id DESC
    `;

    const [dbLogs] = await pool.execute(dataQuery, filterParams);
    const paymentLogs = dbLogs.map(log => ({
      ...log,
      last_payment_date: formatTimestamp(log.last_payment_date)
    }));

    // Generate CSV content
    const headers = [
      'S.No', 'App ID', 'App Name', 'Email', 'Message', 'Payment Period',
      'Amount', 'Currency', 'Tax Amount', 'Invoice ID', 'Transaction ID',
      'Payment Mode', 'Payment Source', 'Refund Status',
      'IP Address', 'Last Payment Date', 'Claim To', 'Subscription Type',
      'Product Name', 'Product ID'
    ];

    let csvContent = headers.join(',') + '\n';

    paymentLogs.forEach((log, index) => {
      const row = [
        index + 1,
        `"${(log.app_id || '').toString().replace(/"/g, '""')}"`,
        `"${(log.app_name || '').toString().replace(/"/g, '""')}"`,
        `"${(log.email || '').toString().replace(/"/g, '""')}"`,
        `"${(log.message || '').toString().replace(/"/g, '""')}"`,
        `"${(log.payment_period || '').toString().replace(/"/g, '""')}"`,
        log.amount || 0,
        `"${(log.currency || 'USD').toString().replace(/"/g, '""')}"`,
        log.tax_amount || 0,
        `"${(log.invoice_id || '').toString().replace(/"/g, '""')}"`,
        `"${(log.transaction_id || '').toString().replace(/"/g, '""')}"`,
        `"${(log.payment_mode || '').toString().replace(/"/g, '""')}"`,
        `"${(log.payment_source || '').toString().replace(/"/g, '""')}"`,
        `"${(log.refund_status || 'No').toString().replace(/"/g, '""')}"`,
        `"${(log.ip_address || '').toString().replace(/"/g, '""')}"`,
        `"${(log.last_payment_date || '').toString().replace(/"/g, '""')}"`,
        `"${(log.claim_to || '').toString().replace(/"/g, '""')}"`,
        `"${(log.subscription_type || '').toString().replace(/"/g, '""')}"`,
        `"${(log.product_name || '').toString().replace(/"/g, '""')}"`,
        `"${(log.product_id || '').toString().replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=payment-logs-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting payment logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting payment logs',
      error: error.message
    });
  }
});

// Download invoice for a payment log - FROM DATABASE
router.get('/invoice/:id', async (req, res) => {
  try {
    const paymentId = req.params.id;

    const [paymentLogs] = await pool.execute(
      `SELECT
        id,
        invoice_id,
        product_id,
        product_name,
        user_id,
        description,
        subscription_period,
        currency,
        COALESCE(net_amount, plan_price) as amount,
        tax_amount,
        transaction_id,
        payment_method,
        payment_source,
        addedon
      FROM checkout.appypie_payment_log WHERE id = ?`,
      [paymentId]
    );

    if (paymentLogs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment log not found'
      });
    }

    const log = paymentLogs[0];

    // Get billing address for customer details
    let customerEmail = `user${log.user_id}@appypie.com`;
    let customerName = 'N/A';
    try {
      const [billing] = await pool.execute(
        'SELECT email, first_name, last_name, address, city, state, zip FROM checkout.appypie_billing_address WHERE user_id = ? AND product_id = ? LIMIT 1',
        [log.user_id, log.product_id]
      );
      if (billing.length > 0) {
        customerEmail = billing[0].email || customerEmail;
        customerName = billing[0].first_name && billing[0].last_name
          ? `${billing[0].first_name} ${billing[0].last_name}`
          : 'N/A';
      }
    } catch (e) {
      console.log('Could not fetch billing address:', e.message);
    }

    const invoiceDate = formatTimestamp(log.addedon);
    const invoiceContent = `
================================================================================
                                    INVOICE
================================================================================

Invoice ID:          ${log.invoice_id || 'N/A'}
Invoice Date:        ${invoiceDate}
Transaction ID:      ${log.transaction_id || 'N/A'}

--------------------------------------------------------------------------------
                              CUSTOMER DETAILS
--------------------------------------------------------------------------------

Customer Name:       ${customerName}
Customer Email:      ${customerEmail}
Product ID:          ${log.product_id || 'N/A'}
User ID:             ${log.user_id || 'N/A'}

--------------------------------------------------------------------------------
                              ORDER DETAILS
--------------------------------------------------------------------------------

Product:             ${log.product_name || 'N/A'}
Description:         ${log.description || 'N/A'}
Subscription Period: ${log.subscription_period || 'N/A'}
Payment Method:      ${log.payment_method || 'N/A'}
Payment Source:      ${log.payment_source || 'N/A'}

--------------------------------------------------------------------------------
                              PAYMENT SUMMARY
--------------------------------------------------------------------------------

Subtotal:            ${log.currency || 'USD'} ${parseFloat(log.amount || 0).toFixed(2)}
Tax:                 ${log.currency || 'USD'} ${parseFloat(log.tax_amount || 0).toFixed(2)}
                    -------------------------------------
Total:               ${log.currency || 'USD'} ${(parseFloat(log.amount || 0) + parseFloat(log.tax_amount || 0)).toFixed(2)}

================================================================================
                          Thank you for your business!
================================================================================
`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${log.invoice_id || paymentId}.txt`);
    res.send(invoiceContent);

  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating invoice',
      error: error.message
    });
  }
});

// Get payment log by ID - FROM DATABASE
router.get('/:id', async (req, res) => {
  try {
    const [paymentLogs] = await pool.execute(
      `SELECT
        id,
        product_id as app_id,
        product_name as app_name,
        user_id,
        description as message,
        subscription_period as payment_period,
        COALESCE(net_amount, plan_price) as amount,
        currency,
        tax_amount,
        invoice_id,
        transaction_id,
        payment_method as payment_mode,
        payment_source,
        'desktop' as device_selection,
        refund_status,
        ip_address,
        addedon as last_payment_date,
        claim_user as claim_to,
        CASE
          WHEN payment_terms = 1 THEN 'New'
          WHEN payment_terms = 2 THEN 'Renewal'
          WHEN payment_terms = 3 THEN 'Upgrade'
          ELSE customer_payment_type
        END as subscription_type,
        product_name,
        product_id,
        addon_type as addon_name
      FROM checkout.appypie_payment_log WHERE id = ?`,
      [req.params.id]
    );

    if (paymentLogs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment log not found'
      });
    }

    const log = paymentLogs[0];

    // Get billing email
    let email = `user${log.user_id}@appypie.com`;
    try {
      const [billing] = await pool.execute(
        'SELECT email FROM checkout.appypie_billing_address WHERE user_id = ? AND product_id = ? LIMIT 1',
        [log.user_id, log.app_id]
      );
      if (billing.length > 0 && billing[0].email) {
        email = billing[0].email;
      }
    } catch (e) {
      console.log('Could not fetch billing email:', e.message);
    }

    res.json({
      success: true,
      data: {
        ...log,
        email,
        last_payment_date: formatTimestamp(log.last_payment_date)
      }
    });
  } catch (error) {
    console.error('Error fetching payment log:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment log',
      error: error.message
    });
  }
});

module.exports = router;
