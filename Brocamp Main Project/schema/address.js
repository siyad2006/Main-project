const mongoose = require('mongoose')
const Schema=mongoose.Schema

const addressScema = new Schema({
    user: {  // xhanges user to User 
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true

    },
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
    },
    title:{
        type:String,
        require:true
    }
});

const Address= mongoose.model('address',addressScema)

module.exports=Address