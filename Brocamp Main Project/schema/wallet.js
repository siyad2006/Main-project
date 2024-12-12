const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WalletSchema = new Schema({
    amount: {
        type: Number,
        required: true,
        default: 0
    },


    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    transaction: [{
        typeoftransaction: {
            type: String,
            enum: ['credit', 'debit']
        },
        amountOfTransaction: {
            type: Number,
            required: true
        },
        dateOfTransaction: {
            type: Date,
            required: true
        }
    }
    ],
    date: {
        type: Date,

    },
    
    // trannsactionAmount: {
    //     type: Number,
    //     required: true
    // }

}, { timeseries: true })

const wallet = mongoose.model('wallet', WalletSchema)
module.exports = wallet