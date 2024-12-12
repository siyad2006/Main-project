const mongoose=require('mongoose')
// const { default: products } = require('razorpay/dist/types/products')

const Schema=mongoose.Schema

const wishlistScema= new Schema({
    user:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:'User'

    },
    products:[{
        type:Schema.Types.ObjectId,
        required:true,
        ref:'product'
    }]

})

const wishlist=mongoose.model('wishlist',wishlistScema)

module.exports=wishlist