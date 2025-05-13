const Budget = require('../models/Budget');
const Expense = require('../models/Expenses');
const Category = require('../models/Category');

//create new budget
exports.createBudget = async (req, res, next) => {
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
          message: 'Budgets can only be set for expense categories'
        });
      }
      
      //verify user owns the category
      if (category.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to use this category'
        });
      }
      
      //check if budget for this category and date range already exists
      const existingBudget = await Budget.findOne({
        user: req.user.id,
        category: req.body.category,
        $or: [
          {
            dateFrom: { $lte: req.body.dateTo },
            dateTo: { $gte: req.body.dateFrom }
          }
        ]
      });
      
      if (existingBudget) {
        return res.status(400).json({
          success: false,
          message: 'A budget for this category within the specified date range already exists'
        });
      }
      
      const budget = await Budget.create(req.body);
      
      res.status(201).json({
        success: true,
        data: budget
      });
    } catch (error) {
      next(error);
    }
};

//get all budgets
exports.getBudgets = async (req, res, next) => {
    try {
      //build query
      let query = { user: req.user.id };
      
      //filter by active budgets (current date falls within budget period)
      if (req.query.active === 'true') {
        const currentDate = new Date();
        query.dateFrom = { $lte: currentDate };
        query.dateTo = { $gte: currentDate };
      }
      
      //filter by category if provided
      if (req.query.category) {
        query.category = req.query.category;
      }
      
      //filter by date range if provided
      if (req.query.date) {
        const date = new Date(req.query.date);
        query.dateFrom = { $lte: date };
        query.dateTo = { $gte: date };
      }
      
      const budgets = await Budget.find(query)
        .populate('category', 'name type')
        .sort({ dateFrom: 1 });
      
      res.status(200).json({
        success: true,
        count: budgets.length,
        data: budgets
      });
    } catch (error) {
      next(error);
    }
};

//get specific budget
exports.getBudget = async (req, res, next) => {
    try {
      const budget = await Budget.findById(req.params.id)
        .populate('category', 'name type');
      
      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }
      
      //make sure user owns the budget
      if (budget.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this budget'
        });
      }
      
      //get expenses for this budget category and time period
      const expenses = await Expense.find({
        user: req.user.id,
        category: budget.category,
        date: {
          $gte: budget.dateFrom,
          $lte: budget.dateTo
        }
      }).sort({ date: -1 });
      
      //calculate total spent
      const spent = expenses.reduce((acc, expense) => acc + expense.amount, 0);
      
      //calculate remaining budget
      const remaining = budget.amount - spent;
      
      //calculate percentage spent
      const percentageSpent = (spent / budget.amount) * 100;
      
      res.status(200).json({
        success: true,
        data: {
          budget,
          stats: {
            spent,
            remaining,
            percentageSpent
          },
          expenses
        }
      });
    } catch (error) {
      next(error);
    }
};

//update budget
exports.updateBudget = async (req, res, next) => {
    try {
      let budget = await Budget.findById(req.params.id);
      
      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }
      
      //make sure user owns the budget
      if (budget.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this budget'
        });
      }
      
      //if changing category, verify new category is expense type
      if (req.body.category && req.body.category !== budget.category.toString()) {
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
            message: 'Budgets can only be set for expense categories'
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
      
      //check if updated date range would overlap with another budget for the same category
      if (req.body.dateFrom || req.body.dateTo) {
        const dateFrom = req.body.dateFrom ? new Date(req.body.dateFrom) : budget.dateFrom;
        const dateTo = req.body.dateTo ? new Date(req.body.dateTo) : budget.dateTo;
        
        const existingBudget = await Budget.findOne({
          _id: { $ne: req.params.id },
          user: req.user.id,
          category: req.body.category || budget.category,
          $or: [
            {
              dateFrom: { $lte: dateTo },
              dateTo: { $gte: dateFrom }
            }
          ]
        });
        
        if (existingBudget) {
          return res.status(400).json({
            success: false,
            message: 'A budget for this category within the specified date range already exists'
          });
        }
      }
      
      budget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });
      
      res.status(200).json({
        success: true,
        data: budget
      });
    } catch (error) {
      next(error);
    }
};

//delete budget
exports.deleteBudget = async (req, res, next) => {
    try {
      const budget = await Budget.findById(req.params.id);
      
      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }
      
      //make sure user owns the budget
      if (budget.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this budget'
        });
      }
      
      await budget.deleteOne();
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      next(error);
    }
};