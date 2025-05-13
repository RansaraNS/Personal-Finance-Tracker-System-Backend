const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');

// Mock environment variables
process.env.JWT_SECRET = 'test_secret';
process.env.JWT_EXPIRE = '1h';

describe('Auth Controller Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/finance_app_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (app.close) {
      await app.close();
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid details', async () => {
      const userData = {
        userName: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.userName).toBe(userData.userName);
      expect(res.body.user.email).toBe(userData.email);
      expect(res.body.user.role).toBe('user');
    });

    it('should not register a user with an existing email', async () => {
      // Create a user first
      await User.create({
        userName: 'existinguser',
        email: 'existing@example.com',
        password: 'password123'
      });

      // Try to register with the same email
      const userData = {
        userName: 'testuser',
        email: 'existing@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email already registered');
    });

    it('should not register an admin without company email', async () => {
      const userData = {
        userName: 'adminuser',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Cannot be registered as admin');
    });

    it('should register an admin with valid company email', async () => {
      const userData = {
        userName: 'adminuser',
        email: 'admin@finance.admin.io',
        password: 'password123',
        role: 'admin'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('admin');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      // Create a user first
      const userData = {
        userName: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      await User.create(userData);

      // Login with created user
      const loginData = {
        email: userData.email,
        password: userData.password
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(userData.email);
    });

    it('should not login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should not login with invalid password', async () => {
      // Create a user first
      const userData = {
        userName: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      await User.create(userData);

      // Login with wrong password
      const loginData = {
        email: userData.email,
        password: 'wrongpassword'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid password');
    });

    it('should require both email and password for login', async () => {
      const loginData = {
        email: 'test@example.com'
        // Missing password
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      // Create a user first
      const user = await User.create({
        userName: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      // Generate token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.email).toBe(user.email);
      expect(res.body.data.userName).toBe(user.userName);
    });

    it('should not allow access without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
    });
  });
});