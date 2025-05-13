const express = require('express');
const {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget
} = require('../controllers/budgetController');

const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('user'), createBudget);
router.get('/', protect, authorize('user'), getBudgets);

router.get('/:id', protect, authorize('user'), getBudget);
router.put('/:id', protect, authorize('user'), updateBudget);
router.delete('/:id', protect, authorize('user'), deleteBudget);

module.exports = router;