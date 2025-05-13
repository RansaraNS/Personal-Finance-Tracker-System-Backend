const cron = require('node-cron');
const Expense = require('../models/Expenses');
const Category = require('../models/Category');
const mongoose = require('mongoose');

const Budget = require('../models/Budget');
const NotificationService = require('../services/notificationService');

//create new expense
exports.createExpense = async (req, res, next) => {
    try {
      //add user to req.body
      req.body.user = req.user.id;
      
      //verify category exists and is an expense category
      const category = await Category.findById(req.body.category);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      
      if (category.type !== 'expense') {
        return res.status(400).json({
          success: false,
          message: 'Selected category is not an expense category'
        });
      }
      
      //verify user owns the category
      if (category.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to use this category'
        });
      }
      
      //create the expense
      const expense = await Expense.create(req.body);

      if (expense.isRecurring) {
        scheduleRecurringTransaction(expense);
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
      
          const newTransaction = new Expense({ ...transaction.toObject(), _id: mongoose.Types.ObjectId(), createdAt: new Date() });
          await newTransaction.save();
        });
      };

      // Check if category has a budget
    const currentBudget = await Budget.findOne({
        category: req.body.category,
        user: req.user.id,
        dateFrom: { $lte: expense.date },
        dateTo: { $gte: expense.date }
      });
      
      let notifications = [];
      
      // If a budget exists, check if thresholds have been exceeded
      if (currentBudget) {
        // Calculate current total spent in this category for the budget period
        const spentAggregate = await Expense.aggregate([
          {
            $match: {
              category: new mongoose.Types.ObjectId(req.body.category),
              user: new mongoose.Types.ObjectId(req.user.id),
              date: { 
                $gte: currentBudget.dateFrom, 
                $lte: currentBudget.dateTo
              }
            }
          },
          {
            $group: {
              _id: null,
              totalSpent: { $sum: '$amount' }
            }
          }
        ]);
        
        const totalSpent = spentAggregate.length > 0 ? spentAggregate[0].totalSpent : 0;
        
        // Check budget thresholds and get any notifications
        notifications = NotificationService.checkBudgetThresholds(
          category, 
          totalSpent, 
          currentBudget.amount,
          req.user
        );
        
        // Send notifications (in this implementation, just returns them)
        notifications = NotificationService.sendNotifications(notifications);
      }
      
      res.status(201).json({
        success: true,
        data: expense,
        notifications: notifications.length > 0 ? notifications : null
      });
    } catch (error) {
      next(error);
    }
};

//get all expenses
exports.getExpenses = async (req, res, next) => {
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
      
      const expenses = await Expense.find(query)
        .populate('category', 'name type')
        .populate('account', 'name group')
        .sort({ date: -1 });
      
      res.status(200).json({
        success: true,
        count: expenses.length,
        data: expenses
      });
    } catch (error) {
      next(error);
    }
};

//get specific expense by ID
exports.getExpense = async (req, res, next) => {
    try {
      // Check if this is a request for the summary
      if (req.params.id === 'summary') {
        return exports.getExpenseSummary(req, res, next);
      }
      
      const expense = await Expense.findById(req.params.id)
        .populate('category', 'name type')
        .populate('account', 'name group');
      
      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense transaction not found'
        });
      }
      
      //check user owns the expense record
      if (expense.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this expense transaction'
        });
      }
      
      res.status(200).json({
        success: true,
        data: expense
      });
    } catch (error) {
      next(error);
    }
};

//update expense by ID
exports.updateExpense = async (req, res, next) => {
    try {
      let expense = await Expense.findById(req.params.id);
      
      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense transaction not found'
        });
      }
      
      //check user owns the expense record
      if (expense.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this expense transaction'
        });
      }
      
      //if changing category, verify new category is expense type
      if (req.body.category && req.body.category !== expense.category.toString()) {
        const category = await Category.findById(req.body.category);
        
        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'Category not found'
          });
        }
        
        if (category.type !== 'Expense') {
          return res.status(400).json({
            success: false,
            message: 'Selected category is not an expense category'
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
      
      //save old amount and account for balance adjustment
      const oldAmount = expense.amount;
      const oldAccount = expense.account;
      
      //get new account if it's changing
      const newAccount = req.body.account || expense.account;
      
      //update the expense transaction
      expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });
      
      //adjust account balances manually if amount or account changed
      if (oldAmount !== expense.amount || oldAccount.toString() !== newAccount.toString()) {
        const Account = require('../models/Account');
        
        //revert the old transaction (add amount back to account)
        await Account.findByIdAndUpdate(
          oldAccount,
          { $inc: { amount: oldAmount } }
        );
        
        //apply the new transaction (deduct new amount from potentially new account)
        await Account.findByIdAndUpdate(
          newAccount,
          { $inc: { amount: -expense.amount } }
        );
      }
      
      res.status(200).json({
        success: true,
        data: expense
      });
    } catch (error) {
      next(error);
    }
};

//delete expense by ID
exports.deleteExpense = async (req, res, next) => {
    try {
      const expense = await Expense.findById(req.params.id);
      
      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense transaction not found'
        });
      }
      
      //check user owns the expense record
      if (expense.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this expense transaction'
        });
      }
      
      await expense.deleteOne();
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      next(error);
    }
};

//get expense summary
exports.getExpenseSummary = async (req, res, next) => {
  try {
    //set default as current month if no date specified
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

    //get total expense amount
    const totalResult = await Expense.aggregate([
      {
        $match: matchStage
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount'}
        }
      }
    ]);

    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    //get expense breakdown by category
    const categoryBreakdown = await Expense.aggregate([
      {
        $match: matchStage
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
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

    //get expense breakdown by account
    const accountBreakdown = await Expense.aggregate([
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

    //get monthly trend (last 6 month)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    
    const monthlyTrend = await Expense.aggregate([
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

    //get expense comparison with budget
    const budgetComparison = await Budget.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          dateFrom: { $lte: endDate },
          dateTo: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: '$categoryInfo'
      },
      {
        $lookup: {
          from: 'expenses',
          let: { 
            categoryId: '$category', 
            dateFrom: '$dateFrom', 
            dateTo: '$dateTo',
            userId: '$user'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$category', '$$categoryId'] },
                    { $eq: ['$user', '$$userId'] },
                    { $gte: ['$date', '$$dateFrom'] },
                    { $lte: ['$date', '$$dateTo'] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                spent: { $sum: '$amount' }
              }
            }
          ],
          as: 'expenseData'
        }
      },
      {
        $project: {
          category: '$categoryInfo.name',
          budgeted: '$amount',
          spent: {
            $cond: {
              if: { $gt: [{ $size: '$expenseData' }, 0] },
              then: { $arrayElemAt: ['$expenseData.spent', 0] },
              else: 0
            }
          },
          remaining: {
            $cond: {
              if: { $gt: [{ $size: '$expenseData' }, 0] },
              then: { $subtract: ['$amount', { $arrayElemAt: ['$expenseData.spent', 0] }] },
              else: '$amount'
            }
          },
          dateFrom: 1,
          dateTo: 1
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
        budgetComparison,
        startDate,
        endDate
      }
    });
  } catch (error) {
    next(error);
  }
};