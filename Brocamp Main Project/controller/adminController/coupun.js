const coupunDB = require('../../schema/coupunSchama')
const cartDB = require('../../schema/cart')

exports.getpage = async (req, res) => {
    const coupunname = await coupunDB.find();

    res.render('admin/coupun', { coupunname })
}

exports.addcoupun = async (req, res) => {

    const { code, minimum, maximum, coupontitle, expire } = req.body
    // console.log(req.body)
    const coupunname = await coupunDB.findOne({ code: code })
    const coupuntitles = await coupunDB.findOne({ title: coupontitle })

    // console.log(coupunname,coupuntitles)
    if (coupunname || coupuntitles) {

          res.json({ success: false, message: 'this  is already in use' })

    } else {

        

        const expires = new Date(expire)


        const coupun = new coupunDB({
            code: code,
            minimumPurchase: parseInt(minimum),
            maximumDiscount: parseInt(maximum),
            title: coupontitle,
            expiryDate: expires
        })

        await coupun.save()

        res.json({ success: true, message: 'Coupon created successfully!', redirectUrl: '/admin/coupun' });

    }



}


exports.deletecoupun = async (req, res) => {

    try {



        const id = req.params.id

       
        await cartDB.updateMany({coupun:id},{
            coupun:null
        })

        await coupunDB.findByIdAndDelete(id)
        res.redirect('/admin/coupun')
    } catch (error) {
        console.log('an error occured when delete the coupun', error)
    }
}


exports.viewcoupun = async (req, res) => {

    const user = req.params.user
    const coupun = await coupunDB.find({ user: { $ne: user } })
    // console.log(coupun)
    res.render('user/coupunview', { coupun })
} 