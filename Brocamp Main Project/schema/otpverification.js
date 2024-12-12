const mongoose = require('mongoose')

const otpSchema = new mongoose.Schema({
    email: String,
    otp: String,
    createdAt: { type: Date, default: Date.now }
});

otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 120 });

const OTP = mongoose.model('otpverification', otpSchema);


module.exports = OTP;