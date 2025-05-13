const User = require('../models/User');

//register controller
exports.register = async (req, res, next) => {
    try {
        const { userName, email, password, role } = req.body;

        //check the user is already exists using email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        //validate role
        if (role && !['admin', 'user'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role must be either admin or user'
            });
        }

        //check if admin role has company email
        if (role == 'admin') {
            //check email ends with the company domain
            if (!email.endsWith('@finance.admin.io')) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot be registered as admin'
                });
            }
        }

        //create user
        const user = await User.create({
            userName,
            email,
            password,
            role: role || 'user' //default as user
        });

        //generate token
        sendTokenResponse(user, 201, res);

    } catch (error) {
        next(error);
    }
};


//login controller
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        //validate email and password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                messsage: 'Please provide and email and password'
            });
        }

        //user check
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        //check password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

        //generate token
        sendTokenResponse(user, 200, res);

    } catch (error) {
        next(error);
    }
};

//get current user controller
exports.getMe = async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
  
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
};


//helper fucntion to get token from model
//create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    //create token
    const token = user.getSignedJwtToken();

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            userName: user.userName,
            email: user.email,
            password: user.password,
            role: user.role
        }
    });
};

//admin access
//get all users
exports.getAllUsers = async (req, res, next) => {
    try {
      const users = await User.find();
      
      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      next(error);
    }
};

//get single user by ID
exports.getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            succes: false,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

//delete user by ID
exports.deleteUser = async (req, res, next) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own admin account'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User is not found'
            });
        }

        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};