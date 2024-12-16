const fs = require('fs');
const path = require('path');
const multer = require('multer')
const productDB = require('../../schema/productschema')
const category = require('../../schema/category');
const product = require('../../schema/productschema');
const cartDB = require('../../schema/cart');
const wishlistDB = require('../../schema/wishlistSchema');
const offerDB = require('../../schema/offerSchema');
// const { default: products } = require('razorpay/dist/types/products');

const addproduct = async (req, res) => {

    const categoris = await category.find({ isblocked: 'Listed' })

    res.render('admin/addproduct', { categoris })
}


const add = async (req, res) => {
    const val = req.body;
 

    const imagePaths = [];

    if (req.files) {

        if (req.files.image1) {
            imagePaths.push(req.files.image1[0].path);
            if (req.files.image2) {
                imagePaths.push(req.files.image2[0].path);
            }
            if (req.files.image3) {
                imagePaths.push(req.files.image3[0].path);
            }
        }

        const newProduct = new productDB({
            name: val.productname.trim(),
            discription: val.discription.trim(),
            brand: val.brand.trim(),
            category: val.category,
            regularprice: val.regularprice,
            quantity: val.quantity,
            color: val.color.trim(),
            image: imagePaths,
            status: val.status || "available",
            realprice: val.regularprice
        });


        await newProduct.save();


        res.redirect('/admin/products');
    };


}

const postEdit = async (req, res) => {
    const productId = req.params.id;
    const val = req.body;
    const imagePaths = [];

    try {
        if (req.files) {
            if (req.files.image1) {
                imagePaths.push(req.files.image1[0].path);
            } else {
                imagePaths.push(null);
            }
            if (req.files.image2) {
                imagePaths.push(req.files.image2[0].path);
            } else {
                imagePaths.push(null);
            }
            if (req.files.image3) {
                imagePaths.push(req.files.image3[0].path);
            } else {
                imagePaths.push(null);
            }
        }

        const existingProduct = await productDB.findById(productId);

        const updatedImages = existingProduct.image.map((oldImage, index) => {
            if (imagePaths[index]) {
                fs.unlink(oldImage, (err) => {
                    if (err) console.log(`Failed to delete old image at ${oldImage}: `, err);
                });
                return imagePaths[index];
            }
            return oldImage;
        });

        let productOffer = await productDB.findById(productId)

        if (productOffer && productOffer.existOffer) {

            const offer = await offerDB.findById(productOffer.existOffer)
            let discount = offer.discountValue
            let offerId = offer._id
            let offeredValue = val.regularprice - Number(val.regularprice * (discount / 100))
            


            await productDB.updateOne(
                { _id: productId },
                {
                    existOffer: offerId,
                    offerPersent: discount,
                    offerprice: offeredValue,
                    regularprice: offeredValue,
                    realprice: val.regularprice,
                    name: val.productname.trim(),
                    discription: val.discription.trim(),
                       
                    quantity: val.quantity,
                   
                    image: updatedImages,
                    status: val.status || "available",
               
                }
            );
          
            return res.redirect('/admin/products')

        }

        await productDB.findByIdAndUpdate(
            productId,
            {
                name: val.productname.trim(),
                discription: val.discription.trim(),
                 
                // category: val.category,
                regularprice: val.regularprice,
                quantity: val.quantity,
               
                image: updatedImages,
                status: val.status || "available",
                realprice: val.regularprice
            },
            { new: true }
        );

        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).send('Failed to edit product. Please try again.');
    }
};


const getproduct = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    try {
        const products = await productDB.find().populate('category').skip(skip).limit(limit);
        const totalProducts = await productDB.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);
        res.render('admin/product', {
            products,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching products");
    }
};



const blockproduct = async (req, res) => {

    try {
        const ID = req.params.id

       


        const carts = await cartDB.find({ 'products.productId': ID })
        for (let item of carts) {
            let total = item.totalAmount
            let productqty = item.products.find((i) => i.productId.toString() === ID)
            let qty = 0
            if (product) {
                qty += productqty.qty;

            }

            if (qty <= 0) {
                qty = 1
            }

            const currentproductPrice = await productDB.findById(ID, { regularprice: 1 })
            const qtyPrice = Number(currentproductPrice.regularprice * qty)
            const updatedPrice = Number(total - qtyPrice)
            await cartDB.updateMany({ _id: item._id },
                { $pull: { products: { 'productId': ID } }, totalAmount: updatedPrice }
            )

        }

        const wishlist = await wishlistDB.find({ products: ID })

        for (let item of wishlist) {
            await wishlistDB.updateOne({ _id: item._id }, {
                $pull: { products: ID }
            })
        }
  
        await productDB.findByIdAndUpdate({ _id: ID }, { isblocked: true })
        // res.redirect('/admin/products')
        res.json({success:true})
    } catch (err) {
        console.log(err)
    }
}

const unblockproduct = async (req, res) => {
    try {

        const ID = req.params.id

        const categoryblock= await productDB.findById(ID).populate('category')

        if(categoryblock.category.isblocked=='Unlisted'){
            return res.redirect('/admin/products')
        }

        await productDB.findByIdAndUpdate({ _id: ID }, { isblocked: false })
        // res.redirect('/admin/products')
        return res.json({success:true})

    } catch (error) {
        console.log(error);

    }
}
 

const deleteproduct = async (req, res) => {
    try {
      const ID = req.params.id;
      await productDB.findByIdAndDelete(ID);
      
      return res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('An error occurred while deleting the product:', error);
      return res.status(500).json({ message: 'An error occurred while deleting the product' });
    }
  };
  



const editproduct = async (req, res) => {
    if (!req.session.admin) {
        res.redirect('/admin/login')
    }
    const ID = req.params.id
    const product = await productDB.findById(ID)
    const categoris = await category.find()
    res.render('admin/editproduct', { product, categoris })
}

module.exports = { addproduct, add, getproduct, blockproduct, unblockproduct, deleteproduct, editproduct, postEdit }