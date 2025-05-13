const Savings = require('../models/Savings');

//create new savings
exports.createSavings = async (req, res, next) => {
    try {
      // Add user to req.body
      req.body.user = req.user.id;
      
      const savings = await Savings.create(req.body);
      
      res.status(201).json({
        success: true,
        data: savings
      });
    } catch (error) {
      next(error);
    }
};

//get all savings
exports.getSavings = async (req, res, next) => {
    try {
      //build query
      let query = { user: req.user.id };
      
      //filter by status if provided
      if (req.query.status) {
        query.status = req.query.status;
      }
      
      const savings = await Savings.find(query).sort({ targetDate: 1 });
      
      res.status(200).json({
        success: true,
        count: savings.length,
        data: savings
      });
    } catch (error) {
      next(error);
    }
};

//get specific savings
exports.getSaving = async (req, res, next) => {
    try {
      const saving = await Savings.findById(req.params.id);
      
      if (!saving) {
        return res.status(404).json({
          success: false,
          message: 'Saving goal not found'
        });
      }
      
      //check user owns the saving goal
      if (saving.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this saving goal'
        });
      }
      
      //calculate progress percentage
      const progressPercentage = (saving.currentAmount / saving.amount) * 100;
      
      //calculate time left
      const currentDate = new Date();
      const targetDate = new Date(saving.targetDate);
      const timeLeft = targetDate - currentDate;
      const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
      
      //calculate amount needed to save per day to reach goal
      const amountNeeded = saving.amount - saving.currentAmount;
      
      //calculate daily savings required (if days left > 0)
      const dailySavingsRequired = daysLeft > 0 ? amountNeeded / daysLeft : 0;
      
      //return response with additional calculated fields
      res.status(200).json({
        success: true,
        data: {
          ...saving._doc,
          progressPercentage: parseFloat(progressPercentage.toFixed(2)),
          daysLeft: daysLeft > 0 ? daysLeft : 0,
          amountNeeded: parseFloat(amountNeeded.toFixed(2)),
          dailySavingsRequired: parseFloat(dailySavingsRequired.toFixed(2)),
          isAchievable: daysLeft > 0
        }
      });
    } catch (error) {
      next(error);
    }
};

//update savings
exports.updateSaving = async (req, res, next) => {
    try {
      let saving = await Savings.findById(req.params.id);
      
      if (!saving) {
        return res.status(404).json({
          success: false,
          message: 'Saving goal not found'
        });
      }
      
      // Make sure user owns the saving goal
      if (saving.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this saving goal'
        });
      }
      
      saving = await Savings.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });
      
      res.status(200).json({
        success: true,
        data: saving
      });
    } catch (error) {
      next(error);
    }
};


//delete savings
exports.deleteSaving = async (req, res, next) => {
    try {
      const saving = await Savings.findById(req.params.id);
      
      if (!saving) {
        return res.status(404).json({
          success: false,
          message: 'Saving goal not found'
        });
      }
      
      //check user owns the saving goal
      if (saving.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this saving goal'
        });
      }
      
      await saving.deleteOne();
      
      res.status(200).json({
        success: true,
        data: {}
      });
    }  catch (error) {
      next(error);
    }
};

//update savings goal progress
exports.updateSavingProgress = async (req, res, next) => {
    try {
      let saving = await Savings.findById(req.params.id);
      
      if (!saving) {
        return res.status(404).json({
          success: false,
          message: 'Saving goal not found'
        });
      }
      
      //make sure user owns the saving goal
      if (saving.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this saving goal'
        });
      }
      
      //update the current amount
      const newAmount = req.body.currentAmount;
      
      if (newAmount === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Current amount is required'
        });
      }
      
      //check if goal is completed
      let status = saving.status;
      if (newAmount >= saving.amount) {
        status = 'Completed';
      } else if (status === 'Completed' && newAmount < saving.amount) {
        status = 'In Progress';
      }
      
      saving = await Savings.findByIdAndUpdate(
        req.params.id,
        { 
          currentAmount: newAmount,
          status: status
        },
        {
          new: true,
          runValidators: true
        }
      );
      
      res.status(200).json({
        success: true,
        data: saving
      });
    } catch (error) {
      next(error);
    }
};