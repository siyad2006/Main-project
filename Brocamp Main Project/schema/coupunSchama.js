const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = new Schema({
    user:[ {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }],
    maximumDiscount: {
        type: Number,
        required: true
    },
    minimumPurchase: {
        type: Number, 
        required: true 
    },
    code: {
        type: String,
        required: true 
    },
    isActive: {
        type: Boolean,
        default: true
    },
    title: {
        type: String,
        required: true 
    },
    discountType: {
        type: String,
        // enum: ['price', 'percent'], 
        default:'price',
        required: false
    },
    expiryDate: {
        type: Date,
        require: true
    }
},{timestamps:true});

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
