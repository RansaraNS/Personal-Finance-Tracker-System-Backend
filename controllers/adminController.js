const mongoose = require('mongoose');
const Income = require('../models/Income');
const Expense = require('../models/Expenses');
const User = require('../models/User');
const Account = require('../models/Account');

//get summary of all incomes across all users
exports.getAllUserIncomeSummary = async (req, res, next) => {
  try {
    //default to current month if no dates provided
    let startDate = req.query.startDate 
      ? new Date(req.query.startDate) 
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      
    let endDate = req.query.endDate 
      ? new Date(req.query.endDate) 
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    
    //get total income amount across all users
    const totalResult = await Income.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const total = totalResult.length > 0 ? totalResult[0].total : 0;
    
    //get breakdown by user
    const userBreakdown = await Income.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$user',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userEmail: '$user.email',
          amount: 1,
          count: 1,
          percentage: { $multiply: [{ $divide: ['$amount', total] }, 100] }
        }
      },
      {
        $sort: { amount: -1 }
      }
    ]);
    
    //get income breakdown by category across all users
    const categoryBreakdown = await Income.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
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
    
    //get monthly trend (last 6 months) across all users
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    
    const monthlyTrend = await Income.aggregate([
      {
        $match: {
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
        userBreakdown,
        categoryBreakdown,
        monthlyTrend,
        startDate,
        endDate
      }
    });
  } catch (error) {
    next(error);
  }
};

//get summary of all expenses across all users
exports.getAllUserExpenseSummary = async (req, res, next) => {
  try {
    //default to current month if no dates provided
    let startDate = req.query.startDate 
      ? new Date(req.query.startDate) 
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      
    let endDate = req.query.endDate 
      ? new Date(req.query.endDate) 
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    
    //get total expense amount across all users
    const totalResult = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const total = totalResult.length > 0 ? totalResult[0].total : 0;
    
    //get breakdown by user
    const userBreakdown = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$user',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userEmail: '$user.email',
          amount: 1,
          count: 1,
          percentage: { $multiply: [{ $divide: ['$amount', total] }, 100] }
        }
      },
      {
        $sort: { amount: -1 }
      }
    ]);
    
    //get expense breakdown by category across all users
    const categoryBreakdown = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
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
    
    //get monthly trend (last 6 months) across all users
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    
    const monthlyTrend = await Expense.aggregate([
      {
        $match: {
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
        userBreakdown,
        categoryBreakdown,
        monthlyTrend,
        startDate,
        endDate
      }
    });
  } catch (error) {
    next(error);
  }
};

//get combined income/expense summary for a specific user (admin access)
exports.getUserFinancialSummary = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    
    //validate user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    //default to current month if no dates provided
    let startDate = req.query.startDate 
      ? new Date(req.query.startDate) 
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      
    let endDate = req.query.endDate 
      ? new Date(req.query.endDate) 
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    
    //get total income for the user
    const totalIncomeResult = await Income.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const totalIncome = totalIncomeResult.length > 0 ? totalIncomeResult[0].total : 0;
    
    //get total expense for the user
    const totalExpenseResult = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const totalExpense = totalExpenseResult.length > 0 ? totalExpenseResult[0].total : 0;
    
    //calculate net (profit/loss)
    const netAmount = totalIncome - totalExpense;
    
    //get all accounts for this user
    const accounts = await Account.find({ user: userId });
    const totalBalance = accounts.reduce((sum, account) => sum + account.amount, 0);
    
    //get monthly trends for both income and expense
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    
    //income trend
    const incomeMonthlyTrend = await Income.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
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
    
    //expense trend
    const expenseMonthlyTrend = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
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
    
    //get top 5 expense categories
    const topExpenseCategories = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' }
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
          categoryName: '$category.name',
          amount: 1,
          percentage: { $multiply: [{ $divide: ['$amount', totalExpense] }, 100] }
        }
      },
      {
        $sort: { amount: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    //get top 5 income categories
    const topIncomeCategories = await Income.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' }
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
          categoryName: '$category.name',
          amount: 1,
          percentage: { $multiply: [{ $divide: ['$amount', totalIncome] }, 100] }
        }
      },
      {
        $sort: { amount: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: userExists._id,
          name: userExists.name,
          email: userExists.email
        },
        summary: {
          totalIncome,
          totalExpense,
          netAmount,
          totalBalance,
          savingsRate: totalIncome > 0 ? (netAmount / totalIncome) * 100 : 0
        },
        incomeMonthlyTrend,
        expenseMonthlyTrend,
        topExpenseCategories,
        topIncomeCategories,
        startDate,
        endDate
      }
    });
  } catch (error) {
    next(error);
  }
};

//get a list of all users with their financial snapshot
exports.getAllUsersFinancialSnapshot = async (req, res, next) => {
  try {
    const users = await User.find({}, 'name email createdAt');
    
    //get current month range for financial snapshot
    const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    
    //get all users with financial summary
    const userSnapshots = await Promise.all(
      users.map(async (user) => {
        //get total income for this month
        const incomeResult = await Income.aggregate([
          {
            $match: {
              user: new mongoose.Types.ObjectId(user._id),
              date: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);
        
        //get total expense for this month
        const expenseResult = await Expense.aggregate([
          {
            $match: {
              user: new mongoose.Types.ObjectId(user._id),
              date: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);
        
        //get account balances
        const accounts = await Account.find({ user: user._id }, 'name amount');
        const totalBalance = accounts.reduce((sum, account) => sum + account.amount, 0);
        
        //galculate totals and percentages
        const monthlyIncome = incomeResult.length > 0 ? incomeResult[0].total : 0;
        const monthlyExpense = expenseResult.length > 0 ? expenseResult[0].total : 0;
        const netAmount = monthlyIncome - monthlyExpense;
        const savingsRate = monthlyIncome > 0 ? (netAmount / monthlyIncome) * 100 : 0;
        
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          monthlyIncome,
          monthlyExpense,
          netAmount,
          savingsRate,
          totalBalance,
          accountCount: accounts.length
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: userSnapshots.length,
      data: userSnapshots
    });
  } catch (error) {
    next(error);
  }
};