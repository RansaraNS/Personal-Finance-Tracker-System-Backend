const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server'); // Import the app from server.js
const Category = require('../models/Category');
const User = require('../models/User'); // You will need to import your User model

let mongoServer;

// Mock user for authentication
let testUser;
let authToken;
let categoryId;

// Setup test database before all tests
beforeAll(async () => {
  // Create an in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  // Create a test user
  testUser = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user'
  });
  
  // Login to get auth token
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'password123'
    });
  
  authToken = loginResponse.body.token;
});

// Clean up after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clean up after each test
afterEach(async () => {
  await Category.deleteMany({});
});

describe('Category Controller Tests', () => {
  
  // Test creating a category
  describe('POST /api/cat', () => {
    it('should create a new expense category', async () => {
      const res = await request(app)
        .post('/api/cat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'expense',
          name: 'Food'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBeTruthy();
      expect(res.body.data.name).toEqual('Food');
      expect(res.body.data.type).toEqual('expense');
      expect(res.body.data.user.toString()).toEqual(testUser._id.toString());
      
      // Save category ID for later tests
      categoryId = res.body.data._id;
    });
    
    it('should create a new income category', async () => {
      const res = await request(app)
        .post('/api/cat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'income',
          name: 'Salary'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBeTruthy();
      expect(res.body.data.name).toEqual('Salary');
      expect(res.body.data.type).toEqual('income');
    });
    
    it('should not allow duplicate categories of the same type', async () => {
      // Create first category
      await request(app)
        .post('/api/cat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'expense',
          name: 'Duplicate'
        });
      
      // Try to create duplicate
      const res = await request(app)
        .post('/api/cat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'expense',
          name: 'Duplicate'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBeFalsy();
      expect(res.body.message).toContain('already exists');
    });
    
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/cat')
        .send({
          type: 'expense',
          name: 'Food'
        });
      
      expect(res.statusCode).toEqual(401);
    });
  });
  
  // Test getting all categories
  describe('GET /api/cat', () => {
    beforeEach(async () => {
      // Create some test categories
      await Category.create([
        {
          user: testUser._id,
          type: 'expense',
          name: 'Food'
        },
        {
          user: testUser._id,
          type: 'expense',
          name: 'Transport'
        },
        {
          user: testUser._id,
          type: 'income',
          name: 'Salary'
        }
      ]);
    });
    
    it('should get all categories for user', async () => {
      const res = await request(app)
        .get('/api/cat')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBeTruthy();
      expect(res.body.count).toEqual(3);
      expect(res.body.data.length).toEqual(3);
    });
    
    it('should filter categories by type', async () => {
      const res = await request(app)
        .get('/api/cat?type=expense')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBeTruthy();
      expect(res.body.count).toEqual(2);
      expect(res.body.data[0].type).toEqual('expense');
      expect(res.body.data[1].type).toEqual('expense');
    });
    
    it('should require authentication', async () => {
      const res = await request(app).get('/api/cat');
      
      expect(res.statusCode).toEqual(401);
    });
  });
  
  // Test getting a single category
  describe('GET /api/cat/:id', () => {
    beforeEach(async () => {
      // Create a test category
      const category = await Category.create({
        user: testUser._id,
        type: 'expense',
        name: 'Food'
      });
      
      categoryId = category._id;
    });
    
    it('should get a category by ID', async () => {
      const res = await request(app)
        .get(`/api/cat/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBeTruthy();
      expect(res.body.data._id).toEqual(categoryId.toString());
      expect(res.body.data.name).toEqual('Food');
    });
    
    it('should return 404 for non-existent category', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/cat/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBeFalsy();
    });
    
    it('should not allow access to another user\'s category', async () => {
      // Create another user
      const anotherUser = await User.create({
        name: 'Another User',
        email: 'another@example.com',
        password: 'password123',
        role: 'user'
      });
      
      // Create a category owned by another user
      const anotherCategory = await Category.create({
        user: anotherUser._id,
        type: 'expense',
        name: 'Another Food'
      });
      
      const res = await request(app)
        .get(`/api/cat/${anotherCategory._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBeFalsy();
    });
  });
  
  // Test updating a category
  describe('PUT /api/cat/:id', () => {
    beforeEach(async () => {
      // Create a test category
      const category = await Category.create({
        user: testUser._id,
        type: 'expense',
        name: 'Food'
      });
      
      categoryId = category._id;
    });
    
    it('should update a category', async () => {
      const res = await request(app)
        .put(`/api/cat/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Food'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBeTruthy();
      expect(res.body.data.name).toEqual('Updated Food');
    });
    
    it('should not update to a duplicate name of the same type', async () => {
      // Create another category
      await Category.create({
        user: testUser._id,
        type: 'expense',
        name: 'Transport'
      });
      
      // Try to update to the same name
      const res = await request(app)
        .put(`/api/cat/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Transport'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBeFalsy();
      expect(res.body.message).toContain('already exists');
    });
    
    it('should return 404 for non-existent category', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/cat/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Food'
        });
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBeFalsy();
    });
  });
  
  // Test deleting a category
  describe('DELETE /api/cat/:id', () => {
    beforeEach(async () => {
      // Create a test category
      const category = await Category.create({
        user: testUser._id,
        type: 'expense',
        name: 'Food'
      });
      
      categoryId = category._id;
    });
    
    it('should delete a category', async () => {
      const res = await request(app)
        .delete(`/api/cat/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBeTruthy();
      
      // Verify it's deleted
      const category = await Category.findById(categoryId);
      expect(category).toBeNull();
    });
    
    it('should return 404 for non-existent category', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/cat/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBeFalsy();
    });
    
    it('should not allow deleting another user\'s category', async () => {
      // Create another user
      const anotherUser = await User.create({
        name: 'Another User',
        email: 'another@example.com',
        password: 'password123',
        role: 'user'
      });
      
      // Create a category owned by another user
      const anotherCategory = await Category.create({
        user: anotherUser._id,
        type: 'expense',
        name: 'Another Food'
      });
      
      const res = await request(app)
        .delete(`/api/cat/${anotherCategory._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBeFalsy();
    });
  });
});