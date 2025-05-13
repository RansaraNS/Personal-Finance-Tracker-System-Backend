const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoute');
const categoryRoutes = require('./routes/categoryRoutes');
const expensesRoutes = require('./routes/expensesRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const transferRoute = require('./routes/transferRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const savingsRoute = require('./routes/savingsRoutes');
const adminRoutes = require('./routes/adminRoute');
const getExchangeRate = require('./routes/exchangeRateRoute');

//load environment varible
dotenv.config();

//connection to db
connectDB();

const app = express();

//midlleware
app.use(express.json());
app.use(cors());

//routes
app.use('/api/ad', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/acc', accountRoutes);
app.use('/api/cat', categoryRoutes);
app.use('/api/exp', expensesRoutes);
app.use('/api/inc', incomeRoutes);
app.use('/api/tra', transferRoute);
app.use('/api/bud', budgetRoutes);
app.use('/api/sav', savingsRoute);
app.use('/api/exchange', getExchangeRate);

//error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        erorr: err.message || 'Server Error'
    });
});

if (process.env.NODE_ENV !== "test") {
    const PORT = process.env.PORT || 2139;
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    module.exports = server; // ✅ Export the server instance for optional closing
} else {
    module.exports = app; // ✅ Export only the app in test mode
}