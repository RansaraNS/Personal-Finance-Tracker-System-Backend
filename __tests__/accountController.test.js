const mongoose = require('mongoose');
const Account = require('../models/Account');
const {
  createAccount,
  getAccounts,
  getAccount,
  updateAccount,
  deleteAccount
} = require('../controllers/accountController');

jest.mock('../models/Account', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  deleteOne: jest.fn()
}));

describe('Account Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      user: { 
        id: 'user123', 
        currency: 'LKR', // Ensure this matches your test expectation
        role: 'user' 
      },
      params: { id: 'accountId123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  // Create Account Test
  describe('createAccount', () => {
    it('should create a new account', async () => {
      req.body = { group: 'cash', name: 'Test Account', amount: 100 };
      Account.create.mockResolvedValue({
        _id: 'accountId123',
        user: 'user123',
        ...req.body,
        baseCurrency: 'LKR',
        createdAt: new Date()
      });

      await createAccount(req, res, next);

      expect(Account.create).toHaveBeenCalledWith({
        ...req.body,
        user: 'user123',
        baseCurrency: 'LKR'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ name: 'Test Account' })
      }));
    });
  });

  // Get All Accounts Test
  describe('getAccounts', () => {
    it('should return all user accounts', async () => {
      const mockAccounts = [
        { _id: 'acc1', user: 'user123', name: 'Account 1' },
        { _id: 'acc2', user: 'user123', name: 'Account 2' }
      ];
      Account.find.mockResolvedValue(mockAccounts);

      await getAccounts(req, res, next);

      expect(Account.find).toHaveBeenCalledWith({ user: 'user123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        count: 2,
        data: mockAccounts
      }));
    });
  });

  // Get Single Account Test
  describe('getAccount', () => {
    it('should return account if authorized', async () => {
      const mockAccount = { _id: 'accountId123', user: 'user123', name: 'Test Account' };
      Account.findById.mockResolvedValue(mockAccount);

      await getAccount(req, res, next);

      expect(Account.findById).toHaveBeenCalledWith('accountId123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockAccount
      }));
    });

    it('should return 403 if unauthorized', async () => {
      const mockAccount = { _id: 'accountId123', user: 'anotherUser' };
      Account.findById.mockResolvedValue(mockAccount);

      await getAccount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to access this account'
      });
    });
  });

  // Update Account Test
  describe('updateAccount', () => {
    it('should update account if authorized', async () => {
      const mockAccount = { _id: 'accountId123', user: 'user123' };
      Account.findById.mockResolvedValue(mockAccount);
      Account.findByIdAndUpdate.mockResolvedValue({ ...mockAccount, name: 'Updated Account' });

      req.body = { name: 'Updated Account' };

      await updateAccount(req, res, next);

      expect(Account.findByIdAndUpdate).toHaveBeenCalledWith(
        'accountId123',
        { name: 'Updated Account' },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ name: 'Updated Account' })
      }));
    });
  });

  // Delete Account Test
  describe('deleteAccount', () => {
    it('should delete account if authorized', async () => {
      const mockAccount = { _id: 'accountId123', user: 'user123' };
      Account.findById.mockResolvedValue(mockAccount);
      Account.deleteOne = jest.fn().mockResolvedValue({});

      await deleteAccount(req, res, next);

      expect(Account.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: {} });
    });
  });
});