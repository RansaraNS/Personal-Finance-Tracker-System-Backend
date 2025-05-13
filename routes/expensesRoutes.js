const express = require('express');
const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary
} = require('../controllers/expenseController');

const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('user'), createExpense);
router.get('/', protect, authorize('user'), getExpenses);

router.get('/:id', protect, authorize('user'), getExpense);
router.put('/:id', protect, authorize('user'), updateExpense);
router.delete('/:id', protect, authorize('user'), deleteExpense);

router.route('/summary').get(protect, authorize('user'), getExpenseSummary);

module.exports = router;