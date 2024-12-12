const mongoose = require('mongoose');
// const productDB = require('./productschema');

const Schema = mongoose.Schema;


const cartSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
                required: false, 
                min: 1 
            }
        }
    ],
    // totalAmount: {
    //     type: Number,
    //     required: false,
    //     default: 0  
    // },
    coupun:{
        type:Schema.Types.ObjectId,
        required:false,
        ref:'Coupon'
    }
}, { timestamps: true });

const cart = mongoose.model('cart', cartSchema)

module.exports = cart