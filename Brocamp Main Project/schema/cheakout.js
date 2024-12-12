
const mongoose = require('mongoose');
const Schema = mongoose.Schema
const cheakoutSchema = new Schema({
    userID: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentMethods: {
        type: String,
        enum: ['cod', 'razorpay','wallet'],
        required: true
    },
    totalprice: {
        type: Number,
        required: false
    },
    products: [
        {
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'product',
                required: true
            },
            qty: {
                type: Number,
                required: true
            },
            soldprice: {
                type: Number,
                required: false

            }

        }
    ],
    status: {
        type: String,
        enum: ['pending', 'shipping', 'delivered', 'canceled', 'return','payment-pending'],
        required: true
    },
    address: {


        name: {
            type: String,
            require: true
        },
        phone: {
            type: Number,
            require: true
        },
        houseAddress: {
            type: String,
            require: true
        },
        city: {
            type: String,
            require: true
        },
        state: {
            type: String,
            require: true
        },
        pincode: {
            type: Number,
            require: true
        },
        country: {
            type: String,
            require: true
        }

    },
    discount: {
        type: Number,
        required: false,
        default: 0
    },
    applayedcoupun: {
        type: Number,
        required: false,
        default: 0
    },
    paymentStatus: {
        type: Boolean,
        required: false,
        default: false
    }
    // orderId:{
    //     type:String,
    //     require:true
    // }

}, { timestamps: true })



const cheakout = mongoose.model('cheakout', cheakoutSchema)

module.exports = cheakout
