const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get subscriptions with pagination and filters
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build WHERE clause for filters
    const filters = [];
    const filterParams = [];

    if (req.query.productName) {
      filters.push('s.product_name LIKE ?');
      filterParams.push(`%${req.query.productName}%`);
    }
    if (req.query.productId) {
      filters.push('s.product_id LIKE ?');
      filterParams.push(`%${req.query.productId}%`);
    }
    if (req.query.planName) {
      filters.push('p.plan_name LIKE ?');
      filterParams.push(`%${req.query.planName}%`);
    }
    if (req.query.period) {
      filters.push('s.subscription_period LIKE ?');
      filterParams.push(`%${req.query.period}%`);
    }
    if (req.query.startDate) {
      filters.push('s.subscription_start_date LIKE ?');
      filterParams.push(`%${req.query.startDate}%`);
    }
    if (req.query.renewalDate) {
      filters.push('s.subscription_end_date LIKE ?');
      filterParams.push(`%${req.query.renewalDate}%`);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    // Get total count with filters
    const countQuery = `SELECT COUNT(*) as total FROM checkout.appypie_subscription s
                        LEFT JOIN checkout.appypie_plan p ON s.plan_id = p.id
                        ${whereClause}`;
    const [countResult] = await pool.execute(countQuery, filterParams);
    const total = countResult[0].total;

    // Get paginated subscriptions with plan name and filters
    const dataQuery = `SELECT
        s.id,
        s.product_name,
        s.product_id,
        s.user_id,
        s.subscription_period,
        s.subscription_id,
        s.subscription_start_date,
        s.subscription_end_date,
        s.plan_price,
        s.currency,
        s.plan_id,
        s.payment_method,
        p.plan_name,
        CASE
          WHEN s.subscription_end_date IS NULL THEN 'Unknown'
          WHEN s.subscription_end_date < CURDATE() THEN 'Expired'
          WHEN s.subscription_end_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'Expiring Soon'
          ELSE 'Active'
        END as status
      FROM checkout.appypie_subscription s
      LEFT JOIN checkout.appypie_plan p ON s.plan_id = p.id
      ${whereClause}
      ORDER BY s.id DESC
      LIMIT ? OFFSET ?`;

    const [subscriptions] = await pool.execute(dataQuery, [...filterParams, limit, offset]);

    res.json({
      success: true,
      data: subscriptions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: error.message
    });
  }
});

// Get all plan names (optionally filtered by product name)
router.get('/plans/list', async (req, res) => {
  try {
    let query = 'SELECT DISTINCT id, plan_name, product_name FROM checkout.appypie_plan';
    let params = [];

    // Filter by product name if provided
    if (req.query.productName) {
      query += ' WHERE product_name = ?';
      params.push(req.query.productName);
    }

    query += ' ORDER BY plan_name ASC';

    const [plans] = await pool.execute(query, params);

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plans',
      error: error.message
    });
  }
});

// Get all product names
router.get('/products/list', async (req, res) => {
  try {
    const [products] = await pool.execute(
      'SELECT DISTINCT id, name FROM checkout.appypie_product WHERE status = 1 ORDER BY name ASC'
    );

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// Cancel subscription
router.post('/cancel', async (req, res) => {
  try {
    const { subscriptionId, productId, userId, productName, comment, cancelledType } = req.body;
    const addedon = Math.floor(Date.now() / 1000); // Unix timestamp
    const work_type = 'cancel';
    const adminuser = req.user?.username || 'admin'; // Get from auth middleware if available

    // Insert comment into appypie_payment_comment table
    const insertQuery = `
      INSERT INTO checkout.appypie_payment_comment
      (product_id, comment, addedon, adminuser, work_type)
      VALUES (?, ?, ?, ?, ?)
    `;

    await pool.execute(insertQuery, [
      productId,
      comment || '',
      addedon,
      adminuser,
      work_type
    ]);

    // Here you would typically call the external API
    // For now, we'll just return a success message
    // const apiUrl = process.env.NODE_ENV === 'production'
    //   ? 'https://checkout.appypie.com/api'
    //   : 'https://checkout-dev.appypie.com/api';

    // TODO: Implement API call to cancel subscription
    // const requestData = {
    //   productId,
    //   userId,
    //   productName,
    //   cancelReason: comment,
    //   cancelledType,
    //   lang: 'en',
    //   method: 'cancelSubscriptionProduct'
    // };

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription',
      error: error.message
    });
  }
});

// Get subscription by ID
router.get('/:id', async (req, res) => {
  try {
    const [subscriptions] = await pool.execute(
      'SELECT * FROM checkout.appypie_subscription WHERE id = ?',
      [req.params.id]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      data: subscriptions[0]
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription',
      error: error.message
    });
  }
});

module.exports = router;
