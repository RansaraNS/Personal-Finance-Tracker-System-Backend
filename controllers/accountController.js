const Account = require('../models/Account');
require('dotenv').config();

// Get API Key from environment variables
const API_KEY = process.env.API_KEY;

//create new account
exports.createAccount = async (req, res, next) => {
    try {
      //add user to req.body
      req.body.user = req.user.id;

      req.body.baseCurrency = req.user.currency;
      
      const account = await Account.create(req.body);
      
      res.status(201).json({
        success: true,
        data: account
      });
    } catch (error) {
      next(error);
    }
};

//get all accounts
exports.getAccounts = async (req, res, next) => {
    try {
      const accounts = await Account.find({ user: req.user.id });
      
      res.status(200).json({
        success: true,
        count: accounts.length,
        data: accounts
      });
    } catch (error) {
      next(error);
    }
};

//get specific account by ID
exports.getAccount = async (req, res, next) => {
    try {
      const account = await Account.findById(req.params.id);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }
      
      //check user owns the account
      if (account.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this account'
        });
      }

      const updatedAccounts = await Promise.all(
        accounts.map(async (account) => {
            if (account.baseCurrency !== user.currency) {
                try {
                    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${account.baseCurrency}/${user.currency}`);
                    const exchangeRate = response.data.conversion_rate;

                    return {
                        ...account._doc,
                        convertedAmount: (account.amount * exchangeRate).toFixed(2),
                        displayCurrency: user.currency,
                    };
                } catch (error) {
                    console.error(`Failed to fetch exchange rate for ${account.baseCurrency} to ${user.currency}`);
                    return account._doc;
                }
            }
            return account._doc;
        })
      );

      
      res.status(200).json({
        success: true,
        count: updatedAccounts.length,
        data: account
      });
    } catch (error) {
      next(error);
    }
};

//update account
exports.updateAccount = async (req, res, next) => {
    try {
      let account = await Account.findById(req.params.id);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }
      
      //check user owns the account
      if (account.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this account'
        });
      }
      
      account = await Account.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });
      
      res.status(200).json({
        success: true,
        data: account
      });
    } catch (error) {
      next(error);
    }
};

//delete account
exports.deleteAccount = async (req, res, next) => {
    try {
      const account = await Account.findById(req.params.id);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }
      
      //check user owns the account
      if (account.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this account'
        });
      }
      
      await account.deleteOne();
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      next(error);
    }
};

