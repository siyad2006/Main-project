const UserDB = require('../../schema/userModel')
const CategoryDB = require('../../schema/category')
const multer = require('multer')
// const BarandModel = require('../../schema/brandModel')
const fs = require('fs');
const path = require('path');
const BrandModel = require('../../schema/brandModel');
const product = require('../../schema/productschema');
const dotenv = require('dotenv').config()
const cartDB = require('../../schema/cart')
const wishlistDB = require('../../schema/wishlistSchema')
const checkoutDB = require('../../schema/cheakout')

// admin login
const login = async (req, res) => {

    res.render('admin/adminLogin', { err: req.flash('err') })
    
}

const postLogin = async (req, res) => {
    const { adminname, password } = req.body;
 
    if (adminname.trim() === process.env.ADMIN_NAME && password.trim() === process.env.ADMIN_PASSWORD) {
     
        req.session.admin = true;
      
        res.redirect('/admin/dashboard');
    } else {

        req.flash('err', 'Login password is incorrect!');

        res.redirect('/admin/login')


    }
};



// user manage 
const usermanage = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalUsers = await UserDB.countDocuments();
    const users = await UserDB.find().skip(skip).limit(limit);

    const totalPages = Math.ceil(totalUsers / limit);

    
    res.render('admin/userManage', {
        users,
        page,
        totalPages,
    })
}

// for get dashboard
const dashboard = async (req, res) => {

    try {

        const totalUsers = await UserDB.countDocuments();

 
        let pendingCount = 0
        const totalsaless = await checkoutDB.aggregate([
            { $match: { status: { $nin: ['canceled', 'return', 'payment-pending'] } } },
            { $group: { _id: null, totalsales: { $sum: '$totalprice' } } },
            { $project: { _id: 0, totalsales: 1 } }
        ]);

        let totalsales = 0;

        if (totalsaless && totalsaless.length > 0 && totalsaless[0].totalsales) {
            totalsales = totalsaless[0].totalsales;
        }
 

        const topProducts = await product.find().sort({ sold: -1 }).limit(10)

        const categories = await CategoryDB.find()


        const topCategories = [];

        for (let item of categories) {
            let sold = 0;

            const categoryProducts = await product.find({ category: item._id });

            categoryProducts.map((i) => {
                const itemsold = Number(i.sold || 0); 
                if (!isNaN(itemsold)) {
                    sold += itemsold; 
                } else {
                    console.warn(`Invalid sold value for product: ${i.sold}`);
                }
            });

            const obj = {
                categoryName: item.categoryname,
                sold: Number(sold),
            };
            topCategories.push(obj);
        }
 
 
        const sortedAnswer = await CategoryDB.find({}).sort({ sold: -1 }).limit(10)
     


 

        const brandproducts = await product.aggregate([
            { $unwind: '$brand' },
            { $project: { _id: 0, brand: 1 } }
        ])

 

        const uniqueBrands = [];
        const seen = new Set();

        for (const item of brandproducts) {
            if (!seen.has(item.brand)) {
                uniqueBrands.push(item.brand); 
                seen.add(item.brand);  
            }
        }
 
 

        let topBrands = [];

        for (let item of uniqueBrands) {
            let sold = 0;

            const productsInBrand = await product.find({ brand: item });
            for (let i of productsInBrand) {
           
                sold += Number(i.sold) || 0;
            }

            topBrands.push({
                brandname: item,
                sold: sold
            });
        } 

        const brands = topBrands.sort((b, a) => a.sold - b.sold)
        

        let filter = req.query.filter || 'yearly'

        switch (filter) {
            case 'yearly':


                const s = await product.aggregate([
                    { $match: { sold: { $gt: 0 } } },
                    {
                        $project: {
                            year: { $year: "$createdAt" },
                            salesAmount: { $multiply: ["$sold", "$regularprice"] }
                        }
                    },
                    {
                        $group: {
                            _id: "$year",
                            totalSalesAmount: { $sum: "$salesAmount" }
                        }
                    },
                    { $sort: { _id: 1 } }
                ])


                const yearlyData = await checkoutDB.aggregate([
                    { $match: { status: { $nin: ['canceled', 'return', 'payment-pending'] } } },
                    {
                        $project: {
                            year: { $year: "$createdAt" },
                            salesAmount: '$totalprice'
                        }
                    },
                    {
                        $group: {
                            _id: "$year",
                            totalSalesAmount: { $sum: "$salesAmount" }
                        }
                    },
                    { $sort: { _id: 1 } }

                ])

                // console.log(test)
 

                const formattedData = {
                    year: {
                        labels: yearlyData.map(item => item._id),
                        sales: yearlyData.map(item => item.totalSalesAmount)
                    }
                };

                res.render('admin/dashboard', { totalUsers, topProducts, categories: sortedAnswer, formattedData: JSON.stringify(formattedData), brands, totalsales, pendingCount })

                break;

            case 'month':
                if (true) {


                    const monthlyData = await checkoutDB.aggregate([
                        {
                            $match: {
                                status: { $nin: ['canceled', 'return', 'payment-pending'] },
                                createdAt: {
                                    $gte: new Date("2024-01-01"),
                                    $lt: new Date("2025-01-01")
                                }
                            }
                        },
                        {
                            $project: {
                                year: { $year: "$createdAt" },
                                month: { $month: "$createdAt" },
                                salesAmount: "$totalprice"
                            }
                        },
                        {
                            $group: {
                                _id: { year: "$year", month: "$month" },
                                totalSalesAmount: { $sum: "$salesAmount" }
                            }
                        },
                        {
                            $sort: { "_id.year": 1, "_id.month": 1 }
                        }
                    ]);
 

                    const formattedData = {
                        year: {
                            labels: Array.from({ length: 12 }, (_, i) => i + 1),
                            sales: Array(12).fill(0)
                        }
                    };

                    monthlyData.forEach(item => {
                        const monthIndex = item._id.month - 1;
                        formattedData.year.sales[monthIndex] = item.totalSalesAmount;
                    });
 
                    res.render('admin/dashboard', {
                        totalUsers,
                        topProducts,
                        categories: sortedAnswer,
                        formattedData: JSON.stringify(formattedData),
                        brands,
                        totalsales,
                        pendingCount
                    });
                }

                break;

 
                 
                case 'weekly':
                    if (true) {
                      
                       const currentDate = new Date();
                      const startDate = new Date(currentDate);
                      startDate.setDate(currentDate.getDate() - 6);  
                        const dailyData = await checkoutDB.aggregate([
                        {
                          $match: {
                            status: { $nin: ['canceled', 'return', 'payment-pending'] },
                            createdAt: { $gte: startDate, $lte: currentDate }  
                          }
                        },
                        {
                          $project: {
                            date: {
                              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }  
                            },
                            salesAmount: "$totalprice"
                          }
                        },
                        {
                          $group: {
                            _id: "$date",
                            totalSalesAmount: { $sum: "$salesAmount" } 
                          }
                        },
                        {
                          $sort: { _id: 1 }  
                         }
                      ]);
                   
                      const labels = [];
                      const sales = [];
                   
                      for (let i = 0; i < 7; i++) {
                        const date = new Date(startDate);
                        date.setDate(startDate.getDate() + i);
                        const formattedDate = date.toISOString().split('T')[0]; 
                        labels.push(formattedDate);
                        
                        const dayData = dailyData.find(item => item._id === formattedDate);
                        sales.push(dayData ? dayData.totalSalesAmount : 0); // Default to 0 if no data for the day
                      }
                  
                      const formattedData = {
                        year: {
                          labels,
                          sales
                        }
                      };
                  
                      res.render('admin/dashboard', {
                        totalUsers,
                        topProducts,
                        categories: sortedAnswer,
                        formattedData: JSON.stringify(formattedData),
                        brands,
                        totalsales,
                        pendingCount
                      });
                    }
                    break;
                

        }



    } catch (err) {
        console.log('error  from the dashboard ', err)
    }
}


 

const blockuser = async (req, res) => {
    const val = req.params.id;  
    const page = req.query.page || 1;  
    try {
        const updatedUser = await UserDB.findByIdAndUpdate(val, { isblocked: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }
      
        return res.status(200).json({ message: 'User successfully blocked.', userId: val });
    } catch (err) {
        console.error('Error blocking user:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};



// for ubblock user
const unblockuser = async (req, res) => {
    const val = req.params.id
    const page = req.query.page || 1
 

    try {
        await UserDB.findByIdAndUpdate(val, { isblocked: false })
        console.warn('user inblocked ')
        // res.redirect(`/admin/usermanage?page=${page}`)
        return res.status(200).json({messasge:'user unblocked '})
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: 'Internal server error.' });
    }

}



const category = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    try {
        const totalCategories = await CategoryDB.countDocuments();
        const categories = await CategoryDB.find()
            .skip((page - 1) * limit)
            .limit(limit);

        res.render('admin/category', {
            categories,
            currentPage: page,
            totalPages: Math.ceil(totalCategories / limit),
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).send("Server Error");
    }
};



// for add category
const addcateory = async (req, res) => {
    res.render('admin/addcategory')
}




const creatcategory = async (req, res) => {
    const { categoryname, discription } = req.body;
    const compare = categoryname.toUpperCase()

    try {
        const existingCategory = await CategoryDB.findOne({ categoryname: categoryname.trim() });

        if (existingCategory) {
            req.flash('category_err', 'The category name already exists');
            return res.redirect('/admin/category');
        }

        const exist = await CategoryDB.find()
        for (let item of exist) {

            if (compare == item.categoryname.toUpperCase()) {
                req.flash('category_err', 'The category name already exists');

                return res.redirect('/admin/category')
            }
        }

        const category = new CategoryDB({
            categoryname: categoryname.trim(),
            discription: discription.trim()
        });

        await category.save();
        req.flash('success_msg', 'Category saved successfully');
        res.redirect('/admin/category');
    } catch (error) {
        console.error('An error occurred when saving the category:', error);
        req.flash('error_msg', 'An error occurred while saving the category');
        res.redirect('/admin/category');
    }
};




// for List category

const blockcategory = async (req, res) => {


    try {



        let ID = req.params.id

        const categoryProducts = await product.find({ category: ID },{_id:1})

       
        await cartDB.updateMany(
            { 'products.productId': { $in: categoryProducts } },
            {
                $pull: {
                    products: {
                        productId: { $in: categoryProducts },
                    },
                },
            }
        );
        
    

        await wishlistDB.updateMany(
            { 'products': { $in: categoryProducts } },  
            {
                $pull: {
                    products: { $in: categoryProducts }  
                }
            }
        );

        await  product.updateMany({category:ID},{
            isblocked:true
        })


        await CategoryDB.findByIdAndUpdate(ID, { isblocked: 'Unlisted' })
        


        return res.json({success:true})



    } catch (err) {
        console.log('error occured in the code of category blockuing', err)
    }



}



// for unlist category
const unblockcategory = async (req, res) => {
    const ID = req.params.id
   
    await product.updateMany({category:ID},{
        isblocked:false
    })
    try {

        await CategoryDB.findByIdAndUpdate(ID, { isblocked: 'Listed' })
        // res.redirect('/admin/category')
        return res.json({success:true})

    } catch (err) {
        console.log(err);

    }

}


// for edit category
const editcategory = async (req, res) => {

    try {
        const ID = req.params.id

        const category = await CategoryDB.findById(ID)

        res.render('admin/editcategory', { category })
    } catch (error) {
        console.log(error);

    }

    
}



const editing = async (req, res) => {
    const ID = req.params.id;
    const categoryname = req.body.categoryname.trim();
    const discription = req.body.discription.trim();

    try {

        // const existingCategory = await CategoryDB.findOne({ categoryname });
        const existingCategory = await CategoryDB.findOne({
            categoryname: { $regex: new RegExp(`^${categoryname}`, 'i') }
        });


        if (existingCategory && existingCategory._id.toString() !== ID) {
            return res.redirect('/admin/category');
        } else {

            await CategoryDB.updateOne({ _id: ID }, { categoryname, discription });
            res.redirect('/admin/category');
        }
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).send('Internal Server Error');
    }
};


const addbrand = async (req, res) => {

    try {
        const brands = await BrandModel.find();



        const brandsWithImages = brands.map(brand => ({
            ...brand.toObject(),
            logo: `data:${brand.logo.contentType};base64,${brand.logo.data.toString('base64')}`
        }));

        res.render('admin/brand', { brands: brandsWithImages });
    } catch (error) {
        console.error('Error fetching brands:', error);
        res.status(500).send('Error fetching brands');
    }





}





const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage }).single('image');


const postbrand = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(500).send('Error uploading file.');
        }


        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }


        const logoPath = path.join(uploadsDir, req.file.filename);
        console.log('Logo path:', logoPath);


        let logoData;
        try {
            logoData = await fs.promises.readFile(logoPath);
        } catch (error) {
            console.error('Error reading file:', error);
            return res.status(500).send('Error reading file.');
        }

        const brandname = req.body.brandname;
        console.log('Brand name:', brandname);


        const brand = new BrandModel({
            brandname: brandname,
            logo: {
                data: logoData,
                contentType: req.file.mimetype,
            },
        });


        try {
            await brand.save();
            console.log('Successfully saved brand');
            res.redirect('/admin/brand')
            // return res.status(201).send('Brand created successfully.');
        } catch (error) {
            console.error('Error saving brand:', error);
            return res.status(500).send('Error saving brand.');
        }
    });
};



const logout = async (req, res) => {
    delete req.session.admin;
    res.redirect('/admin/login')
}


module.exports = {
    login,
    postLogin,
    usermanage,
    dashboard,
    blockuser,
    unblockuser,
    category,
    addcateory,
    creatcategory,
    blockcategory,
    unblockcategory,
    editcategory,
    editing,
    addbrand,
    postbrand,
    logout

}
