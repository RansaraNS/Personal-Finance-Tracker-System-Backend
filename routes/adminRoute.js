const express = require('express');
const {
  getAllUserIncomeSummary,
  getAllUserExpenseSummary,
  getUserFinancialSummary,
  getAllUsersFinancialSnapshot
} = require('../controllers/adminController');

const router = express.Router();

//import middleware function
const { protect, authorize } = require('../middleware/authMiddleware');


// Admin summary routes
router.get('/admin/income-summary', protect, authorize('admin'), getAllUserIncomeSummary);
router.get('/admin/expense-summary', protect, authorize('admin'), getAllUserExpenseSummary);
router.get('/admin/user-summary/:userId', protect, authorize('admin'), getUserFinancialSummary);
router.get('/admin/users-snapshot', protect, authorize('admin'), getAllUsersFinancialSnapshot);

module.exports = router;