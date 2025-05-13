const express = require('express');
const {
  getIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  getIncomeSummary
} = require('../controllers/incomeController');

const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('user'), createIncome);
router.get('/', protect, authorize('user'), getIncomes);

router.get('/:id', protect, authorize('user'), getIncome);
router.put('/:id', protect, authorize('user'), updateIncome);
router.delete('/:id', protect, authorize('user'), deleteIncome);

router.route('/summary').get(protect, authorize('user'), getIncomeSummary);

module.exports = router;