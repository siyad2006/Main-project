const mongoose = require('mongoose')
const Schema= mongoose.Schema

const offerSchema= new Schema({
    name:{
        type:String,
        required:true
    },
    category:{
        type:Schema.Types.ObjectId,
        ref:'category',
        required:false
    },
    discountValue:{
        type:Number,
        required:true,
        min:0,
        max:100
    },
    dicription:{
        type:String,
        required:true
    },
    start:{
        type:Date,
        required:false
    },
    expire:{
        type:Date,
        required:false
    },
    status:{
        type:Boolean,
        required:false,
        default:true
    },
    tyoffer:{
        type:String,
        enum:['category','product'],
        required:false
    },
    products:{
        type:Schema.Types.ObjectId,
        ref:'product',
        required:false
    }
},{timestamps:true})

const offer= mongoose.model('offer',offerSchema)
module.exports=offer