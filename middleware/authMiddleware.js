const jwt = require('jsonwebtoken');
const User = require('../models/User');

//protect route
exports.protect = async (req, res, next) => {
    let token;

    //get token from header 
    //checks authorization header exists and start with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    //check if token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }

    try {
        //verify the token
        const decode = jwt.verify(token, process.env.JWT_SECRET);

        //set user in the req object
        req.user = await User.findById(decode.id);

        next();
    } catch (error) {
        return res.status(401).json({
            succes: false,
            message: 'Not authorized to access this route'
        });
    }
};

//grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        //if users role is not allowed return 403
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not aithorized to access this route`
            });
        }
        //if user allowed calls next middleware/route handler
        next();
    };
};

