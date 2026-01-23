const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Generate mock data for testing
function generateMockData(count = 50) {
  const appNames = ['Appy Pie App', 'Design Studio', 'Chatbot Builder', 'Website Builder', 'Form Builder'];
  const subscriptionTypes = ['trial', 'upgrade', 'renewal'];
  const paymentModes = ['stripe', 'paypal', 'razorpay', 'ccavenue', 'ebanx'];
  const paymentSources = ['web', 'Manual', 'ios', 'android'];
  const periods = ['monthly', 'yearly', 'oneTime'];
  const currencies = ['USD', 'AUD', 'EUR', 'GBP', 'INR'];

  const data = [];

  for (let i = 0; i < count; i++) {
    const subscriptionType = subscriptionTypes[Math.floor(Math.random() * subscriptionTypes.length)];
    const amount = subscriptionType === 'trial' ? 16 : Math.floor(Math.random() * 300) + 36;
    const appIndex = Math.floor(Math.random() * appNames.length);
    const period = periods[Math.floor(Math.random() * periods.length)];
    const hasInvoice = Math.random() > 0.3;
    const hasSignedAgreement = Math.random() > 0.5;

    const date = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]} ${date.getFullYear()}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;

    data.push({
      id: i + 1,
      app_id: `${Math.random().toString(36).substring(2, 12)}`,
      app_name: appNames[appIndex],
      email: `user${i + 1}@${['gmail.com', 'yahoo.com', 'outlook.com', 'example.org'][Math.floor(Math.random() * 4)]}`,
      message: `${subscriptionType === 'renewal' ? 'Renewal' : subscriptionType === 'upgrade' ? 'Upgrade' : ''} subscription for ${appNames[appIndex]} ${period.charAt(0).toUpperCase() + period.slice(1)} Plan${subscriptionType !== 'trial' ? ' (Essential)' : ' Basic'} - ${Math.random().toString(36).substring(2, 8)}`,
      payment_period: period,
      amount: amount.toString(),
      currency: currencies[Math.floor(Math.random() * currencies.length)],
      tax_amount: '0',
      invoice_id: `C${387340 + i}`,
      transaction_id: `ch_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
      payment_mode: paymentModes[Math.floor(Math.random() * paymentModes.length)],
      payment_source: paymentSources[Math.floor(Math.random() * paymentSources.length)],
      device_selection: Math.random() > 0.7 ? 'mobile' : 'desktop',
      refund_status: 'No',
      ip_address: `${Math.floor(Math.random() * 200) + 50}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      last_payment_date: formattedDate,
      claim_to: null,
      subscription_type: subscriptionType,
      product_name: appNames[appIndex],
      product_id: `prod_${appIndex + 1}`,
      addon_name: Math.random() > 0.7 ? 'Premium Support' : null,
      language: 'en',
      claimed_user: null,
      has_invoice: hasInvoice,
      has_signed_agreement: hasSignedAgreement
    });
  }

  return data;
}

// Calculate summary from data
function calculateSummary(data) {
  const summary = {
    trial: { count: 0, amount: 0 },
    upgrade: { count: 0, amount: 0 },
    renewal: { count: 0, amount: 0 },
    total: { count: 0, amount: 0 }
  };

  data.forEach(item => {
    const amount = parseFloat(item.amount) || 0;
    if (item.subscription_type === 'trial') {
      summary.trial.count++;
      summary.trial.amount += amount;
    } else if (item.subscription_type === 'upgrade') {
      summary.upgrade.count++;
      summary.upgrade.amount += amount;
    } else if (item.subscription_type === 'renewal') {
      summary.renewal.count++;
      summary.renewal.amount += amount;
    }
  });

  summary.total.count = summary.trial.count + summary.upgrade.count + summary.renewal.count;
  summary.total.amount = summary.trial.amount + summary.upgrade.amount + summary.renewal.amount;

  return summary;
}

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

// Mock products data
const mockProducts = [
  { id: 1, name: 'Appy Pie App' },
  { id: 2, name: 'Design Studio' },
  { id: 3, name: 'Chatbot Builder' },
  { id: 4, name: 'Website Builder' },
  { id: 5, name: 'Form Builder' }
];

// Mock addons data
const mockAddons = [
  { id: 1, name: 'Premium Support' },
  { id: 2, name: 'Extra Storage' },
  { id: 3, name: 'API Access' },
  { id: 4, name: 'White Label' },
  { id: 5, name: 'Analytics Pro' }
];

// Mock subscription types (based on payment_terms: 1=New, 2=Renewal, 3=Upgrade)
const mockSubscriptionTypes = [
  { value: 'new', label: 'New' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'upgrade', label: 'Upgrade' }
];

// Mock payment modes
const mockPaymentModes = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'razorpay', label: 'Razorpay' },
  { value: 'ccavenue', label: 'CCAvenue' },
  { value: 'ebanx', label: 'Ebanx' }
];

// Mock payment sources
const mockPaymentSources = [
  { value: 'web', label: 'Web' },
  { value: 'Manual', label: 'Manual' },
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' }
];

// Mock subscription periods
const mockSubscriptionPeriods = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'oneTime', label: 'One Time' }
];

// Mock languages
const mockLanguages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' }
];

// Mock claimed user options
const mockClaimedUsers = [
  { value: 'claimed', label: 'Claimed' },
  { value: 'unclaimed', label: 'Unclaimed' }
];

// Get payment logs with pagination, filters, and summary
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let paymentLogs = [];
    let total = 0;
    let summary = {};

    try {
      // Try database first with correct column names
      const filters = [];
      const filterParams = [];

      // Search by product_id or order_id
      if (req.query.searchByAppId) {
        filters.push('(product_id LIKE ? OR order_id LIKE ?)');
        filterParams.push(`%${req.query.searchByAppId}%`, `%${req.query.searchByAppId}%`);
      }
      // Search by product_id or transaction_id
      if (req.query.searchByAppIdOrTransaction) {
        filters.push('(product_id LIKE ? OR transaction_id LIKE ?)');
        filterParams.push(`%${req.query.searchByAppIdOrTransaction}%`, `%${req.query.searchByAppIdOrTransaction}%`);
      }
      // Search by date (addedon is timestamp in seconds)
      if (req.query.searchDate) {
        const searchDate = new Date(req.query.searchDate);
        const startOfDay = Math.floor(searchDate.getTime() / 1000);
        const endOfDay = startOfDay + 86400;
        filters.push('addedon >= ? AND addedon < ?');
        filterParams.push(startOfDay, endOfDay);
      }
      // Filter by payment_terms (subscription type): new=1, renewal=2, upgrade=3
      if (req.query.subscriptionType) {
        const typeMap = { 'new': 1, 'trial': 1, 'renewal': 2, 'upgrade': 3 };
        const termValue = typeMap[req.query.subscriptionType.toLowerCase()];
        if (termValue) {
          filters.push('payment_terms = ?');
          filterParams.push(termValue);
        }
      }
      // Filter by product_name
      if (req.query.productId) {
        filters.push('product_name = ?');
        filterParams.push(req.query.productId);
      }
      // Filter by subscription_period
      if (req.query.subscriptionPeriod) {
        filters.push('subscription_period = ?');
        filterParams.push(req.query.subscriptionPeriod);
      }
      // Filter by addon_type
      if (req.query.addons) {
        filters.push('addon_type LIKE ?');
        filterParams.push(`%${req.query.addons}%`);
      }
      // Filter by payment_method (payment mode)
      if (req.query.paymentMode) {
        filters.push('payment_method = ?');
        filterParams.push(req.query.paymentMode);
      }
      // Filter by payment_source
      if (req.query.paymentSource) {
        filters.push('payment_source = ?');
        filterParams.push(req.query.paymentSource);
      }
      // Filter by claimed user
      if (req.query.claimedUser) {
        if (req.query.claimedUser === 'claimed') {
          filters.push('claim_user IS NOT NULL AND claim_user != ""');
        } else if (req.query.claimedUser === 'unclaimed') {
          filters.push('(claim_user IS NULL OR claim_user = "")');
        } else {
          // Filter by specific user name
          filters.push('claim_user = ?');
          filterParams.push(req.query.claimedUser);
        }
      }
      // Filter by language/country
      if (req.query.language) {
        filters.push('payment_country = ?');
        filterParams.push(req.query.language);
      }

      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

      // Count total records
      const countQuery = `SELECT COUNT(*) as total FROM checkout.appypie_payment_log ${whereClause}`;
      const [countResult] = await pool.execute(countQuery, filterParams);
      total = countResult[0].total;

      // Calculate summary using payment_terms: 1=New/Trial, 2=Renewal, 3=Upgrade
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

      summary = {
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

      // Get paginated data with JOIN to billing_address for emails and subscription for more details
      const dataQuery = `
        SELECT
          pl.id,
          pl.product_id as app_id,
          pl.product_name as app_name,
          pl.user_id,
          pl.description as message,
          pl.subscription_period as payment_period,
          COALESCE(pl.net_amount, pl.plan_price) as amount,
          pl.currency,
          pl.tax_amount,
          pl.invoice_id,
          pl.transaction_id,
          pl.payment_method as payment_mode,
          pl.payment_source,
          'desktop' as device_selection,
          COALESCE(pl.refund_status, 'No') as refund_status,
          pl.ip_address,
          pl.addedon as last_payment_date,
          pl.claim_user as claim_to,
          CASE
            WHEN pl.payment_terms = 1 THEN 'New'
            WHEN pl.payment_terms = 2 THEN 'Renewal'
            WHEN pl.payment_terms = 3 THEN 'Upgrade'
            ELSE pl.customer_payment_type
          END as subscription_type,
          pl.product_name,
          pl.product_id,
          pl.addon_type as addon_name,
          pl.payment_country as language,
          pl.claim_user as claimed_user,
          pl.plan_id,
          pl.coupon_code,
          pl.discount_amount,
          CASE WHEN pl.invoice_id IS NOT NULL AND pl.invoice_id != '' THEN 1 ELSE 0 END as has_invoice,
          0 as has_signed_agreement,
          ba.email as billing_email,
          ba.first_name,
          ba.last_name,
          ba.phone as billing_phone,
          ba.company,
          sub.auto_renewal_status,
          sub.subscription_start_date,
          sub.subscription_end_date,
          sub.cancel_flag,
          sub.trial_flag,
          pln.plan_name
        FROM checkout.appypie_payment_log pl
        LEFT JOIN checkout.appypie_billing_address ba ON pl.product_id = ba.product_id AND pl.user_id = ba.user_id
        LEFT JOIN checkout.appypie_subscription sub ON pl.product_id = sub.product_id AND pl.user_id = sub.user_id
        LEFT JOIN checkout.appypie_plan pln ON pl.plan_id = pln.id
        ${whereClause.replace(/(\b(?:product_id|product_name|user_id|payment_method|payment_source|payment_country|claim_user|subscription_period|addon_type|payment_terms)\b)/g, 'pl.$1')}
        ORDER BY pl.id DESC
        LIMIT ? OFFSET ?
      `;

      const [dbLogs] = await pool.execute(dataQuery, [...filterParams, limit, offset]);
      paymentLogs = dbLogs.map(log => ({
        ...log,
        email: log.billing_email || `user${log.user_id}@appypie.com`,
        customer_name: log.first_name && log.last_name ? `${log.first_name} ${log.last_name}` : null,
        last_payment_date: formatTimestamp(log.last_payment_date),
        has_invoice: Boolean(log.has_invoice),
        has_signed_agreement: Boolean(log.has_signed_agreement),
        auto_renewal: log.auto_renewal_status || 'Unknown',
        is_cancelled: Boolean(log.cancel_flag),
        is_trial: Boolean(log.trial_flag)
      }));

    } catch (dbError) {
      // Fallback to mock data if database fails
      console.log('Database unavailable, using mock data:', dbError.message);

      let mockData = generateMockData(50);

      // Apply filters to mock data
      if (req.query.subscriptionType) {
        mockData = mockData.filter(d => d.subscription_type === req.query.subscriptionType);
      }
      if (req.query.paymentMode) {
        mockData = mockData.filter(d => d.payment_mode === req.query.paymentMode);
      }
      if (req.query.paymentSource) {
        mockData = mockData.filter(d => d.payment_source === req.query.paymentSource);
      }
      if (req.query.subscriptionPeriod) {
        mockData = mockData.filter(d => d.payment_period === req.query.subscriptionPeriod);
      }
      if (req.query.searchByAppIdOrTransaction) {
        const search = req.query.searchByAppIdOrTransaction.toLowerCase();
        mockData = mockData.filter(d =>
          d.app_id.toLowerCase().includes(search) ||
          d.transaction_id.toLowerCase().includes(search)
        );
      }

      total = mockData.length;
      summary = calculateSummary(mockData);
      paymentLogs = mockData.slice(offset, offset + limit);
    }

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

// Get all filter options in a single call - MUST be before /:id route
router.get('/filters/all', async (req, res) => {
  try {
    let products = mockProducts;
    let addons = mockAddons;
    let subscriptionTypes = mockSubscriptionTypes;
    let paymentModes = mockPaymentModes;
    let paymentSources = mockPaymentSources;
    let subscriptionPeriods = mockSubscriptionPeriods;
    let languages = mockLanguages;
    let claimedUsers = mockClaimedUsers;

    try {
      // Fetch products from appypie_product table
      const [dbProducts] = await pool.execute(
        'SELECT id, name FROM checkout.appypie_product WHERE status = 1 ORDER BY name ASC'
      );
      if (dbProducts.length > 0) products = dbProducts;

      // Use payment_terms for subscription types: 1=New, 2=Renewal, 3=Upgrade
      const [dbTypes] = await pool.execute(
        'SELECT DISTINCT payment_terms FROM checkout.appypie_payment_log WHERE payment_terms IS NOT NULL ORDER BY payment_terms'
      );
      if (dbTypes.length > 0) {
        const typeLabels = { 1: 'New', 2: 'Renewal', 3: 'Upgrade' };
        const typeValues = { 1: 'new', 2: 'renewal', 3: 'upgrade' };
        subscriptionTypes = dbTypes.map(t => ({
          value: typeValues[t.payment_terms] || t.payment_terms.toString(),
          label: typeLabels[t.payment_terms] || `Type ${t.payment_terms}`
        }));
      }

      const [dbModes] = await pool.execute(
        'SELECT DISTINCT payment_method as value FROM checkout.appypie_payment_log WHERE payment_method IS NOT NULL AND payment_method != "" ORDER BY payment_method ASC'
      );
      if (dbModes.length > 0) {
        paymentModes = dbModes.map(m => ({
          value: m.value,
          label: m.value.charAt(0).toUpperCase() + m.value.slice(1)
        }));
      }

      const [dbSources] = await pool.execute(
        'SELECT DISTINCT payment_source as value FROM checkout.appypie_payment_log WHERE payment_source IS NOT NULL AND payment_source != "" ORDER BY payment_source ASC'
      );
      if (dbSources.length > 0) {
        paymentSources = dbSources.map(s => ({
          value: s.value,
          label: s.value.charAt(0).toUpperCase() + s.value.slice(1)
        }));
      }

      const [dbPeriods] = await pool.execute(
        'SELECT DISTINCT subscription_period as value FROM checkout.appypie_payment_log WHERE subscription_period IS NOT NULL AND subscription_period != "" ORDER BY subscription_period ASC'
      );
      if (dbPeriods.length > 0) {
        subscriptionPeriods = dbPeriods.map(p => ({
          value: p.value,
          label: p.value === 'oneTime' ? 'One Time' : p.value.charAt(0).toUpperCase() + p.value.slice(1)
        }));
      }

      const [dbAddons] = await pool.execute(
        'SELECT DISTINCT addon_type as name FROM checkout.appypie_payment_log WHERE addon_type IS NOT NULL AND addon_type != "" ORDER BY addon_type ASC'
      );
      if (dbAddons.length > 0) {
        addons = dbAddons.map((a, index) => ({ id: index + 1, name: a.name }));
      }

      // Fetch countries from appypie_country table with currency info
      const [dbCountriesFromTable] = await pool.execute(
        'SELECT country as code, currencyCode, currencySign FROM checkout.appypie_country WHERE status = 1 ORDER BY sortOrder ASC'
      );

      // Also get distinct payment_country values from payment_log to show only used countries
      const [usedCountries] = await pool.execute(
        'SELECT DISTINCT payment_country as value FROM checkout.appypie_payment_log WHERE payment_country IS NOT NULL AND payment_country != "" ORDER BY payment_country ASC'
      );

      // Country code to name mapping (extended)
      const countryNames = {
        'ae': 'United Arab Emirates', 'ar': 'Argentina', 'at': 'Austria', 'au': 'Australia',
        'be': 'Belgium', 'br': 'Brazil', 'ca': 'Canada', 'ch': 'Switzerland', 'cl': 'Chile',
        'cn': 'China', 'co': 'Colombia', 'de': 'Germany', 'dk': 'Denmark', 'es': 'Spain',
        'fi': 'Finland', 'fr': 'France', 'gb': 'United Kingdom', 'gr': 'Greece', 'hk': 'Hong Kong',
        'id': 'Indonesia', 'ie': 'Ireland', 'il': 'Israel', 'in': 'India', 'it': 'Italy',
        'jp': 'Japan', 'kr': 'South Korea', 'mx': 'Mexico', 'my': 'Malaysia', 'nl': 'Netherlands',
        'no': 'Norway', 'nz': 'New Zealand', 'pe': 'Peru', 'ph': 'Philippines', 'pk': 'Pakistan',
        'pl': 'Poland', 'pt': 'Portugal', 'ro': 'Romania', 'ru': 'Russia', 'sa': 'Saudi Arabia',
        'se': 'Sweden', 'sg': 'Singapore', 'th': 'Thailand', 'tr': 'Turkey', 'tw': 'Taiwan',
        'ua': 'Ukraine', 'us': 'United States', 'vn': 'Vietnam', 'za': 'South Africa',
        'as': 'American Samoa', 'AE': 'United Arab Emirates', 'AR': 'Argentina', 'AT': 'Austria',
        'AU': 'Australia', 'BE': 'Belgium', 'BR': 'Brazil', 'CA': 'Canada', 'CH': 'Switzerland',
        'CL': 'Chile', 'CN': 'China', 'CO': 'Colombia', 'DE': 'Germany', 'DK': 'Denmark',
        'ES': 'Spain', 'FI': 'Finland', 'FR': 'France', 'GB': 'United Kingdom', 'GR': 'Greece',
        'HK': 'Hong Kong', 'ID': 'Indonesia', 'IE': 'Ireland', 'IL': 'Israel', 'IN': 'India',
        'IT': 'Italy', 'JP': 'Japan', 'KR': 'South Korea', 'MX': 'Mexico', 'MY': 'Malaysia',
        'NL': 'Netherlands', 'NO': 'Norway', 'NZ': 'New Zealand', 'PE': 'Peru', 'PH': 'Philippines',
        'PK': 'Pakistan', 'PL': 'Poland', 'PT': 'Portugal', 'RO': 'Romania', 'RU': 'Russia',
        'SA': 'Saudi Arabia', 'SE': 'Sweden', 'SG': 'Singapore', 'TH': 'Thailand', 'TR': 'Turkey',
        'TW': 'Taiwan', 'UA': 'Ukraine', 'US': 'United States', 'VN': 'Vietnam', 'ZA': 'South Africa'
      };

      // Create a map of country codes to currency info from appypie_country
      const countryCurrencyMap = {};
      dbCountriesFromTable.forEach(c => {
        countryCurrencyMap[c.code.toLowerCase()] = { currencyCode: c.currencyCode, currencySign: c.currencySign };
        countryCurrencyMap[c.code.toUpperCase()] = { currencyCode: c.currencyCode, currencySign: c.currencySign };
      });

      if (usedCountries.length > 0) {
        languages = usedCountries.map(c => {
          const currencyInfo = countryCurrencyMap[c.value] || {};
          const countryName = countryNames[c.value] || c.value;
          return {
            value: c.value,
            label: currencyInfo.currencyCode ? `${countryName} (${currencyInfo.currencyCode})` : countryName,
            currencyCode: currencyInfo.currencyCode || '',
            currencySign: currencyInfo.currencySign || ''
          };
        });
      }

      // Fetch actual claimed users from database
      const [dbClaimedUsers] = await pool.execute(
        'SELECT DISTINCT claim_user as value FROM checkout.appypie_payment_log WHERE claim_user IS NOT NULL AND claim_user != "" ORDER BY claim_user ASC'
      );
      if (dbClaimedUsers.length > 0) {
        // Add claimed/unclaimed options first, then actual user names
        claimedUsers = [
          { value: 'claimed', label: 'All Claimed' },
          { value: 'unclaimed', label: 'Unclaimed' },
          ...dbClaimedUsers.map(u => ({
            value: u.value,
            label: u.value
          }))
        ];
      }

    } catch (dbError) {
      console.log('Database unavailable for filters, using mock data:', dbError.message);
    }

    res.json({
      success: true,
      data: {
        products,
        addons,
        subscriptionTypes,
        paymentModes,
        paymentSources,
        subscriptionPeriods,
        languages,
        claimedUsers
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

// Get all products for filter dropdown
router.get('/products/list', async (req, res) => {
  try {
    const [products] = await pool.execute(
      'SELECT id, name FROM checkout.appypie_product WHERE status = 1 ORDER BY name ASC'
    );
    res.json({ success: true, data: products.length > 0 ? products : mockProducts });
  } catch (error) {
    console.log('Database unavailable for products, using mock data');
    res.json({ success: true, data: mockProducts });
  }
});

// Get all addons for filter dropdown
router.get('/addons/list', async (req, res) => {
  try {
    const [addons] = await pool.execute(
      'SELECT DISTINCT addon_type as name FROM checkout.appypie_payment_log WHERE addon_type IS NOT NULL AND addon_type != ""'
    );
    const formattedAddons = addons.map((a, index) => ({ id: index + 1, name: a.name }));
    res.json({ success: true, data: formattedAddons.length > 0 ? formattedAddons : mockAddons });
  } catch (error) {
    console.log('Database unavailable for addons, using mock data');
    res.json({ success: true, data: mockAddons });
  }
});

// Get all subscription types for filter dropdown
router.get('/subscription-types/list', async (req, res) => {
  try {
    const [types] = await pool.execute(
      'SELECT DISTINCT customer_payment_type as value FROM checkout.appypie_payment_log WHERE customer_payment_type IS NOT NULL AND customer_payment_type != "" ORDER BY customer_payment_type ASC'
    );
    const formattedTypes = types.map(t => ({
      value: t.value,
      label: t.value.charAt(0).toUpperCase() + t.value.slice(1)
    }));
    res.json({ success: true, data: formattedTypes.length > 0 ? formattedTypes : mockSubscriptionTypes });
  } catch (error) {
    console.log('Database unavailable for subscription types, using mock data');
    res.json({ success: true, data: mockSubscriptionTypes });
  }
});

// Get all payment modes for filter dropdown
router.get('/payment-modes/list', async (req, res) => {
  try {
    const [modes] = await pool.execute(
      'SELECT DISTINCT payment_method as value FROM checkout.appypie_payment_log WHERE payment_method IS NOT NULL AND payment_method != "" ORDER BY payment_method ASC'
    );
    const formattedModes = modes.map(m => ({
      value: m.value,
      label: m.value.charAt(0).toUpperCase() + m.value.slice(1)
    }));
    res.json({ success: true, data: formattedModes.length > 0 ? formattedModes : mockPaymentModes });
  } catch (error) {
    console.log('Database unavailable for payment modes, using mock data');
    res.json({ success: true, data: mockPaymentModes });
  }
});

// Get all payment sources for filter dropdown
router.get('/payment-sources/list', async (req, res) => {
  try {
    const [sources] = await pool.execute(
      'SELECT DISTINCT payment_source as value FROM checkout.appypie_payment_log WHERE payment_source IS NOT NULL AND payment_source != "" ORDER BY payment_source ASC'
    );
    const formattedSources = sources.map(s => ({
      value: s.value,
      label: s.value.charAt(0).toUpperCase() + s.value.slice(1)
    }));
    res.json({ success: true, data: formattedSources.length > 0 ? formattedSources : mockPaymentSources });
  } catch (error) {
    console.log('Database unavailable for payment sources, using mock data');
    res.json({ success: true, data: mockPaymentSources });
  }
});

// Get all subscription periods for filter dropdown
router.get('/subscription-periods/list', async (req, res) => {
  try {
    const [periods] = await pool.execute(
      'SELECT DISTINCT subscription_period as value FROM checkout.appypie_payment_log WHERE subscription_period IS NOT NULL AND subscription_period != "" ORDER BY subscription_period ASC'
    );
    const formattedPeriods = periods.map(p => ({
      value: p.value,
      label: p.value === 'oneTime' ? 'One Time' : p.value.charAt(0).toUpperCase() + p.value.slice(1)
    }));
    res.json({ success: true, data: formattedPeriods.length > 0 ? formattedPeriods : mockSubscriptionPeriods });
  } catch (error) {
    console.log('Database unavailable for subscription periods, using mock data');
    res.json({ success: true, data: mockSubscriptionPeriods });
  }
});

// Get all languages for filter dropdown
router.get('/languages/list', async (req, res) => {
  res.json({ success: true, data: mockLanguages });
});

// Get claimed user options for filter dropdown
router.get('/claimed-users/list', async (req, res) => {
  res.json({ success: true, data: mockClaimedUsers });
});

// Export payment logs as CSV
router.get('/export', async (req, res) => {
  try {
    let paymentLogs = [];

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
        filters.push('customer_payment_type = ?');
        filterParams.push(req.query.subscriptionType);
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
          CONCAT('user', user_id, '@example.com') as email,
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
          customer_payment_type as subscription_type,
          product_name,
          product_id
        FROM checkout.appypie_payment_log
        ${whereClause}
        ORDER BY id DESC
      `;

      const [dbLogs] = await pool.execute(dataQuery, filterParams);
      paymentLogs = dbLogs.map(log => ({
        ...log,
        last_payment_date: formatTimestamp(log.last_payment_date)
      }));
    } catch (dbError) {
      // Use mock data if database fails
      paymentLogs = generateMockData(50);
    }

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

// Download invoice for a payment log
router.get('/invoice/:id', async (req, res) => {
  try {
    const paymentId = req.params.id;

    // Fetch payment log details
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

    // Generate a simple text invoice (can be enhanced to PDF later)
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

// Get payment log by ID - MUST be last route
router.get('/:id', async (req, res) => {
  try {
    const [paymentLogs] = await pool.execute(
      `SELECT
        id,
        product_id as app_id,
        product_name as app_name,
        CONCAT('user', user_id, '@example.com') as email,
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
        customer_payment_type as subscription_type,
        product_name,
        product_id,
        addon_type as addon_name
      FROM checkout.appypie_payment_log WHERE id = ?`,
      [req.params.id]
    );

    if (paymentLogs.length === 0) {
      // Try mock data
      const mockData = generateMockData(50);
      const mockLog = mockData.find(d => d.id === parseInt(req.params.id));
      if (mockLog) {
        return res.json({ success: true, data: mockLog });
      }
      return res.status(404).json({
        success: false,
        message: 'Payment log not found'
      });
    }

    const log = paymentLogs[0];
    res.json({
      success: true,
      data: {
        ...log,
        last_payment_date: formatTimestamp(log.last_payment_date)
      }
    });
  } catch (error) {
    // Try mock data on error
    const mockData = generateMockData(50);
    const mockLog = mockData.find(d => d.id === parseInt(req.params.id));
    if (mockLog) {
      return res.json({ success: true, data: mockLog });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching payment log',
      error: error.message
    });
  }
});

module.exports = router;
