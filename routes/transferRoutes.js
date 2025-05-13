const express = require('express');
const {
  getTransfers,
  getTransfer,
  createTransfer,
  deleteTransfer
} = require('../controllers/transferController');

const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('user'), createTransfer);
router.get('/', protect, authorize('user'), getTransfers);

router.get('/:id', protect, authorize('user'), getTransfer);
router.delete('/:id', protect, authorize('user'), deleteTransfer);

module.exports = router;