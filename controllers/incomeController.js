const cron = require('node-cron');
const Income = require('../models/Income');
const Category = require('../models/Category');
const mongoose = require('mongoose');


const NotificationService = require('../services/notificationService');

//create new income
exports.createIncome = async (req, res, next) => {
    try {
      //add user to req.body
      req.body.user = req.user.id;
      
      //verify category exists and is an income category
      const category = await Category.findById(req.body.category);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      
      if (category.type !== 'income') {
        return res.status(400).json({
          success: false,
          message: 'Selected category is not an income category'
        });
      }
      
      //verify user owns the category
      if (category.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to use this category'
        });
      }
      
      const income = await Income.create(req.body);

      if (income.isRecurring) {
        scheduleRecurringTransaction(income);
      }
      
      const scheduleRecurringTransaction = async (transaction) => {
        let cronExpression;

        if (transaction.recurringPattern === 'daily') cronExpression = '0 0 * * *';
        else if (transaction.recurringPattern === 'weekly') cronExpression = '0 0 * * 0';
        else if (transaction.recurringPattern === 'monthly') cronExpression = '0 0 1 * *';

        if (!cronExpression) return;

        cron.schedule(cronExpression, async () => {
          const existingTransaction = await Income.findById(transaction._id);
          if (!existingTransaction || (transaction.endDate && new Date() > transaction.endDate)) return;

          const newTransaction = new Income({ ...transaction.toObject(), _id: mongoose.Types.ObjectId(), createdAt: new Date() });
          await newTransaction.save();
        });
      };

      res.status(201).json({
        success: true,
        data: income
      });
    } catch (error) {
      next(error);
    }
};

//get all income
exports.getIncomes = async (req, res, next) => {
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
      
      //filter by category if provided
      if (req.query.category) {
        query.category = req.query.category;
      }
      
      //filter by account if provided
      if (req.query.account) {
        query.account = req.query.account;
      }
      
      const incomes = await Income.find(query)
        .populate('category', 'name type')
        .populate('account', 'name group')
        .sort({ date: -1 });
      
      res.status(200).json({
        success: true,
        count: incomes.length,
        data: incomes
      });
    } catch (error) {
      next(error);
    }
};

//get specific income by ID
exports.getIncome = async (req, res, next) => {
    try {
      // Check if this is a request for the summary
      if (req.params.id === 'summary') {
        return exports.getIncomeSummary(req, res, next);
      }

      const income = await Income.findById(req.params.id)
        .populate('category', 'name type')
        .populate('account', 'name group');
      
      if (!income) {
        return res.status(404).json({
          success: false,
          message: 'Income transaction not found'
        });
      }
      
      //check user owns the income record
      if (income.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this income transaction'
        });
      }
      
      res.status(200).json({
        success: true,
        data: income
      });
    } catch (error) {
      next(error);
    }
  };

//update income by ID
exports.updateIncome = async (req, res, next) => {
    try {
      let income = await Income.findById(req.params.id);
      
      if (!income) {
        return res.status(404).json({
          success: false,
          message: 'Income transaction not found'
        });
      }
      
      //check owns the income record
      if (income.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this income transaction'
        });
      }
      
      //if changing category, verify new category is income type
      if (req.body.category && req.body.category !== income.category.toString()) {
        const category = await Category.findById(req.body.category);
        
        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'Category not found'
          });
        }
        
        if (category.type !== 'income') {
          return res.status(400).json({
            success: false,
            message: 'Selected category is not an income category'
          });
        }
        
        //verify user owns the category
        if (category.user.toString() !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to use this category'
          });
        }
      }
      
      // To handle account balance updates properly when modifying an income:
      // 1. Remove the original amount from the original account
      // 2. Add the new amount to the possibly new account
      // This is more complex and would require a transaction
      // For simplicity, we'll handle this by removing and re-creating
      
      //save old amount and account for balance adjustment
      const oldAmount = income.amount;
      const oldAccount = income.account;
      
      //get new account if it's changing
      const newAccount = req.body.account || income.account;
      
      //update the income transaction
      income = await Income.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });
      
      //adjust account balances manually if amount or account changed
      if (oldAmount !== income.amount || oldAccount.toString() !== newAccount.toString()) {
        const Account = require('../models/Account');
        
        //revert the old transaction
        await Account.findByIdAndUpdate(
          oldAccount,
          { $inc: { amount: -oldAmount } }
        );
        
        //apply the new transaction
        await Account.findByIdAndUpdate(
          newAccount,
          { $inc: { amount: income.amount } }
        );
      }
      
      res.status(200).json({
        success: true,
        data: income
      });
    } catch (error) {
      next(error);
    }
  };


  //delete income by ID
  exports.deleteIncome = async (req, res, next) => {
    try {
      const income = await Income.findById(req.params.id);
      
      if (!income) {
        return res.status(404).json({
          success: false,
          message: 'Income transaction not found'
        });
      }
      
      //check user owns the income record
      if (income.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this income transaction'
        });
      }
      
      await income.deleteOne();
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      next(error);
    }
  };

  //get income summary
  exports.getIncomeSummary = async (req, res, next) => {
    try {
      //default to current month if no dates provided
      let startDate = req.query.startDate 
        ? new Date(req.query.startDate) 
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        
      let endDate = req.query.endDate 
        ? new Date(req.query.endDate) 
        : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

        let matchStage = {
          user: new mongoose.Types.ObjectId(req.user.id),
          date: { $gte: startDate, $lte: endDate }
        };

        if (req.query.label) {
          matchStage.label = req.query.label;
        }
      
      //get total income amount
      const totalResult = await Income.aggregate([
        {
          $match: matchStage
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      const total = totalResult.length > 0 ? totalResult[0].total : 0;
      
      //get income breakdown by category
      const categoryBreakdown = await Income.aggregate([
        {
          $match: matchStage
        },
        {
          $group: {
            _id: '$category',
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
            labels: { $push: '$label'}
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $unwind: '$category'
        },
        {
          $project: {
            categoryId: '$_id',
            categoryName: '$category.name',
            amount: 1,
            count: 1,
            percentage: { $multiply: [{ $divide: ['$amount', total] }, 100] }
          }
        },
        {
          $sort: { amount: -1 }
        }
      ]);
      
      //get income breakdown by account
      const accountBreakdown = await Income.aggregate([
        {
          $match: matchStage
        },
        {
          $group: {
            _id: '$account',
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'accounts',
            localField: '_id',
            foreignField: '_id',
            as: 'account'
          }
        },
        {
          $unwind: '$account'
        },
        {
          $project: {
            accountId: '$_id',
            accountName: '$account.name',
            accountGroup: '$account.group',
            amount: 1,
            count: 1,
            percentage: { $multiply: [{ $divide: ['$amount', total] }, 100] }
          }
        },
        {
          $sort: { amount: -1 }
        }
      ]);
      
      //get monthly trend (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      
      const monthlyTrend = await Income.aggregate([
        {
          $match: {
                    user: new mongoose.Types.ObjectId(req.user.id),
                    date: { $gte: sixMonthsAgo }
                  }
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1
          }
        },
        {
          $project: {
            period: {
              $concat: [
                { $toString: '$_id.year' }, 
                '-', 
                { $toString: '$_id.month' }
              ]
            },
            amount: 1,
            count: 1
          }
        }
      ]);
      
      res.status(200).json({
          success: true,
          data: {
            total,
            categoryBreakdown,
            accountBreakdown,
            monthlyTrend,
            startDate,
            endDate
          }
        });
      } catch (error) {
        next(error);
      }
  };