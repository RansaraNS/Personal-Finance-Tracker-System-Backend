const Transfer = require('../models/Transfer');
const Account = require('../models/Account');

//create new transfer
exports.createTransfer = async (req, res, next) => {
    try {
      //add user to req.body
      req.body.user = req.user.id;
      
      //verify accounts exist and belong to user
      const fromAccount = await Account.findById(req.body.fromAccount);
      const toAccount = await Account.findById(req.body.toAccount);
      
      if (!fromAccount || !toAccount) {
        return res.status(404).json({
          success: false,
          message: 'One or both accounts not found'
        });
      }
      
      //check user owns both accounts
      if (fromAccount.user.toString() !== req.user.id || toAccount.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to use these accounts'
        });
      }
      
      //check if from account has sufficient balance
      if (fromAccount.amount < req.body.amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient funds in source account'
        });
      }
      
      //check if accounts are different
      if (req.body.fromAccount === req.body.toAccount) {
        return res.status(400).json({
          success: false,
          message: 'Cannot transfer to the same account'
        });
      }
      
      const transfer = await Transfer.create(req.body);
      
      res.status(201).json({
        success: true,
        data: transfer
      });
    } catch (error) {
      next(error);
    }
};

//get all transfers
exports.getTransfers = async (req, res, next) => {
    try {
      //build query
      let query = { user: req.user.id };
      
      //filter by date range if provided
      if (req.query.startDate && req.query.endDate) {
        query.date = {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate)
        };
      }
      
      //filter by account if provided
      if (req.query.account) {
        query.$or = [
          { fromAccount: req.query.account },
          { toAccount: req.query.account }
        ];
      }
      
      const transfers = await Transfer.find(query)
        .populate('fromAccount', 'name group')
        .populate('toAccount', 'name group')
        .sort({ date: -1 });
      
      res.status(200).json({
        success: true,
        count: transfers.length,
        data: transfers
      });
    } catch (error) {
      next(error);
    }
};

//get specific transfer by ID
exports.getTransfer = async (req, res, next) => {
    try {
      const transfer = await Transfer.findById(req.params.id)
        .populate('fromAccount', 'name group')
        .populate('toAccount', 'name group');
      
      if (!transfer) {
        return res.status(404).json({
          success: false,
          message: 'Transfer not found'
        });
      }
      
      //check user owns the transfer record
      if (transfer.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this transfer'
        });
      }
      
      res.status(200).json({
        success: true,
        data: transfer
      });
    } catch (error) {
      next(error);
    }
};

//delete transfer by ID
exports.deleteTransfer = async (req, res, next) => {
    try {
      const transfer = await Transfer.findById(req.params.id);
      
      if (!transfer) {
        return res.status(404).json({
          success: false,
          message: 'Transfer not found'
        });
      }
      
      //check user owns the transfer record
      if (transfer.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this transfer'
        });
      }
      
      await transfer.deleteOne();
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      next(error);
    }
  };