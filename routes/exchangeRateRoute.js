// routes/exchangeRateRoute.js
const express = require('express');
const router = express.Router();
const { getExchangeRates } = require('../controllers/exchangeRateController');
const { updateUserCurrency } = require('../controllers/userCurrencyController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Route to fetch exchange rates - make sure to use the function directly
router.get('/rates/:currency', getExchangeRates);
router.put('/user/currency', protect, authorize('user'), updateUserCurrency);

module.exports = router;