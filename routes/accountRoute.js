const express = require('express');
const {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountsByGroup
} = require('../controllers/accountController');

const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('user'), createAccount);
router.get('/', protect, authorize('user'), getAccounts);

router.get('/:id', protect, authorize('user'), getAccount);
router.put('/:id', protect, authorize('user'), updateAccount);
router.delete('/:id', protect, authorize('user'), deleteAccount);

//router.route('/group/:group').get(protect, getAccountsByGroup);

module.exports = router;