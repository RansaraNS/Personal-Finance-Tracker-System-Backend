const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        trim: true,
        maxlength: [30, 'userName connot be more than 30 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ],
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user',

    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,
    },
    currency: {
        type: String,
        default: 'LKR',
        uppercase: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

//password pre save middlware
userSchema.pre('save', async function(next) {
    //check if the passowrd modified
    if (!this.isModified('password')) {
        next();
    }

    //10 rounds for salting added security
    const salt = await bcrypt.genSalt(10);
    //encrypt passowrd using bcrypt
    this.password = await bcrypt.hash(this.password, salt);
});

//sign jwt and return
userSchema.methods.getSignedJwtToken = function() {
    return jwt.sign(
        //include userid and role
        {id: this._id, role: this.role},
        //uses secret key from environment variable
        process.env.JWT_SECRET,
        //set and expiration for the token
        {expiresIn: process.env.JWT_EXPIRE}
    );
};

//match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    //compare entered password with stored hashed passowrd using bcrypt comparison method
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);