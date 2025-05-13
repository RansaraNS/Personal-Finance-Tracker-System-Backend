const express = require('express');
const {
  getSavings,
  getSaving,
  createSavings,
  updateSaving,
  deleteSaving,
  updateSavingProgress
} = require('../controllers/savingsController');

const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('user'), createSavings);
router.get('/', protect, authorize('user'), getSavings);

router.get('/:id', protect, authorize('user'), getSaving);
router.put('/:id', protect, authorize('user'), updateSaving);
router.delete('/:id', protect, authorize('user'), deleteSaving);

router.route('/:id/progress').put(protect, authorize('user'), updateSavingProgress);

module.exports = router;