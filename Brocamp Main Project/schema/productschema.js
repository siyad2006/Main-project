const mongoose = require('mongoose')
const category = require('./category')
const Schema = mongoose.Schema;

const productSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    discription: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "category",
        required: true
    },

    regularprice: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    image: {
        type: [String],
        required: true

    },
    isblocked: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["available", "out of stock"],
        required: true,
        default: "available"
    },
    offerprice:{
        type:Number,
        required:false
    },
    realprice:{
        type:Number,
        required:false
    },
    offerPersent:{
        type:Number,
        required:false
    },
    existOffer:{
        type:Schema.Types.ObjectId,
        required:false,
        ref:'offer'
    },
    sold:{
        type:Number,
        required:false
     
    }
}, { timestamps: true }


)

const product = mongoose.model('product', productSchema)

module.exports = product