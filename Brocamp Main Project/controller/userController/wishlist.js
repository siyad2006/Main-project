
// const { default: products } = require('razorpay/dist/types/products')
const wishlistDB = require('../../schema/wishlistSchema')
const userDB = require('../../schema/userModel')
const productDB = require('../../schema/productschema')


exports.getpage = async (req, res) => {
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



        const userid = req.session.userId

        if (!userid) {
            return res.redirect('/user/home')
        }
        const userhave = await wishlistDB.findOne({ user: userid })

        if (userhave) {
            let page = parseInt(req.query.page) || 1; 
            let limit = 10; 
            let skip = (page - 1) * limit;  

            try {
                const wishlist = await wishlistDB.findOne({ user: userid }).populate('products');
                const totalProducts = wishlist ? wishlist.products.length : 0;
                const totalPages = Math.ceil(totalProducts / limit);

                if (!wishlist || !wishlist.products || wishlist.products.length === 0) {
                    return res.render('user/emptyWishlist');
                }
 
                const sortedProducts = wishlist.products.slice(skip, skip + limit);
                const cartCount = req.session.cartCount
                return res.render('user/wishlist', {
                    products: sortedProducts,
                    currentPage: page,
                    totalPages,
                    cartCount
                });
            } catch (error) {
                console.error(error);
                return res.status(500).send('Internal Server Error');
            }
        } else {

            return res.render('user/emptyWishlist');
        }

    } catch (err) {
        console.log(err)
    }
}


exports.additem = async (req, res) => {
    try {



        const uid = req.session.userId;

if(!uid){
    return res.status(401).send('login first ')
}
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






        const ID = req.body.productId;
        const userid = req.session.userId;

        const findpro = await productDB.findById(ID).populate('category')
        if (findpro.category.isblocked == 'Unlisted' || findpro.isblocked == true) {
            return res.status(404).send('the itrem is unlisted ')
        }
        // if (findpro.category.isblocked == 'Unlisted' || findpro.isblocked == true) {
        //     return res.status(403).json({ redirect: '/' });
        // }


        if (!userid) {
            // console.log('Session userId is undefined. User needs to log in.');
            return res.status(401).send('Login first');
        }


        const userWishlist = await wishlistDB.findOne({ user: userid });

        if (userWishlist) {
            const productExists = await wishlistDB.findOne({ user: userid, products: ID });
            // if (productExists) {
            //     // console.log('Product already in wishlist');
            //     return res.json({ success: false, message: 'Product already in wishlist' });
            // }
            for(let item of userWishlist.products){
                if(item.toString()==ID){
                    console.log('already in it ')
                    return res.status(400).send('product already in wishlist ')
                }
            }

            await wishlistDB.updateOne(
                { user: userid },
                { $addToSet: { products: ID } }
            );
            // console.log('Successfully added product to wishlist');
            return res.json({ success: true });
        }
        const newWishlist = new wishlistDB({ user: userid, products: [ID] });
        await newWishlist.save();
        // console.log('New wishlist created and product added');
        return res.json({ success: true });
    } catch (err) {
        console.error('Error handling wishlist operation:', err);
        return res.status(500).json({ success: false, error: 'Server error' });
    }

};


exports.delete = async (req, res) => {
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



        const userid = req.session.userId
        const ID = req.params.id
        await wishlistDB.updateOne({ user: userid }, { $pull: { products: ID } })
        res.redirect('/user/wishlist')
    } catch (error) {
        console.log(error, 'from the delete of wishlist ')
    }
}