const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');

// Mock environment variables
process.env.JWT_SECRET = 'test_secret';
process.env.JWT_EXPIRE = '1h';

describe('Admin Controller Tests', () => {
  let adminToken;
  let adminUser;
  let regularUser;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/finance_app_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Create an admin user
    adminUser = await User.create({
      userName: 'adminuser',
      email: 'admin@finance.admin.io',
      password: 'password123',
      role: 'admin'
    });

    // Create a regular user
    regularUser = await User.create({
      userName: 'regularuser',
      email: 'user@example.com',
      password: 'password123'
    });

    // Generate admin token
    adminToken = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
    if (app.close) {
      await app.close();
    }
  });

  describe('GET /api/auth/users', () => {
    it('should get all users when admin is authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2); // At least admin and regular user
    });

    it('should not allow regular user to get all users', async () => {
      // Generate token for regular user
      const userToken = jwt.sign(
        { id: regularUser._id, role: regularUser.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403); // Forbidden
    });
  });

  describe('GET /api/auth/users/:id', () => {
    it('should get a specific user by ID when admin is authenticated', async () => {
      const res = await request(app)
        .get(`/api/auth/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.email).toBe(regularUser.email);
    });

    it('should return error for non-existent user ID', async () => {
      const nonExistentId = mongoose.Types.ObjectId();
      
      const res = await request(app)
        .get(`/api/auth/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });
  });

  describe('DELETE /api/auth/users/:id', () => {
    it('should delete a user when admin is authenticated', async () => {
      // Create a user to delete
      const userToDelete = await User.create({
        userName: 'deleteuser',
        email: 'delete@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .delete(`/api/auth/users/${userToDelete._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User deleted successfully');

      // Verify user is deleted
      const deletedUser = await User.findById(userToDelete._id);
      expect(deletedUser).toBeNull();
    });

    it('should not allow admin to delete their own account', async () => {
      const res = await request(app)
        .delete(`/api/auth/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('You cannot delete your own admin account');

      // Verify admin user still exists
      const adminStillExists = await User.findById(adminUser._id);
      expect(adminStillExists).not.toBeNull();
    });

    it('should return error for non-existent user ID', async () => {
      const nonExistentId = mongoose.Types.ObjectId();
      
      const res = await request(app)
        .delete(`/api/auth/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User is not found');
    });
  });
});