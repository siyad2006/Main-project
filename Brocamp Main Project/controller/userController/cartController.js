const userDB = require('../../schema/userModel')
const cartDB = require('../../schema/cart')
const productDB = require('../../schema/productschema')
const coupunDB = require('../../schema/coupunSchama');
const { success } = require('./cheakoutController');
const mongoose = require('mongoose')

exports.debughome = async (req, res) => {
    if (req.session.userId) {
        return res.redirect(`/user/cart/${req.session.userId}`)
    }
    res.redirect('/user/login')
}

exports.getcart = async (req, res, next) => {

    try {


 


        const uid = req.session.userId;
        if (!uid) {
            return res.redirect('/user/login');
        }
        const isblockuser = await userDB.findById(uid);
        if (!isblockuser) {

            return res.redirect('/user/logout');
        }
        if (isblockuser.isblocked === true) {
            return res.redirect('/user/logout');
        }


        const userid = req.session.userId;

        const coupuns = await coupunDB.find({ user: { $ne: userid } })

        const cart = await cartDB.findOne({ user: userid });
        if (!cart || cart.products.length === 0) {
            return res.render('user/emptycart')
        }


        let discount = 0
        if (cart && cart.coupun && mongoose.Types.ObjectId.isValid(cart.coupun)) {
            const coupunAmount = await coupunDB.findById(cart.coupun);
            if (coupunAmount) {
                  discount += coupunAmount.maximumDiscount
            } else {
              
            }
        } 
        const cartItems = cart.products.map(product => ({
            productId: product.productId,
            qty: product.qty
        }));
        
        const products = await productDB.find({ _id: { $in: cartItems.map(item => item.productId) },isblocked:false });
  
        const cartProducts = products.map(product => {
            const cartItem = cartItems.find(item => item.productId.toString() === product._id.toString());
            return {
                ...product.toObject(),
                qty: cartItem ? cartItem.qty : 0
            };
        });

        let pricee = 0; 
        for (let item of cartProducts) {
            if (item.regularprice && item.qty) {
                pricee += item.regularprice * item.qty;
            } else {
                // console.log(`Invalid data for product: ${item._id}, Regular Price: ${item.regularprice}, Quantity: ${item.qty}`);
            }
        }

        // console.log(`Total Price: ${pricee}`);

        let realprice = 0
        for (let item of cartProducts) {
            if (item.realprice && item.qty) {
                realprice += item.realprice * item.qty;
            } else {
                // console.log(`Invalid data for product: ${item._id}, Regular Price: ${item.regularprice}, Quantity: ${item.qty}`);
            }
        }

 
        req.session.totalAmount = pricee - discount
        req.session.realprice=realprice
        req.session.discount=discount

        // console.log(req.session)
        const totalAmount = req.session.totalAmount
        const cartCount = req.session.cartCount || 0
        res.render('user/cart', { userid, cart, products: cartProducts, limit: req.flash('limit'), coupuns: coupuns, totalAmount, discount: discount, realprice,cartCount });
    } catch (err) {
         
        res.redirect('/user/logout')
    }

};



exports.addcart = async (req, res) => {
    try {
        const uid = req.session.userId;
        if (!uid) {
            return res.redirect('/user/login');
        }
        const isblockuser = await userDB.findById(uid);
        if (!isblockuser) {

            return res.redirect('/user/logout');
        }
        if (isblockuser.isblocked === true) {
            return res.redirect('/user/logout');
        }


        // console.log('entered to the cart control page ')
        const productId = req.params.id;
        const userId = req.params.user;
        const { quantity, regularprice } = req.body;
        if (quantity < 1 || quantity == undefined) {
            quantity = 1
        }

        const findpro = await productDB.findById(productId).populate('category')
        if (findpro.category.isblocked == 'Unlisted' || findpro.isblocked == true) {
            return res.redirect('/')
        }

        // console.log('Product ID:', productId, 'User ID:', userId, 'Quantity:', quantity, 'Price:', regularprice);

        const existingCart = await cartDB.findOne({ user: userId });

        if (existingCart) {

            const productInCart = existingCart.products.find(item => item.productId.toString() === productId);


            if (productInCart) {

                let newQuantity = productInCart.qty + Number(quantity);


                if (newQuantity > 8) {
                    newQuantity = 8;
                }

                productInCart.qty = newQuantity;

                // existingCart.totalAmount = existingCart.products.reduce((total, product) => {
                //     return total + (product.qty * regularprice);
                // }, 0);

                req.session.totalAmount = existingCart.products.reduce((total, product) => {
                    return total + (product.qty * regularprice);
                }, 0);


                await existingCart.save();
                // console.log('Updated cart:', existingCart);
            } else {

                const finalQuantity = Math.min(Number(quantity), 8);

                existingCart.products.push({
                    productId: productId,
                    qty: finalQuantity
                });

                req.session.totalAmount += regularprice * finalQuantity;

                await existingCart.save();
                // console.log('Added new product to cart:', existingCart);
            }
        } else {
            // console.log('entered to the else code of cart ')
            const findpro = await productDB.findById(productId).populate('category')
            if (findpro.category.isblocked == 'Unlisted' || findpro.isblocked == true) {
                return res.redirect('/')
            }
            const finalQuantity = Math.min(Number(quantity), 8);

            const newCart = new cartDB({
                user: userId,
                products: [{
                    productId: productId,
                    qty: finalQuantity
                }],

            });
            req.session.totalAmount = regularprice * finalQuantity
            await newCart.save();
            // console.log('Created new cart:', newCart);
        }

        res.redirect(`/user/cart`);
    } catch (err) {
        console.error(err);
        res.redirect('/user/logout')
    }
};


exports.updateCart = async (req, res, next) => {
    try {

        const uid = req.session.userId;
        if (!uid) {
            return res.redirect('/user/login');
        }
        const isblockuser = await userDB.findById(uid);
        if (!isblockuser) {

            return res.redirect('/user/logout');
        }
        if (isblockuser.isblocked === true) {
            return res.redirect('/user/logout');
        }



        const { productId, qty } = req.body;
        const userid = req.session.userId;

        const cart = await cartDB.findOne({ user: userid });
        if (!cart) {
            return res.json({ success: false, message: 'Cart not found' });
        }

        const cartProduct = cart.products.find(product => product.productId.toString() === productId);
        if (cartProduct) {
            cartProduct.qty = qty;
        }

        const product = await productDB.findById(productId);
        if (!product) {
            return res.json({ success: false, message: 'Product not found' });
        }
        const updatedPrice = product.regularprice * qty;

        let newTotalAmount = 0;
        for (const cartItem of cart.products) {
            const productDetails = await productDB.findById(cartItem.productId);
            if (productDetails) {
                newTotalAmount += productDetails.regularprice * cartItem.qty;
            }
        }
        let subtotal = 0
        for (const cartItem of cart.products) {

            const productDetails = await productDB.findById(cartItem.productId);
            if (productDetails) {
                subtotal += productDetails.realprice * cartItem.qty;
            }
        }

        let discount = 0;
        const iscoupun = await cartDB.findOne({ user: userid }, { coupun: 1 }).populate('coupun');
        if (iscoupun && iscoupun.coupun) {

            discount = iscoupun.coupun.maximumDiscount || 0;
            if (discount > newTotalAmount) {
                discount = newTotalAmount;
            }
            // console.log('Applying discount:', discount);
        }





        req.session.totalAmount = newTotalAmount - discount;
        // console.log(req.session)
        await cart.save();

        res.json({
            success: true,
            updatedPrice: updatedPrice,
            updatedQty: qty,
            newTotalAmount: req.session.totalAmount,
            subtotal
        });

    } catch (error) {
        console.error('Error updating cart:', error);
        // res.json({ success: false, message: 'An error occurred while updating the cart' });
        res.redirect('/user/logout')
    }
};





exports.removecart = async (req, res) => {





    try {

        const uid = req.session.userId;
        if (!uid) {
            return res.redirect('/user/login');
        }
        const isblockuser = await userDB.findById(uid);
        if (!isblockuser) {

            return res.redirect('/user/logout');
        }
        if (isblockuser.isblocked === true) {
            return res.redirect('/user/logout');
        }



        // console.log('started the remove function');
        const userid = req.session.userId;
        const { productId } = req.body;
        // console.log(productId);

        const cartItem = await cartDB.findOne({ user: userid });
        if (!cartItem) {
            // console.log('No cart found for user');
            return res.redirect(`/user/cart`);
        }
        // console.log('cart ITEM', cartItem);


        const productToRemove = cartItem.products.find(product => product.productId.toString() === productId);
        if (!productToRemove) {
            // console.log('Product not found in cart');
            return res.redirect(`/user/cart/${userid}`);
        }

        const productQty = productToRemove.qty;


        const deletedProduct = await productDB.findOne(
            { _id: productId },
            { regularprice: 1 }
        );
        if (!deletedProduct) {
            // console.log('Product not found in database');
            return res.redirect(`/user/cart/${userid}`);
        }
        // console.log('product for delete', deletedProduct);


        const amountToDeduct = deletedProduct.regularprice * productQty;
        // console.log('Amount to deduct:', amountToDeduct);

        await cartDB.updateOne(
            { user: userid },
            { $pull: { products: { productId: productId } } }
        ).then(() => console.log('Successfully updated cart'))
            .catch(err => console.log(err));


        req.session.totalAmount = cartItem.totalAmount - amountToDeduct;
        // console.log('this is the session details of delet', req.session)
        // await cartDB.updateOne(
        //     { user: userid },
        //     { totalAmount: newTotalAmount }
        // // );
        // console.log('Updated total amount:', newTotalAmount);

        res.redirect(`/user/cart`);
    } catch (err) {
        console.log('Error:', err);
        res.redirect(`/user/logout`);
    }
};




exports.addcoupun = async (req, res) => {
    try {
        const uid = req.session.userId;
        if (!uid) {
            return res.redirect('/user/login');
        }
        const isblockuser = await userDB.findById(uid);
        if (!isblockuser) {

            return res.redirect('/user/logout');
        }
        if (isblockuser.isblocked === true) {
            return res.redirect('/user/logout');
        }



 
        const coupunid = req.body.coupunId;
        const userid = req.session.userId;
        const coupun = await coupunDB.findOne({ code: coupunid });

        const cheackcoupun = await cartDB.findOne({ user: userid })
        if (cheackcoupun.coupun) {
            return res.json({ success: false, message: `This cart already has a coupun` });
        }

        if (!coupun) {
            return res.json({ success: false, message: 'There is no coupon with this code' });
        }
        const coupunId = coupun._id
       

        if (String(coupun.user) === String(userid)) {
 
            return res.json({ success: false, message: 'This coupon is already used' });
        }

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        const couponExpiryDate = new Date(coupun.expiryDate);
        couponExpiryDate.setHours(0, 0, 0, 0);

        if (couponExpiryDate > currentDate) {
       

            const cart = await cartDB.find({ user: userid }, { totalAmount: 1, _id: 0 });
            if (cart.length === 0) {
                return res.json({ success: false, message: 'Cart is empty' });
            }

            if (cart[0].totalAmount <= coupun.minimumPurchase) {
                return res.json({ success: false, message: `You must buy items with a minimum value of RS: ${coupun.minimumPurchase}` });
            }

            const offeramount = cart[0].totalAmount - coupun.maximumDiscount;
          
            req.session.totalAmount = offeramount
            req.flash('coupun', coupun.maximumDiscount)
            await cartDB.updateOne(
                { user: userid },
                { coupun: coupunId }
            ); 
            await coupunDB.updateOne({ code: coupunid }, { user: userid });
            return res.json({ success: true });
        } else {
         
            return res.json({ success: false, message: 'This coupon is expired' });
        }
    } catch (error) {
        console.error('Error:', error);
        // return res.status(500).json({ success: false, message: 'An error occurred while processing the coupon' });
        res.redirect('/user/logout')
    }
};



exports.removecoupun = async (req, res) => {

    try {



        const uid = req.session.userId;
        if (!uid) {
            return res.redirect('/user/login');
        }
        const isblockuser = await userDB.findById(uid);
        if (!isblockuser) {

            return res.redirect('/user/logout');
        }
        if (isblockuser.isblocked === true) {
            return res.redirect('/user/logout');
        }

 
        const userid = req.body.user
        const cart = await cartDB.findOne({ user: userid })
        let total = cart.totalAmount



        const coupun = cart.coupun
        const isactive = await coupunDB.findById(coupun)
     
        if (!isactive) {
            return res.json({ success: false })
        }
        let down = isactive.maximumDiscount
        const coupunuser = isactive.user
  
        let count = 0
        for (let use of coupunuser) {
            if (userid == use) {
                // console.log(use, userid)
                count++
            }
        }
        // console.log(count)
        if (count > 0) {
            const updatedAmount = Number(total + down)

            await coupunDB.findByIdAndUpdate(isactive._id, {
                $pull: { user: userid }
            }).then(() => console.log('pulled the user '))
            req.session.totalAmount = updatedAmount
            await cartDB.updateOne({ coupun: isactive._id }, {
                coupun: null,


            })
            // console.log('every think is fine')
            res.json({ success: true, message: 'coupun removed ' })
        } else {
            res.json({ success: true, message: 'there is no coupun to remove' })
        }
    } catch (err) {
        console.log('an error occured when remove coupun', err)
        res.redirect('/user/logout')
    }

}
