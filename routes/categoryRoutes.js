const express = require('express');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesByType
} = require('../controllers/categoryController');

const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('user'), createCategory);
router.get('/', protect, authorize('user'), getCategories);

router.get('/:id', protect, authorize('user'), getCategory);
router.put('/:id', protect, authorize('user'), updateCategory);
router.delete('/:id', protect, authorize('user'), deleteCategory);

//router.route('/type/:type').get(protect, getCategoriesByType);

module.exports = router;