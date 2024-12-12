const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    categoryname: {
        type: String,
        required: true
    },
    discription: {
        type: String,
        required: false
    },
    isblocked: {
        type: String,
        default: 'Unlisted'
    },
    existOffer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'offer',
        required:false
    },
    sold:{
        type:Number,
        requried:false,
        min:0,
        default:0
    }
});


const categoryModel = mongoose.model('category', categorySchema);

module.exports = categoryModel;
