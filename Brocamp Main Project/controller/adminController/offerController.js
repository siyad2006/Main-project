const offerDB = require('../../schema/offerSchema')
const categoryDB = require('../../schema/category')
const productDB = require('../../schema/productschema')

// const { success } = require('../userController/cheakoutController')

exports.addoffer = async (req, res) => {
    const category = await categoryDB.find()
    res.render('admin/addoffer', { category })
}



exports.createoffer = async (req, res) => {
    console.log(req.body)

    const name = req.body.name
    const discription = req.body.discription
    const category = req.body.category
    const persent = req.body.persent
    const Expire = req.body.date
    const date = new Date(Expire)
    const startdate = new Date(req.body.startdate)

    if (persent > 75) {
        return res.status(404).send('cannot add more than 75% ');
    }
    const isnameactive = await offerDB.findOne({ name: name })
    console.log(isnameactive)

    if (isnameactive) {
        return res.status(404).send('this name is already existas')
    }

    startdate.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    console.log(startdate)
    const today = new Date()
    const d = Date.now();
  
    if (startdate < today.setHours(0,0,0,0)) {
        return res.status(404).send('Add a valid date');
    }

    if (startdate > date) {
        return res.status(404).send('Start date cannot be later than expire date');
    }


    const products = await productDB.find({ category: category }).populate('existOffer')

    let flag = false

    for (let i = 0; i < products.length; i++) {
        if (products[i].existOffer) {
            flag = true
        }
    }

    if (products && products.length > 0 && flag == true) {

        // let biggerDiscount = products.find((value) => {
        //       value.existOffer>big 
        //       big=value.existOffer
        // })

        let big = 0;

        for (let j = 0; j < products.length; j++) {
            if (products[j].existOffer && products[j].existOffer.discountValue > big) {
                big = products[j].existOffer.discountValue;
            }
        }

        console.log(big);   

        const getoffer = await offerDB.findOne({ _id: products[0].existOffer })
        console.log('this is the get offer : ', getoffer)
        if (big > persent) {
            return res.status(404).send(' in this category  product already have offer bigger than it , so first delete the product offfer')
        }
        // start 
        // if (getoffer.discountValue < persent) {
        

        console.log('we can apply that offer , because our offer is bigger ')
        //  return res.status(404).send('apply new offer to it  ')




        // ivide existOffer aayirunnu

        const offeredproduct = await productDB.find({ category: category })
        // console.log(offeredproduct)

        const offer = new offerDB({
            name: name,
            dicription: discription,
            discountValue: persent,
            category: category,
            expire: date,
            start: startdate,
            tyoffer: 'category'


        })

        await offer.save()

        const findoffer = await offerDB.findOne({ name: name }, { _id: 1 })

        for (let item of offeredproduct) {
            let normalprice = item.realprice
            const realprice = item.realprice
            const ID = item._id
            const offerPrice = normalprice - (normalprice * (persent / 100));
            await productDB.findByIdAndUpdate(ID, {
                realprice: realprice,
                existOffer: findoffer._id,
                offerPersent: persent,
                offerprice: offerPrice,
                regularprice: offerPrice

            }).then(() => console.log('succeeeeess')).catch((err) => console.log(err))
        }
        console.log('successfully updated the product to new offer ')

        // return  res.redirect('/admin/addoffer')

        return res.json({ success: true })


        // end
        // } else {
        //     console.log('the product have not any offer like that ')

        //     return res.status(404).send('please add an offer greater than current or  offer, or delete the current offer and then add')
        // }

    } else {
        console.log('entered to the else code ')
        const offer = new offerDB({
            name: name,
            dicription: discription,
            discountValue: persent,
            category: category,
            expire: date,
            start: startdate,
            tyoffer: 'category'


        })

        await offer.save()

        const findoffer = await offerDB.findOne({ name: name }, { _id: 1 })
        console.log(findoffer)


        for (let item of products) {
            const normalprice = item.regularprice;
            const ID = item.id;
            const offerPrice = normalprice - (normalprice * (persent / 100));
            console.log(offerPrice)


            await productDB.findByIdAndUpdate(ID, {
                regularprice: offerPrice,
                offerprice: offerPrice,
                realprice: normalprice,
                offerPersent: persent,
                existOffer: findoffer._id
            }, { new: true });
            console.log(products)
        }
        // res.redirect('/admin/addoffer')

        res.json({ success: true })
        console.log('successfully added newoffers to the products in that category ')

    }



}


exports.getoffer = async (req, res) => {
    const offers = await offerDB.find().populate('category').populate('products')
    res.render('admin/offer', { offers })
}


exports.deleteoffer = async (req, res) => {
    const ID = req.params.id

    console.log(ID)

    const productOffer = await offerDB.findById(ID)
    if (productOffer.tyoffer == 'product') {
        try {
            // const applayedProducts= await productDB.find({existOffer:ID})
            const productsWithoffer = await productDB.find({ existOffer: ID })
            // res.json(productsWithoffer)

            for (let item of productsWithoffer) {
                var id = item.id
                const currentproduct = await productDB.findById({ _id: id }, { realprice: 1 })
                let newid = currentproduct._id
                const realprice = currentproduct.realprice
                await productDB.findByIdAndUpdate(newid, {
                    regularprice: realprice,
                    existOffer: null,
                    offerPersent: 0,
                    offerprice: 0

                })

            }
            await offerDB.findByIdAndDelete(ID)
            return res.redirect('/admin/offer')


        } catch (err) {
            console.log('en error occured when product offer deleting')
        }
    }

    const productsWithoffer = await productDB.find({ existOffer: ID })
    // res.json(productsWithoffer)

    for (let item of productsWithoffer) {
        var id = item.id
        const currentproduct = await productDB.findById({ _id: id }, { realprice: 1 })
        let newid = currentproduct._id
        const realprice = currentproduct.realprice
        await productDB.findByIdAndUpdate(newid, {
            regularprice: realprice,
            existOffer: null,
            offerPersent: 0,
            offerprice: 0

        })

    }
    await offerDB.findByIdAndDelete(ID).then(() => console.log('success')).catch((err) => console.log(err))
    // const cheack=await await productDB.find({existOffer:ID})
    res.redirect('/admin/offer')

}

exports.editoffer = async (req, res) => {
    // console.log('this is for edit offer ')
    const ID = req.params.id
    const currentOffer = await offerDB.findById(ID)
    const category = await categoryDB.findOne({ _id: currentOffer.category })


    res.render('admin/editoffer', { offer: currentOffer, category: category, va: req.flash('validation') })
}



 
exports.posteditoffer = async (req, res) => {
    console.log('edit offer page got successfully')
    const ID = req.params.id
    console.log(ID)
    const persent = req.body.persent
    const { startdate, date, name } = req.body
    console.log(persent, startdate, date, name)
    const startdates = new Date(startdate)
    const expires = new Date(date)
    const currentOffer = await offerDB.findById(ID)
    console.log(currentOffer)
    const offeredproduct = await productDB.find({ existOffer: ID })
    console.log(offeredproduct)
    const category = req.body.category
    console.log(category)

    if (persent > 75) {
        // return res.status(404).send('cannot add more than 75% ');
        req.flash('validation', 'cannot offer bigger tham 75%');
        return res.redirect(`/admin/editoffer/${ID}`)
    }

    if (startdates > expires) {
        // return res.status(404).send('cannot the expire date lesser than start date  ');
        req.flash('validation', 'cannot start date lesser than end date ');
        return res.redirect(`/admin/editoffer/${ID}`)
    }

    const d = new Date();  
    const st = d.toISOString();  

    if (new Date(startdate).setHours(0,0,0,0) < d.setHours(0,0,0,0)) { 
        req.flash('validation', 'Enter a valid date');
        return res.redirect(`/admin/editoffer/${ID}`);
    }


    for (let item of offeredproduct) {
        const id = item._id
        const realprice = item.realprice
        const offerPrice = realprice - (realprice * (persent / 100))

        await productDB.findOneAndUpdate({ _id: id }, {
            regularprice: offerPrice,
            offerPersent: persent,
            offerprice: offerPrice,
            realprice: realprice


        }).then(() => console.log('success'))

    }
    await offerDB.findByIdAndUpdate(ID, {
        name: name,
        start: startdates,
        expire: expires,
        discountValue: persent
    }).then(() => {
        console.log('offer updated successfully ')
        // res.redirect('/admin/offer')
        return res.json({success:true})
    })

}

exports.getproductoffer = async (req, res) => {
    const products = await productDB.find()
    res.render('admin/productOffer', { products })
}







// exports.postproductoffer = async (req, res) => {
//     console.log(req.body)
//     const start = new Date(req.body.start)
//     const Expire = new Date(req.body.expire)
//     const discription = req.body.discription
//     const name = req.body.name
//     const product = req.body.product
//     const discount = req.body.discount

//     console.log(start, Expire, discription, name, product, discount)

//     try {
//         const singleproduct = await productDB.findById(product)
//         console.log(singleproduct)
//         if (!singleproduct) {
//             console.log('there is no user in that productid')
//             return res.json({ success: false })
//         }

//         if (singleproduct.existOffer) {
//             console.log('you have an existing offer ')
//             const existingoffer = await offerDB.findById(singleproduct.existOffer)
//             console.log(existingoffer)
//             if (existingoffer.discountValue > discount) {
//                 console.log('you cant add this offer ')
//                 return res.status(404).send('you cant add this offer , because of the offer less than the current offer')
//             } else {
//                 console.log('yopu can add this offer ')

//                 const newoffer = new offerDB({
//                     name: name,
//                     discountValue: discount,
//                     dicription: discription,
//                     start: start,
//                     expire: Expire,
//                     tyoffer: 'product'

//                 })
//                 const savedOffer = await newoffer.save()
//                 const offerid = savedOffer._id
//                 const offeredValue = singleproduct.realprice - Number(singleproduct.realprice * (discount / 100))
//                 await productDB.updateOne({ _id: singleproduct._id }, {
//                     existOffer: offerid,
//                     offerPersent: discount,
//                     offerprice: offeredValue,
//                     regularprice: offeredValue,

//                 }).then(() => console.log('updated the product offer '))

//                 return res.json({ success: true })
//             }
//         } else {
//             console.log('you have not an existing offer ')
//             const newoffer = new offerDB({
//                 name: name,
//                 discountValue: discount,
//                 dicription: discription,
//                 start: start,
//                 expire: Expire,
//                 tyoffer: 'product'

//             })
//             const savedOffer = await newoffer.save()
//             const offerid = savedOffer._id
//             const offeredValue = singleproduct.realprice - Number(singleproduct.realprice * (discount / 100))
//             await productDB.updateOne({ _id: singleproduct._id }, {
//                 existOffer: offerid,
//                 offerPersent: discount,
//                 offerprice: offeredValue,
//                 regularprice: offeredValue,

//             }).then(() => console.log('updated the product offer '))
//             return res.json({ success: true })
//         }


//     } catch (err) {
//         console.log('an erroior occured in the side of product-offer', err)
//     }
// }


exports.postproductoffer = async (req, res) => {
    console.log(req.body);

    const start = new Date(req.body.start);
    const expire = new Date(req.body.expire);
    const description = req.body.discription;
    const name = req.body.name;
    const products = req.body.products;  
    const discount = req.body.discount;

    console.log(start, expire, description, name, products, discount);

    if(discount>75){
        return res.status(404).send('please select offer less than 75%');
    }

    if(expire<start){
        return res.status(404).send('expire date cannot more bigger than start date ');
    }

    const st = new Date();  
    const a = st.toISOString();    
    
    if (new Date(start) < new Date(a).setHours(0,0,0,0)) {
      return res.status(404).send('Enter a valid date');
    }
    try {
        for (const productId of products) {
            const singleProduct = await productDB.findById(productId);
            if (!singleProduct) {
                console.log(`No product found with ID: ${productId}`);
                continue;
            }

            if (singleProduct.existOffer) {
                console.log(`Product ${productId} already has an existing offer`);
                const existingOffer = await offerDB.findById(singleProduct.existOffer);
                if (existingOffer && existingOffer.discountValue > discount) {
                    console.log(`Skipping product ${productId} as the new offer discount (${discount}%) is less than the existing offer (${existingOffer.discountValue}%)`);
                    return res.status(404).send(`Skipping product ${productId} as the new offer discount (${discount}%) is less than the existing offer (${existingOffer.discountValue}%)`)
                }
            }

            console.log(`Adding offer to product ${productId}`);
            const newOffer = new offerDB({
                name,
                discountValue: discount,
                dicription: description,
                start,
                expire,
                tyoffer: 'product',
                products: productId
            });

            const savedOffer = await newOffer.save();
            const offerId = savedOffer._id;
            const offeredValue = singleProduct.realprice - (singleProduct.realprice * (discount / 100));

            await productDB.updateOne(
                { _id: productId },
                {
                    existOffer: offerId,
                    offerPersent: discount,
                    offerprice: offeredValue,
                    regularprice: offeredValue,
                }
            );

            console.log(`Successfully updated product ${productId} with new offer`);
        }

        return res.json({ success: true, message: 'Offers added successfully to selected products' });
    } catch (err) {
        console.log('An error occurred while processing product offers', err);
        return res.status(500).json({ success: false, message: 'An error occurred while processing offers' });
    }
};

