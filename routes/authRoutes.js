const express = require('express');

const router = express.Router();

const {
    register,
    login,
    getMe,
    getAllUsers,
    getUserById,
    deleteUser,
} = require('../controllers/authController');

//import middleware function
const { protect, authorize } = require('../middleware/authMiddleware');

//public routes
router.post('/register', register);
router.post('/login', login);

//protected routes
router.get('/me', protect, getMe);

//admin dashboard
router.get('/admin', protect, authorize('admin'), (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Admin access granted'
    });
});

//admin access routes
router.get('/admin/users', protect, authorize('admin'), getAllUsers);
router.get('/admin/user/:id', protect, authorize('admin'), getUserById);
router.delete('/admin/user/:id', protect, authorize('admin'), deleteUser);

module.exports = router;