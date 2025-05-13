const axios = require('axios');
const User = require('../models/User');
const Account = require('../models/Account');
require('dotenv').config();

// Get API Key from environment variables
const API_KEY = process.env.API_KEY;

// Update User Currency and Convert Account Amounts
exports.updateUserCurrency = async (req, res, next) => {
    try {
        const { currency } = req.body;  // New currency
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.currency === currency) {
            return res.status(400).json({ success: false, message: 'Currency is already set to this value' });
        }

        // Fetch exchange rate from the user's current currency to the new one
        const response = await axios.get(`https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${user.currency}/${currency}`);
        const exchangeRate = response.data.conversion_rate;

        if (!exchangeRate) {
            return res.status(500).json({ success: false, message: 'Failed to fetch exchange rate' });
        }

        // Update all account amounts based on new currency
        const accounts = await Account.find({ user: userId });
        for (let account of accounts) {
            account.amount = (account.amount * exchangeRate).toFixed(2);
            account.baseCurrency = currency;
            await account.save();
        }

        // Update user's preferred currency
        user.currency = currency;
        await user.save();

        res.status(200).json({
            success: true,
            message: `Currency updated to ${currency}, and all account amounts converted.`,
            exchangeRate,
        });

    } catch (error) {
        next(error);
    }
};
