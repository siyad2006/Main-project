const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: false
    },
    isblocked: {
        type: Boolean,
        default: false
    },

    googleId: {
        type: String,
        unique: false,
        required: false
    },
    phonenumber: {
        type: String,
        required: false
        // default: 9999999999
    }


});


const User = mongoose.model('User', UserSchema);

module.exports = User;
