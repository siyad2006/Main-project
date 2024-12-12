const cartDB = require('../../schema/cart')
const checkoutDB = require('../../schema/cheakout')
const productDB = require('../../schema/productschema')
const AddressDB = require('../../schema/address')
const { v4: uuidv4 } = require('uuid');
const Razorpay = require('razorpay');
require('dotenv').config()
const mongoose = require('mongoose');
// const cheakout = require('../../schema/cheakout');
// const cheakout = require('../../schema/cheakout');
const ObjectId = mongoose.Types.ObjectId;
const walletDB = require('../../schema/wallet')
const coupunDB = require('../../schema/coupunSchama');
const { x } = require('pdfkit');
const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')
const userDB = require('../../schema/userModel');
const cheakout = require('../../schema/cheakout');
const categoryDB = require('../../schema/category')

exports.getcheackout = async (req, res) => {
    const cartId = req.params.cart;
    const userId = req.session.userId;

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



    const cartItem = await cartDB.findById(cartId);

    if( req.session.discount > 0){
        if(cartItem.coupun == null  ){
            
        req.session.discount=0
        req.flash('limit', `Sorry your coupun is not available now `);
        return res.redirect('/user/cart')
        }
    }

    const address = await AddressDB.find({ user: userId });
    const cartTotal = req.session.totalAmount
    console.log('this is the total amount from cart in cheackot :', cartTotal)

    const coupun = await coupunDB.findById(cartItem.coupun)

    // if(cartTotal+coupun.maximumDiscount<=coupun.minimumPurchase){
    //       req.flash('limit',`please buy items more than ${coupun.minimumPurchase}`)
    //     return res.redirect(`/user/cart/${userId}`)


    // }

    if (coupun) {
        if (cartTotal + coupun.maximumDiscount <= coupun.minimumPurchase) {
            req.flash('limit', `Please buy items worth more than ${coupun.minimumPurchase}`);
            return res.redirect(`/user/cart`);
        }
    }


    const cartProducts = cartItem.products.map(product => ({
        productId: product.productId,
        qty: product.qty
    }));

    const products = await productDB.find({ _id: { $in: cartProducts.map(item => item.productId) } });

    const cartProductDetails = products.map(product => {

        const cartProduct = cartProducts.find(item => item.productId.toString() === product._id.toString());
        return {
            ...product.toObject(),
            qty: cartProduct.qty,

        };
    });

    console.log(cartProductDetails)
    res.render('user/cheakout', { cartProducts: cartProductDetails, address, userId, cartItem, cartTotal, realprice: req.session.realprice, discount: req.session.discount });
};



exports.placeorder = async (req, res) => {
    const user = req.params.user;
    console.log('this is the user id from checkout', user);

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


    const { name, phone, street, city, state, postalCode, paymentMethod, products, country } = req.body;
    console.log(name, phone, street, city, state, postalCode, paymentMethod, products);


    const cart = await cartDB.findOne({ user: user });



    if (!cart) {
        throw new Error("Cart not found for the user.");
    }
    let total = req.session.totalAmount;
    let coupunamount = 0;



    if (cart.coupun) {
        const coupun = await coupunDB.findById(cart.coupun);
        console.log('Retrieved coupun:', coupun);

        if (coupun) {
            coupunamount += Number(coupun.maximumDiscount) || 0;
        } else {
            console.log('No coupun document found');
        }
    } else {
        console.log('No coupun ID in cart');
    }

    console.log('Coupon Amount:', coupunamount);

    const cheakpro = await productDB.find();
    if (coupunamount > 0) {
        console.log('Entered the check code');
        let subtotal = 0;
        let cheaktotal = total + coupunamount;

        // const pro = cart.products.map((item) => {
        for (let item of cart.products) {
            const findpro = cheakpro.find(x => x._id.toString() === item.productId.toString());
            console.log('Checking product ID:', item.productId, 'Found Product:', findpro);

            if (findpro) {
                subtotal += findpro.regularprice * item.qty;
            } else {
                console.log(`Product with ID ${item.productId} not found.`);
            }
            if (item.qty > findpro.quantity) {
                return res.status(404).send(`this product :${findpro.name} have no qty by for  you selected qty `)
            }
        }

        console.log('Calculated Subtotal:', subtotal);
        console.log('Total after Coupon Applied:', cheaktotal);

        if (cheaktotal !== subtotal) {
            console.log('Price mismatch detected, returning error');
            return res.status(404).send('you cant add it because of the admin make changes in the products peice  ')
        }
    } else {
        let subtotal = 0;
        let cheaktotal = total
        // const pro = cart.products.map((item) => {
        // for (let item of cart.products) {
        //     const findpro = cheakpro.find(x => x._id.toString() === item.productId.toString());
        //     console.log('Checking product ID:', item.productId, 'Found Product:', findpro);


        //     if (findpro) {
        //         subtotal += findpro.regularprice * item.qty
        //     } else {
        //         console.log(`Product with ID ${item.productId} not found.`);
        //     }


        //     if (!findpro) {
        //         console.log(`Product with ID ${item.productId} is missing.`);
        //         cart.products = cart.products.filter(cartItem => cartItem.productId.toString() !== item.productId.toString());
        //     }



        //     if (!findpro) {
        //         return res.status(404).send(`Product with ID ${item.productId} does not exist.`);
        //     }

        //     // Continue processing only if no response is sent
        //     if (item.qty > findpro.quantity) {
        //         return res.status(404).send(`This product: ${findpro.name} does not have enough quantity.`);
        //     }
        // }


        for (let item of cart.products) {
            const findpro = cheakpro.find(x => x._id.toString() === item.productId.toString());
            console.log('Checking product ID:', item.productId, 'Found Product:', findpro);

            if (findpro) {
                subtotal += findpro.regularprice * item.qty;
            } else {
                console.log(`Product with ID ${item.productId} is missing.`);
                cart.products = cart.products.filter(cartItem => cartItem.productId.toString() !== item.productId.toString());
                continue;
            }

            if (item.qty > findpro.quantity) {
                return res.status(404).send(`This product: ${findpro.name} does not have enough quantity.`);
            }
        }

        await cart.save();


        console.log('Calculated Subtotal:', subtotal);
        console.log('Total after Coupon Applied:', cheaktotal);

        if (cheaktotal !== subtotal) {
            console.log('Price mismatch detected, returning error');
            return res.status(404).send('you cant add it because of the admin make changes in products price  ')
        }
    }

    console.log('Proceeding with checkout');


    if (paymentMethod === 'cod') {
        try {

            if (total > 1000) {
                return res.status(400).send('you cant buy as items Cash On Delivery Above Rs:1000 ')
            }
            // function generateOrderId() {
            //     return `ORDER-${uuidv4()}`;
            // }

            // console.log(generateOrderId());

            if (!cart || cart.products.length === 0) {
                return res.status(400).send("Cart is empty");
            }



            const productdata = await productDB.find()
            const items = cart.products.map(x => {
                const product = productdata.find(p => p._id.toString() === x.productId.toString());
                return {
                    productId: x.productId,
                    qty: x.qty,
                    soldprice: product.regularprice
                };
            });

            for (const item of items) {
                const product = await productDB.findById(item.productId);

                const category = await categoryDB.findById(product.category)

                if (category) {
                    console.log('entered to the category ')

                    let categorysold = Number(category.sold += item.qty)

                    category.sold = categorysold
                    await category.save()
                }

                if (product) {

                    if (product.quantity < item.qty) {
                        return res.status(400).send(`Not enough stock for product: ${product.name}`);
                    }
                    console.log('Product sold:', product.sold);
                    console.log('Item quantity:', item.qty);

                    product.sold = Number(product.sold || 0) + Number(item.qty);



                    product.quantity -= item.qty;
                    await product.save();
                }
            }
            let discounts = 0
            for (let i of items) {
                const product = await productDB.findById(i.productId);
                if (product) {
                    if (product.realprice > product.regularprice) {
                        const down = Number(product.realprice - product.regularprice) * i.qty;
                        discounts += down;
                    }
                }
            }
            const order = new checkoutDB({
                userID: user,
                paymentMethods: paymentMethod,
                totalprice: total,
                products: items,
                status: 'pending',
                address: {
                    name: name,
                    phone: phone,
                    houseAddress: street,
                    city: city,
                    state: state,
                    pincode: postalCode,
                    country: country
                },
                discount: discounts,
                applayedcoupun: coupunamount,
                paymentStatus: true

            });

            await order.save();
            await cartDB.findOneAndDelete({ user: user });
            const orderid = order._id
            res.json({ success: true, redirect: `/user/success/${orderid}` });
        } catch (error) {
            console.log(error);
            res.status(500).send("Error processing order");
        }
    }
    if (paymentMethod == 'wallet') {
        const nowdate = new Date();
        const wallet = await walletDB.findOne({ user: user })

        if (wallet) {
            if (total > wallet.amount) {
                return res.status(404).send('you have not balace for buy this item')
            }


            const productdata = await productDB.find()
            const items = cart.products.map(x => {
                const product = productdata.find(p => p._id.toString() === x.productId.toString());
                return {
                    productId: x.productId,
                    qty: x.qty,
                    soldprice: product.regularprice
                };
            });


            for (const item of items) {
                const product = await productDB.findById(item.productId);

                const category = await categoryDB.findById(product.category)

                if (category) {
                    console.log('entered to the category ')

                    let categorysold = Number(category.sold += item.qty)

                    category.sold = categorysold
                    await category.save()
                }

                if (product) {

                    if (product.quantity < item.qty) {
                        return res.status(400).send(`Not enough stock for product: ${product.name}`);
                    }
                    console.log('Product sold:', product.sold);
                    console.log('Item quantity:', item.qty);

                    product.sold = Number(product.sold || 0) + Number(item.qty);

                    product.quantity -= item.qty;
                    await product.save();
                }
            }
            let discounts = 0
            for (let i of items) {
                const product = await productDB.findById(i.productId);
                if (product) {
                    if (product.realprice > product.regularprice) {
                        const down = Number(product.realprice - product.regularprice) * i.qty;
                        discounts += down;
                    }
                }
            }
            const order = new checkoutDB({
                userID: user,
                paymentMethods: paymentMethod,
                totalprice: total,
                products: items,
                status: 'pending',
                address: {
                    name: name,
                    phone: phone,
                    houseAddress: street,
                    city: city,
                    state: state,
                    pincode: postalCode,
                    country: country
                },
                discount: discounts,
                applayedcoupun: coupunamount,
                paymentStatus: true

            });

            await order.save();
            await cartDB.findOneAndDelete({ user: user });

            let walletamout = wallet.amount
            let newwalletAmount = Number(walletamout -= total)

            await walletDB.findByIdAndUpdate(wallet._id, {
                amount: newwalletAmount,
                $push: {
                    transaction: {
                        typeoftransaction: 'credit',
                        amountOfTransaction: total,
                        dateOfTransaction: nowdate,
                    }
                }
            })


            const orderid = order._id
            res.json({ success: true, redirect: `/user/success/${orderid}` });

        }

    }
    if (paymentMethod === 'razorpay') {
        console.log('this is from razorpay');

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_ID,
            key_secret: process.env.RAZORPAY_SECRET
        });

        const options = {
            amount: Math.round(total * 100),
            currency: "INR",
            receipt: `receipt_${new Date().getTime()}`,
            notes: {
                key: "value"
            }
        };

        try {
            const order = await razorpay.orders.create(options);
            // console.log('this is the text event of razorpat', req.body.event)
            // res.json({order_id: order.id, currency: order.currency, amount: order.amount  });
            console.log('this is from success of Razor');

            if (!cart || cart.products.length === 0) {
                return res.status(400).send("Cart is empty");
            }

            const productdata = await productDB.find()
            const items = cart.products.map(x => {
                const product = productdata.find(p => p._id.toString() === x.productId.toString());
                return {
                    productId: x.productId,
                    qty: x.qty,
                    soldprice: product.regularprice
                };
            });


            for (const item of items) {
                const product = await productDB.findById(item.productId);

                const category = await categoryDB.findById(product.category)

                if (category) {
                    console.log('entered to the category ')

                    let categorysold = Number(category.sold += item.qty)

                    category.sold = categorysold
                    await category.save()
                }

                if (product) {

                    if (product.quantity < item.qty) {
                        return res.status(400).send(`Not enough stock for product: ${product.name}`);
                    }

                    console.log('Product sold:', product.sold);
                    console.log('Item quantity:', item.qty);

                    product.sold = Number(product.sold || 0) + Number(item.qty);

                    product.quantity -= item.qty;
                    await product.save();
                }
            }
            let discounts = 0
            for (let i of items) {
                const product = await productDB.findById(i.productId);
                if (product) {
                    if (product.realprice > product.regularprice) {
                        const down = Number(product.realprice - product.regularprice) * i.qty;
                        discounts += down;
                    }
                }
            }
            const orders = new checkoutDB({
                userID: user,
                paymentMethods: paymentMethod,
                totalprice: total,
                products: items,
                status: 'payment-pending',
                address: {
                    name: name,
                    phone: phone,
                    houseAddress: street,
                    city: city,
                    state: state,
                    pincode: postalCode,
                    country: country
                },
                discount: discounts
            });


            await orders.save();
            res.json({ order_id: order.id, currency: order.currency, amount: order.amount, orderID: orders._id });
            await cartDB.findOneAndDelete({ user: user });

        } catch (error) {
            console.log("Error creating order:", error);
            res.status(500).send("Error creating Razorpay order");
        }
    }
};


// exports.myorders = async (req, res) => {
//     const userID = req.session.userId;


//     const orders = await checkoutDB.find({ userID: userID });
//     console.log(orders);

//     res.render('user/myorder', { orders })



// }

exports.myorders = async (req, res) => {
    const userID = req.session.userId;

    if (!userID) {
        return res.redirect('/user/home');
    }

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


    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalOrders = await checkoutDB.countDocuments({ userID });
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await checkoutDB
        .find({ userID })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    res.render('user/myorder', {
        orders,
        currentPage: page,
        totalPages,
        userID
    });
};


exports.cancelorder = async (req, res) => {
    const ID = req.params.id
    const userid = req.session.userId

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


    // console.log(user)
    const db = await checkoutDB.findById(ID)



    if (db.paymentMethods == 'razorpay' || db.paymentMethods == 'wallet') {
        console.log('entered to the razorpaay code ')
        await checkoutDB.findByIdAndUpdate(ID, {
            status: 'canceled'
        })
        console.log(db.totalprice)
        const isWallet = await walletDB.findOne({ user: userid })

        // const newdate=new Date()
        // const nowdate=newdate.toLocaleDateString('en-GB')
        const nowdate = new Date();

        if (isWallet) {
            console.log('User already has a wallet');

            const existingWallet = await walletDB.findOne({ user: userid }, { amount: 1, _id: 0 });

            if (!existingWallet) {
                throw new Error('Wallet not found for user');
            }

            const existingAmount = existingWallet.amount || 0;
            console.log(existingAmount);

            const newAmount = existingAmount + db.totalprice;

            await walletDB.updateOne(
                { user: userid },
                {
                    amount: newAmount,
                    $push: {
                        transaction: {
                            typeoftransaction: 'debit',
                            amountOfTransaction: db.totalprice,
                            dateOfTransaction: nowdate,
                        }
                    }
                }
            ).then(() => console.log('Successfully updated the wallet'));

            const canceledproducts = await checkoutDB.findById(ID)
            const items = canceledproducts.products
            for (let pro of items) {
                const id = pro.productId;
                const singleItem = await productDB.findById(id);
                const buyedqty = pro.qty;



                if (!singleItem) {
                    continue
                }


                const category = await categoryDB.findById(singleItem.category)

                if (category) {
                    console.log('entered to the category ')

                    let categorysold = Number(category.sold -= buyedqty)

                    category.sold = categorysold
                    await category.save()
                }

                // if (singleItem.quantity < buyedqty) {
                //     console.log(`Insufficient stock for product with ID ${id}`);
                //     return res.status(400).send(`Not enough stock for product with ID ${id}`);
                // }


                singleItem.sold = Number(singleItem.sold || 0) - Number(pro.qty);

                singleItem.quantity += buyedqty;



                await singleItem.save();
            }



            res.redirect(`/user/myorders/${userid}`)
        }
        else {

            console.log('user dont have wallet ')
            const newwallet = new walletDB({
                user: userid,
                amount: db.totalprice,
                transaction: [
                    {
                        typeoftransaction: 'debit',
                        amountOfTransaction: db.totalprice,
                        dateOfTransaction: nowdate

                    }
                ]



            })
            newwallet.save()
            const canceledproducts = await checkoutDB.findById(ID)
            const items = canceledproducts.products
            console.log(items)
            for (let pro of items) {
                const id = pro.productId;
                const singleItem = await productDB.findById(id);
                const buyedqty = pro.qty;

                if (!singleItem) {
                    continue
                }


                const category = await categoryDB.findById(singleItem.category)

                if (category) {
                    console.log('entered to the category ')

                    let categorysold = Number(category.sold -= buyedqty)

                    category.sold = categorysold
                    await category.save()
                }

                // if (singleItem.quantity < buyedqty) {
                //     console.log(`Insufficient stock for product with ID ${id}`);
                //     return res.status(400).send(`Not enough stock for product with ID ${id}`);
                // }

                // product.sold -= item.qty
                // console.log('Product sold:', product.sold);
                //     console.log('Item quantity:', item.qty);

                singleItem.sold = Number(singleItem.sold || 0) - Number(pro.qty);

                singleItem.quantity += buyedqty;


                await singleItem.save();
            }

            res.redirect(`/user/myorders/${userid}`)
        }


    }
    if (db.paymentMethods == 'cod') {
        console.log('entered to else cancel order ')
        await checkoutDB.findByIdAndUpdate({ _id: ID }, {
            status: 'canceled'
        })

        const canceledproducts = await checkoutDB.findById(ID)
        const items = canceledproducts.products
        for (let pro of items) {
            const id = pro.productId;
            const singleItem = await productDB.findById(id);
            const buyedqty = pro.qty;

            if (!singleItem) {
                console.log(`Product with ID ${id} not found`);
                // return res.status(404).send(`Product with ID ${id} not found`)
                continue
            }


            const category = await categoryDB.findById(singleItem.category)

            if (category) {
                console.log('entered to the category ')

                let categorysold = Number(category.sold -= buyedqty)

                category.sold = categorysold
                await category.save()
            }

            // if (singleItem.quantity < buyedqty) {
            //     console.log(`Insufficient stock for product with ID ${id}`);
            //     return res.status(400).send(`Not enough stock for product with ID ${id}`);
            // }

            // product.sold -= item.qty

            singleItem.sold = Number(singleItem.sold || 0) - Number(pro.qty);

            singleItem.quantity += buyedqty;


            // puthiya options 

            // singleItem.quantity += buyedqty;


            await singleItem.save();
        }


        res.redirect(`/user/myorders/${userid}`)

    }




}

exports.success = async (req, res) => {
    console.log('sucessfully entered to the suceess page');

    const user = req.session.userId



    const order = await checkoutDB.findByIdAndUpdate(req.params.orderid, {
        paymentStatus: true,
        status: 'pending'
    })

    console.log('this is the order document', order)

    // const cart = await cartDB.findOne({ user: user })
    // if (cart) {
    //     await cartDB.deleteOne({ user: user })
    //     return res.render('user/sucess')
    // } else {
    return res.render('user/sucess');
    // }

}

exports.details = async (req, res) => {
    console.log('entered to the order details code')
    const order = req.params.id
    const db = await checkoutDB.findById(order)

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



    const items = db.products.map((item) => ({

        id: item.productId,
        qty: item.qty,
        soldprice: item.soldprice

    }));

    console.log(items)

    const creat = db.createdAt
    const date = creat.toLocaleDateString('en-GB')
    // console.log(date)
    const a = items.map((x) => new ObjectId(x.id));
    console.log(a)


    const products = await productDB.find({
        _id: { $in: a }
    });

    //   console.log(products);
    const productsWithQty = products.map(product => {

        const productQty = items.find(item => item.id.toString() === product._id.toString()).qty;
        const solds = items.find(item => item.id.toString() === product._id.toString()).soldprice;
        return {
            ...product.toObject(),
            qty: productQty,
            solds: solds

        };
    });
    console.log(productsWithQty)
    const coupun = db.applayedcoupun
    let offer = db.discount
    const realprice = Number(db.totalprice + coupun + db.discount)
    //   res.json(db)
    console.log(realprice)
    res.render('user/orderdetails', { products: productsWithQty, order: db, date: date, coupun, realprice, offer , expire:req.flash('expired') })


}

exports.return = async (req, res) => {

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



    console.log('retrun')
    const ID = req.params.id
    const db = await checkoutDB.findById(ID)
    const userid = req.session.userId



    const currentDate = new Date();
    const orderDate = new Date(db.createdAt);
    const currentDay = currentDate.getDate();
    const orderDay = orderDate.getDate();
    currentDate.setDate(currentDay - 7);

    if (orderDate <= currentDate) {
        console.log('The order is expired.');
        req.flash('expired','you cant return because it is expired the order date')
        return res.redirect(`/user/orderdetails/${ID}`);
    } 



    if (db.paymentMethods == 'razorpay' || db.paymentMethods == 'wallet') {
        console.log('entered to the razorpaay code ')
        await checkoutDB.findByIdAndUpdate(ID, {
            status: 'return'
        })
        console.log(db.totalprice)
        const isWallet = await walletDB.findOne({ user: userid })

        // const newdate=new Date()
        // const nowdate=newdate.toLocaleDateString('en-GB')
        const nowdate = new Date(); // Creates a Date object representing the current date and time

        if (isWallet) {
            console.log('User already has a wallet');

            const existingWallet = await walletDB.findOne({ user: userid }, { amount: 1, _id: 0 });

            if (!existingWallet) {
                throw new Error('Wallet not found for user');
            }

            const existingAmount = existingWallet.amount || 0;
            console.log(existingAmount);

            const newAmount = existingAmount + db.totalprice;

            await walletDB.updateOne(
                { user: userid },
                {
                    amount: newAmount,
                    $push: {
                        transaction: {
                            typeoftransaction: 'debit',
                            amountOfTransaction: db.totalprice,
                            dateOfTransaction: nowdate,
                        }
                    }
                }
            ).then(() => console.log('Successfully updated the wallet'));


            const canceledproducts = await checkoutDB.findById(ID)
            const items = canceledproducts.products
            for (let pro of items) {
                const id = pro.productId;
                const singleItem = await productDB.findById(id);
                const buyedqty = pro.qty;

                if (!singleItem) {
                    console.log(`Product with ID ${id} not found`);
                    return res.status(404).send(`Product with ID ${id} not found`);
                }


                const category = await categoryDB.findById(singleItem.category)

                if (category) {
                    console.log('entered to the category ')

                    let categorysold = Number(category.sold -= buyedqty)

                    category.sold = categorysold
                    await category.save()
                }


                if (singleItem.quantity < buyedqty) {
                    console.log(`Insufficient stock for product with ID ${id}`);
                    return res.status(400).send(`Not enough stock for product with ID ${id}`);
                }



                singleItem.sold = Number(singleItem.sold || 0) - Number(pro.qty);

                singleItem.quantity += buyedqty;




                await singleItem.save();
            }


            res.redirect(`/user/orderdetails/${ID}`);
        }
        else {
            console.log('user dont have wallet ')
            const newwallet = new walletDB({
                user: userid,
                amount: db.totalprice,
                transaction: [
                    {
                        typeoftransaction: 'debit',
                        amountOfTransaction: db.totalprice,
                        dateOfTransaction: nowdate

                    }
                ]



            })
            newwallet.save()


            const canceledproducts = await checkoutDB.findById(ID)
            const items = canceledproducts.products
            for (let pro of items) {
                const id = pro.productId;
                const singleItem = await productDB.findById(id);
                const buyedqty = pro.qty;

                if (!singleItem) {
                    console.log(`Product with ID ${id} not found`);
                    return res.status(404).send(`Product with ID ${id} not found`);
                }


                const category = await categoryDB.findById(singleItem.category)

                if (category) {
                    console.log('entered to the category ')

                    let categorysold = Number(category.sold -= buyedqty)

                    category.sold = categorysold
                    await category.save()
                }


                if (singleItem.quantity < buyedqty) {
                    console.log(`Insufficient stock for product with ID ${id}`);
                    return res.status(400).send(`Not enough stock for product with ID ${id}`);
                }




                singleItem.sold = Number(singleItem.sold || 0) - Number(pro.qty);

                singleItem.quantity += buyedqty;




                await singleItem.save();
            }


            res.redirect(`/user/orderdetails/${ID}`)
        }


    } else {
        await checkoutDB.findByIdAndUpdate(ID, {
            status: 'return'
        })
        const isWallet = await walletDB.findOne({ user: userid })

        // const newdate=new Date()
        // const nowdate=newdate.toLocaleDateString('en-GB')
        const nowdate = new Date(); // Creates a Date object representing the current date and time

        if (isWallet) {
            console.log('User already has a wallet');

            const existingWallet = await walletDB.findOne({ user: userid }, { amount: 1, _id: 0 });

            if (!existingWallet) {
                throw new Error('Wallet not found for user');
            }

            const existingAmount = existingWallet.amount || 0;
            console.log(existingAmount);

            const newAmount = existingAmount + db.totalprice;

            await walletDB.updateOne(
                { user: userid },
                {
                    amount: newAmount,
                    $push: {
                        transaction: {
                            typeoftransaction: 'debit',
                            amountOfTransaction: db.totalprice,
                            dateOfTransaction: nowdate,
                        }
                    }
                }
            ).then(() => console.log('Successfully updated the wallet'));


            const canceledproducts = await checkoutDB.findById(ID)
            const items = canceledproducts.products
            for (let pro of items) {
                const id = pro.productId;
                const singleItem = await productDB.findById(id);
                const buyedqty = pro.qty;

                if (!singleItem) {
                    console.log(`Product with ID ${id} not found`);
                    return res.status(404).send(`Product with ID ${id} not found`);
                }



                const category = await categoryDB.findById(singleItem.category)

                if (category) {
                    console.log('entered to the category ')

                    let categorysold = Number(category.sold -= buyedqty)

                    category.sold = categorysold
                    await category.save()
                }


                if (singleItem.quantity < buyedqty) {
                    console.log(`Insufficient stock for product with ID ${id}`);
                    return res.status(400).send(`Not enough stock for product with ID ${id}`);
                }



                singleItem.sold = Number(singleItem.sold || 0) - Number(pro.qty);

                singleItem.quantity += buyedqty;




                await singleItem.save();
            }
        } else {

            console.log('user dont have wallet ')
            const newwallet = new walletDB({
                user: userid,
                amount: db.totalprice,
                transaction: [
                    {
                        typeoftransaction: 'debit',
                        amountOfTransaction: db.totalprice,
                        dateOfTransaction: nowdate

                    }
                ]



            })
            newwallet.save()


            const canceledproducts = await checkoutDB.findById(ID)
            const items = canceledproducts.products
            for (let pro of items) {
                const id = pro.productId;
                const singleItem = await productDB.findById(id);
                const buyedqty = pro.qty;

                if (!singleItem) {
                    console.log(`Product with ID ${id} not found`);
                    return res.status(404).send(`Product with ID ${id} not found`);
                }



                const category = await categoryDB.findById(singleItem.category)

                if (category) {
                    console.log('entered to the category ')

                    let categorysold = Number(category.sold -= buyedqty)

                    category.sold = categorysold
                    await category.save()
                }


                if (singleItem.quantity < buyedqty) {
                    console.log(`Insufficient stock for product with ID ${id}`);
                    return res.status(400).send(`Not enough stock for product with ID ${id}`);
                }



                singleItem.sold = Number(singleItem.sold || 0) - Number(pro.qty);

                singleItem.quantity += buyedqty;




                await singleItem.save();
            }
        }

        res.redirect(`/user/orderdetails/${ID}`)
    }

}






exports.wallet = async (req, res) => {

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




    console.log(req.params.id)
    const wallet = await walletDB.findOne({ user: req.params.id })
    console.log(wallet)
    res.render('user/wallet', { wallet })
}



exports.dowloadsummary = async (req, res) => {
    try {
        const orderid = req.body.orderid;
        console.log(orderid);
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



        const doc = new PDFDocument();
        const filepath = path.join(__dirname, '..', 'invoice.pdf');
        const writeable = fs.createWriteStream(filepath);

        const order = await checkoutDB.findById(orderid);
        const user = await userDB.findById(order.userID)

        console.log('this is the user ', user)
        // const productarray=order.products.map((i)=>{
        //      return i.productId

        // })

        // console.log(productarray)
        //         const products=await productDB.find({_id:{$in:productarray}}) 
        //         console.log('products ',products)

        //         const productDetails=order.products.map((item)=>{
        //             let details= products.find((i)=> i._id.toString() === item._id.toString() )
        //             if (details) {
        //                 return {
        //                     name: details.name, 
        //                     qty: item.qty,
        //                     price: item.soldprice
        //                 };
        //             }
        //         })

        //         console.log('this is the products details',productDetails)


        const productarray = order.products.map(i => i.productId);
        console.log(productarray);

        const products = await productDB.find({ _id: { $in: productarray } });
        console.log('products ', products);


        const productDetails = order.products.map((item) => {

            let details = products.find((i) => i._id.toString() === item.productId.toString());
            if (details) {
                return {
                    name: details.name,
                    qty: item.qty,
                    price: item.soldprice
                };
            }
            return null;
        });

        console.log('this is the products details', productDetails);



        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Generate PDF content
        doc.pipe(writeable);
        doc.fillColor('#007ACC')
            .fontSize(26)
            .font('Helvetica-Bold')
            .text('INVOICE', { align: 'center' });
        doc.moveDown();

        doc.fillColor('#000')
            .fontSize(12)
            .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown();

        doc.fillColor('#007ACC')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text('Order Details:', { underline: true });
        doc.moveDown(0.5);

        doc.fillColor('#000')
            .fontSize(14)
            .font('Helvetica')
            .text(`Order ID: ${order._id}`)
            .text(`Name: ${user.username}`)
            .text(`Email : ${user.Email}`)
            .text(`Payment Method: ${order.paymentMethods}`)
            .text(`Order Status: ${order.status}`)
            .text(`Order Date: ${new Date(order.createdAt).toLocaleString()}`);
        doc.moveDown();

        doc.fillColor('#007ACC')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text('Billing Address:', { underline: true });
        doc.moveDown(0.5);

        doc.fillColor('#000')
            .fontSize(14)
            .font('Helvetica')
            .text(`Name: ${order.address.name}`)
            .text(`Phone: ${order.address.phone}`)
            .text(`Address: ${order.address.houseAddress}`)
            .text(`City: ${order.address.city}`)
            .text(`State: ${order.address.state}`)
            .text(`Pincode: ${order.address.pincode}`)
            .text(`Country: ${order.address.country}`);
        doc.moveDown();

        doc.fillColor('#007ACC')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text('Products Purchased:', { underline: true });
        doc.moveDown(0.5);

        doc.fillColor('#000')
        // productDetails.forEach((product, index) => {
        //     doc.fontSize(14)
        //         .font('Helvetica')
        //         .text(`  ${index + 1}. Product Name: ${product.name}`)
        //         .text(`     Quantity:  Rs :  ${product.qty}`)
        //         .text(`     Price per unit:  Rs : ${product.soldprice}`);
        //     doc.moveDown(0.5);
        // });

        productDetails.forEach((product, index) => {
            doc.fontSize(14)
                .font('Helvetica')
                .text(`  ${index + 1}. Product Name: ${product.name}`)
                .text(`     Quantity: ${product.qty}`)
                .text(`     Price per unit: ₹${product.price}`); // Assuming price is the correct field
            doc.moveDown(0.5); // You can tweak the spacing here if needed
        });


        doc.moveDown();
        doc.fillColor('#007ACC')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text('Price Summary:', { underline: true });
        doc.moveDown(0.5);

        doc.fillColor('#000')
            .fontSize(14)
            .font('Helvetica')
            .text(`Total Price:  Rs : ${order.totalprice}`)
            .text(`Discount:  Rs : ${order.discount}`)
            .fillColor('#FF0000')
            .text(`Final Amount:  Rs : ${order.totalprice}`, { align: 'right', bold: true });
        doc.moveDown(2);

        doc.fillColor('#007ACC')
            .fontSize(10)
            .font('Helvetica-Oblique')
            .text('Thank you for shopping with us!', { align: 'center' });
        doc.text('If you have any questions about this invoice, please contact our support.', { align: 'center' });

        doc.end();


        writeable.on('finish', () => {
            console.log('PDF file created successfully.');

            if (!fs.existsSync(filepath)) {
                console.log('The file does not exist.');
                return res.status(500).json({ success: false, message: 'File creation failed.' });
            }

            // Respond with the redirect URL
            return res.json({ success: true, redirect: '/user/getinvoice' });
        });

        writeable.on('error', (writeErr) => {
            console.log('Error writing PDF:', writeErr);
            return res.status(500).json({ success: false, message: 'Error generating PDF.' });
        });

    } catch (err) {
        console.log('Error from download summary:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// exports.dowloadsummary = async (req, res) => {
//     try {
// console.log('entered to the pdf download code ')
//         if(!req.session.userId){
//             return res.redirect('/user/login')
//         }

//         const doc = new PDFdocument();
//         const filepath = path.join(__dirname, '..', 'invoice.pdf');
//         const writeable = fs.createWriteStream(filepath);

//         doc.fontSize(20).text('Invoice', { align: 'center' });
//         doc.moveDown();

//         doc.pipe(writeable);
//         doc.end();


//         res.json({success:true , redirect:'/user/invoice'})
//     } catch (err) {
//         console.log('Error from download summary:', err);
//         res.status(500).send('An error occurred');
//     }
// };


exports.invoice = async (req, res) => {
    console.log('this is the invoice')
    let paths = path.join(__dirname, '..', 'invoice.pdf')
    console.log(paths)


    // ith veruthe disable aaki vechkkan 

    res.download(paths, (err) => {
        if (err) {
            console.log(err)
        } else {
            fs.unlink(paths, (err) => {
                if (err) {
                    console.log('an error occured when delete the file')
                } else {
                    console.log('successfully deleted the file ')
                }
            })
        }
    })

}


exports.pendingorder = async (req, res) => {
    const userid = req.params.user

    await cartDB.findOneAndDelete({ user: userid })

    res.redirect(`/user/myorders/${userid}`)

}


// exports.repay = async (req, res) => {
// console.log(req.body)

//     try {


// const db= await checkoutDB.findById(req.body.orderid)
// let total=db.totalprice

//         console.log('successfully entered to the repay function')
//         const razorpay = new Razorpay({
//             key_id: process.env.RAZORPAY_ID,
//             key_secret: process.env.RAZORPAY_SECRET
//         });

//         const options = {
//             amount: Math.round(total * 100),
//             currency: "INR",
//             receipt: `receipt_${new Date().getTime()}`,
//             notes: {
//                 key: "value"
//             }
//         };

//         const order = await razorpay.orders.create(options);

//         res.json({ order_id: order.id, currency: order.currency, amount: order.amount, orderID: orders._id });
//         // res.status(200)
//     } catch (err) {
//         console.log('error from repay ', err)
//     }


// }


exports.repay = async (req, res) => {
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


        console.log(req.body);

        if (!req.body.orderid) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        const db = await checkoutDB.findById(req.body.orderid);
        if (!db) {
            return res.status(404).json({ error: 'Order not found' });
        }



        // start 

        const checkout = await checkoutDB.findById(req.body.orderid).populate('products.productId');
        if (!checkout) {
            throw new Error('Checkout order not found.');
        }
        console.log(checkout.createdAt)
        if (checkout.createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
            console.log('it bedore 24 hourse ')

            const items = checkout.products
             

            for (let pro of items) {
                const id = pro.productId;
                const singleItem = await productDB.findById(id);
                const buyedqty = pro.qty;

                if (!singleItem || singleItem.quantity < buyedqty) {
                    continue;
                }

                singleItem.sold = Number(singleItem.sold || 0) - Number(pro.qty);
                singleItem.quantity += buyedqty;

                await singleItem.save();
            }

            await checkoutDB.findByIdAndDelete(req.body.orderid)

            return res.redirect(`/user/myorders/${uid}`)

        }

        let totalprice = 0;
        const updatedProducts = [];

        let flag1 = false
        let flag2 = false

        for (const item of checkout.products) {
            const product = await productDB.findById(item.productId);

            if (!product) {
                flag1 = true
                console.log(`Product with ID ${item.productId} does not exist.`);
                continue;
            }

            // if (product.quantity < item.qty) {
            //     console.log(
            //         `Insufficient quantity for product ${product.name}. Available: ${product.quantity}, Requested: ${item.qty}`
            //     );
            //     continue;  
            // }

            const price = product.offerprice || product.regularprice;
            totalprice += price * item.qty;

            updatedProducts.push({
                productId: item.productId,
                qty: item.qty,
                soldprice: price
            });
        }

        checkout.products = updatedProducts;
        checkout.totalprice = totalprice;
        await checkout.save();

       

        if (flag1 == true || flag2 == true) {
            return res.redirect(`/user/myorders/${uid}`)
        }

        // end




        const total = db.totalprice;
        console.log('Successfully entered the repay function');

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_ID,
            key_secret: process.env.RAZORPAY_SECRET
        });

        const options = {
            amount: Math.round(total * 100),
            currency: "INR",
            receipt: `receipt_${new Date().getTime()}`,
            notes: {
                key: "value"
            }
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            order_id: order.id,
            currency: order.currency,
            amount: order.amount,
            orderID: db._id
        });
    } catch (err) {
        console.log('Error from repay:', err);
        res.status(500).json({ error: 'An error occurred while processing the repayment', details: err.message });
    }
};
