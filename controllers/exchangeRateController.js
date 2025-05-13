// controllers/exchangeRateController.js
const axios = require('axios');
require('dotenv').config();

// Get API Key from environment variables
const API_KEY = process.env.API_KEY;

// Export the controller function properly
const getExchangeRates = async (req, res) => {
    const { currency } = req.params;
    
    try {
        const response = await axios.get(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${currency}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching exchange rates:', error.message);
        res.status(500).json({ error: 'Failed to fetch exchange rates' });
    }
};

module.exports = {
    getExchangeRates
};