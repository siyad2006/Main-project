const mongoose = require('mongoose')

const brandSchema = new mongoose.Schema({
    brandname: {
        type: String,
        required: true
    },
    islisted: {
        type: String,
        required: false,
        default: 'unlisted',

    },
    logo: {
        data: Buffer,
        contentType: String
    }
})


const Brand = mongoose.model('Brandmodel', brandSchema)

module.exports = Brand