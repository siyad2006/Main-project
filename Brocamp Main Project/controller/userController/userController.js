const UserDB = require('../../schema/userModel')
const bcrypt = require('bcrypt')
const OTP = require('../../schema/otpverification')
const dotenv = require('dotenv').config()
const otpGenerator = require('otp-generator')
const nodemailer = require('nodemailer')
const productDB = require('../../schema/productschema')
const category = require('../../schema/category')
const addressDB = require('../../schema/address')
const mongoose = require('mongoose')
const offerDB = require('../../schema/offerSchema')
const cartDB = require('../../schema/cart')
// const User = require('../../schema/userModel')

const userRegister = async (req, res) => {
    if (req.session.regestered == true) {
        return res.redirect('/')
    }

    res.render('user/userRegister', { error: req.flash('error') });
}




const postregister = async (req, res) => {
    const { username, Email, password } = req.body;



    // const exists = await UserDB.findOne({ username: username });
    // const mailExists = await UserDB.findOne({ Email: Email });

    const exists = await UserDB.findOne({ username: { $regex: `^${username}$`, $options: 'i' } });
    const mailExists = await UserDB.findOne({ Email: { $regex: `^${Email}$`, $options: 'i' } });


    if (mailExists) {
        req.flash('error', "the user is already exists")

        return res.redirect('/user/register');
    }

    req.session.username = username;
    req.session.Email = Email;
    req.session.password = password;
    req.session.forOTP = true

    const generateNumericOtp = (length = 6) => {
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += Math.floor(Math.random() * 10);
        }
        return otp;
    };


    const otp = generateNumericOtp(6);
    console.log(otp);
    req.session.userOtp = otp


    try {

        await OTP.create({ Email, otp });


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'siyadz4x@gmail.com',
                pass: 'wlbz xhxj eqyy lvbc'
            }
        });

        // Send OTP email
        await transporter.sendMail({
            from: 'siyadz4x@gmail.com',
            to: Email,

            subject: 'OTP Verification',
            text: `Your OTP for verification is: ${otp}`
        });


    } catch (error) {
        console.log('Error sending OTP:', error);
    }

    req.session.isRegistered = true

    res.redirect('/user/otp');
}




const otp = async (req, res) => {
    try {


        if (req.session.regestered) {
            return res.redirect('/user/login')
        }
        res.render('user/otp')
    } catch (err) {
        console.log(err, 'this error from the otp')
    }
}


const otpVerification = async (req, res) => {

    const { otp } = req.body;
    if (req.session.userOtp == otp) {

        const username = req.session.username;
        const Email = req.session.Email;
        const localpassword = req.session.password;
        let saltRound = 10
        const password = await bcrypt.hash(localpassword, saltRound)

        // req.session.hashedpassword=password
        try {

            const saveUser = new UserDB({
                username,
                Email,
                password
            })

            await saveUser.save()
            res.json({ success: true, message: 'ok success not', redirectUrl: '/user/login' });

            req.session.forOTP = true
        } catch (err) {
            console.log(err)
        }



    } else {
        res.json({ sucess: false, message: 'invalid otp' })
    }



}


const resentotp = async (req, res) => {
    // delete req.session.userOtp 

    const email = req.session.Email;
    if (!email) {

        return res.json({ success: false, message: 'No email found in session.' });
    }

    const generateNumericOtp = (length = 6) => {
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += Math.floor(Math.random() * 10);
        }
        return otp;
    };

    const otp = generateNumericOtp(6);
    console.log('Generated OTP:', otp);
    req.session.userOtp = otp;

    try {

        await OTP.create({ Email: email, otp });


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'siyadz4x@gmail.com',
                pass: 'wlbz xhxj eqyy lvbc'
            }
        });


        await transporter.sendMail({
            from: 'siyadz4x@gmail.com',
            to: email,
            subject: 'OTP Verification',
            text: `Your OTP for verification is: ${otp}`
        });



        res.json({ success: true, message: 'OTP resent successfully.', redirectUrl: '/user/otp' });

    } catch (error) {
        console.log('Error resending OTP:', error);
        res.json({ success: false, message: 'Failed to resend OTP.', error: error.message });
    }
};



const userlogin = async (req, res) => {
    try {


        if (req.session.isRegistered) {
            req.session.regestered = true
        }

        if (req.session.loginuser) {
            return res.redirect('/')
        }

        res.render('user/UserLogin')

    } catch (error) {
        console.log(error, 'this is from uselogin')
    }
}



const postlogin = async (req, res) => {

    try {
        const { Email, password } = req.body

        const name = await UserDB.findOne({ Email })
        if (!name) {

            return res.json({ success: false, message: 'ithere is no user Exists in this  Email' })
        }

        if (name.googleId) {
            return res.json({ success: false, message: 'please click the login with google ' })

        }






        const cheakpassword = await bcrypt.compare(password, name.password)


        if (name.Email == Email) {
            if (cheakpassword) {
                if (name.isblocked) {
                    res.json({ success: false, message: 'you are blocked by the admin ' })
                } else {
                    req.session.email_profile = Email
                    req.session.loginuser = true;
                    req.session.regestered = true

                    req.session.userId = name._id;
                    // console.log(req.session)
                    res.json({ success: true, message: 'the message is sucess', redirectUrl: '/' })


                }

            } else {
                res.json({ success: false, message: 'the password is incorrect' })
            }

        } else {

            res.json({ success: false, message: 'name is incorrect' })
        }
    }

    catch (err) {
        // console.log(err);

        // console.error('there is no user exists ')
        // res.json({ success: false, message: 'there is no user eixts in the Email ' })
    }

}



const lo = async (req, res) => {




    try {
        const currentdate = Date.now()
        const offers = await offerDB.find({ expire: { $lt: currentdate } })

        for (let offer of offers) {
            const products = await productDB.find({ existOffer: offer._id })
            for (let item of products) {
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
            await offerDB.findByIdAndDelete(offer._id)
        }

    } catch (err) {
        console.log('an error occured from the     side of delete offer', err)
    }

    try {

        if (req.session.passport && req.session.passport.user) {

            req.session.loginuser = true;
            req.session.userId = req.session.passport.user;


            try {
                const email = await UserDB.findOne({ _id: req.session.userId });

                if (!email) {

                    return;
                }

                req.session.email_profile = email.Email;
            } catch (err) {
                console.error('Error fetching user:', err);
            }
        } else {

        }

        let cartCount = 0

        const cart = await cartDB.findOne({ user: req.session.userId })
        if (cart) {
            cartCount = cart.products.length
        }
        req.session.cartCount = cartCount

        const userid = req.session.userId
        const products = await productDB.find({ isblocked: false }).limit(8).populate('category')
        res.render('user/index', { products, userid, cartCount });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Server Error');
    }
};


let productDetails = async (req, res) => {
    const ID = req.params.id;
    let userid = req.session.userId

    const product = await productDB.findById(ID).populate('category')

    if (product.isblocked == true) {
        return res.redirect('/')
    }

    const products = await productDB.find({ category: product.category._id, isblocked: false }).limit(4)

    res.render('user/productdetailied', { product, userid, products });
};



const shoping = async (req, res) => {

    try {



        const { page = 1, limit = 16, sort = 'default', search } = req.query;
        const skip = (page - 1) * limit;

        const categories = await category.find({ isblocked: "Listed" });
        const categorys = req.query.category

        let productsQuery = productDB.find({ isblocked: false }).populate('category').skip(skip).limit(limit);
        if (search !== undefined) {

            const regex = new RegExp(`^${search}`, 'i');

            productsQuery = productsQuery.find({
                name: { $regex: regex }
            });
        }

        if (categorys) {

            productsQuery = productsQuery.find({ category: categorys })
        }

        if (search && categorys) {

            const regex = new RegExp(`^${search}`, 'i');
            productsQuery = productsQuery.find({ category: categorys, name: { $regex: regex } })
        }




        switch (sort) {
            case 'lowToHigh':
                productsQuery = productsQuery.sort({ regularprice: 1 });
                break;
            case 'highToLow':
                productsQuery = productsQuery.sort({ regularprice: -1 });
                break;
            case 'aA-zZ':
                productsQuery = productsQuery.sort({ name: 1 });
                break;
            case 'zZ-aA':
                productsQuery = productsQuery.sort({ name: -1 });
                break;
            case 'New arrivals':
                productsQuery = productsQuery.sort({ createdAt: -1 });
                break;


            default:
                break;
        }


        const products = await productsQuery.exec();
        const totalProducts = await productDB.countDocuments({ isblocked: false });
        const cartCount = req.session.cartCount

        res.render('user/shoping', {
            products,
            currentPage: Number(page),
            totalPages: Math.ceil(totalProducts / limit),
            categories,
            sortOption: sort,
            cartCount
        });
    } catch (error) {
        console.log(error)
    }
};

const demo = async (req, res) => {
    res.redirect('/user/home')
}



const userprofile = async (req, res) => {
    try {

        if (!req.session.email_profile) {

            return res.redirect('/user/home'); // Redirect to login if email is missing
        }

        const userid = await UserDB.aggregate([
            { $match: { Email: req.session.email_profile } },
            { $project: { _id: 1 } }
        ]);

        if (userid.length > 0) {
            const userdata = userid[0]._id;
            const user = await UserDB.findById(userdata);

            const cartCount = req.session.cartCount
            res.render('user/profile', { user, success: req.flash('sucess_update'), cartCount });
        } else {

            res.status(404).send('User not found');
        }
    } catch (err) {
        console.log('Error:', err);
        res.status(500).send('An error occurred while fetching user data');
    }
};


const logout = async (req, res) => {
    try {


        req.session.loginuser = false
        req.session.userId = null
        req.session.passport = false
        req.session.regestered = false
        req.session.totalAmount = null
        req.session.realprice = null
        req.session.discount = null

        res.redirect('/user/login')
    } catch (err) {
        console.log(err, 'error from the logout controller ')
    }
}

const editprofile = async (req, res) => {

    try {



        const ID = req.params.id
        if (ID !== req.session.userId) {
            return res.redirect('/user/home')
        }
        const user = await UserDB.findById(ID)
        res.render('user/Editprofile', { user })
    } catch (err) {
        console.log(err, 'error from edit profile ')
    }
}

const updateprofile = async (req, res) => {

    try {


        const ID = req.params.id

        if (ID !== req.session.userId) {
            return res.redirect('/user/home')
        }
        const username = req.body.username

        const phone = req.body.phone


        await UserDB.findByIdAndUpdate(ID, { username: username.trim(), phonenumber: phone })
        req.flash('sucess_update', 'sucessfully updated profile')

        return res.json({ success: true })
    } catch (error) {
        console.log(error)
    }



}

const changepassword = async (req, res) => {

    try {


        const ID = req.params.id

        if (ID !== req.session.userId) {
            return res.redirect('/user/home')
        }

        const user = await UserDB.findById(ID)
        res.render('user/changepassword', { user })
    } catch (error) {
        console.log(error)
    }
}


const updatepassword = async (req, res) => {
    try {
        const userId = req.params.id;
        if (userId !== req.params.id) {
            return res.redirect('/user/home')
        }
        const { password, newPassword, confirmPassword } = req.body;

        const isgoogle = await UserDB.findById(userId)

        if (isgoogle.googleId) {
            return res.json({ success: false, message: "Sorry you are not able to change the password , cause of you are loggin using google id" });

        }

        if (!password || !newPassword || !confirmPassword) {
            return res.json({ success: false, message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.json({ success: false, message: "Current password must be 6 or more characters" });
        }

        if (newPassword.length < 6) {
            return res.json({ success: false, message: "new password must be six or more charactor " })
        }

        if (newPassword !== confirmPassword) {
            return res.json({ success: false, message: "New password and confirmation do not match" });
        }

        const user = await UserDB.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.json({ success: false, message: "Current password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await UserDB.findByIdAndUpdate(userId, { password: hashedPassword });

        return res.json({ success: true, message: "Password changed successfully", redirectUrl: '/user/profile' });
    } catch (error) {
        console.error("Error updating password:", error);
        return res.json({ success: false, message: "An error occurred, please try again later" });
    }
};

const address = async (req, res) => {
    const ID = req.params.id
    if (ID !== req.session.userId) {
        return res.redirect('/user/home')
    }
    const address = await addressDB.find({ user: ID }).limit(3)
    const user = await UserDB.findById(ID)

    res.render('user/address', { user, address: address })
}

const createaddress = async (req, res) => {
    const ID = req.params.id
    // console.log(ID)
    const { nam,
        phone,
        address,
        city,
        state,
        pincode,
        country,
        title
    } = req.body
    try {
        
        const addresssave = new addressDB({
            user: ID,
            name: nam,
            phone: phone,
            houseAddress: address,
            city: city,
            state: state,
            pincode: pincode,
            country: country,
            title: title

        })
        await addresssave.save()
        res.json({ success: true, message: 'address saved sucessfully', redirectUrl: `/user/address/${ID}` })



    } catch (err) {
        console.log('an error occured when fetch userdata for address', err)
    }



}

const deleteaddress = async (req, res) => {
    try {


        const ID = req.params.id
        const userid = req.params.user
        if (userid !== req.session.userId) {
            return res.redirect('/user/home')
        }

        await addressDB.findByIdAndDelete(ID)
        // res.redirect(`/user/address/${userid}`)
        res.json({ success: true })
    } catch (error) {
        console.log(error)
    }
}

const updateaddress = async (req, res) => {
    const ID = req.params.id;
    const userID = req.params.user;
    if (userID !== req.session.userId) {
        return res.redirect('/user/home')
    }
    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(ID) || !mongoose.Types.ObjectId.isValid(userID)) {
        return res.status(400).send("Invalid ID format");
    }

    try {
        const address = await addressDB.findById(ID);
        const user = await UserDB.findById(userID);

        if (!address || !user) {
            return res.status(404).send("Address or User not found");
        }

        res.render('user/editAddress', { address, user });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
};

const updatingAddress = async (req, res) => {
    const ID = req.params.id
    const userid = req.params.user
    const { name, phone, address, city, state, pincode, country, title } = req.body


    try {
        await addressDB.findByIdAndUpdate(ID, {

            name: name,
            phone: phone,
            houseAddress: address,
            city: city,
            state: state,
            pincode: pincode,
            country: country,
            title: title
        }).then((data) => console.log('changed successfully')).catch(err => console.log(err))

        // res.redirect(`/user/address/${userid}`)
        return res.json({ success: true })
    } catch (err) {
        console.log('error occured when update address', err)
    }



}


const test = async (req, res) => {
    try {

        const products = await productDB.find()
        res.render('user/index', { products })
    } catch (err) {
        console.log(err, 'error occured when testing ')
    }
}

const forgetpassword = async (req, res) => {
    if(req.session.userId){
        res.redirect('/')
    }
    res.render('user/forgotPassword')
}

const otpforgot = async (req, res) => {
    // res.json({success:true,message:'success'})
    try {
        const Email = req.body.Email
        req.session.emailforResendOtp=Email
        const isUser = await UserDB.findOne({ Email: Email })

        if (!isUser) {
            return res.json({ success: false, message: 'there is no user exist in that email' })
        }
        req.session.idforPassword = isUser._id
        if (isUser.googleId) {
            return res.json({ success: false, message: 'please login using google id ' })

        }

        const generateNumericOtp = (length = 6) => {
            let otp = '';
            for (let i = 0; i < length; i++) {
                otp += Math.floor(Math.random() * 10);
            }
            return otp;
        };


        const otp = generateNumericOtp(6);
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'siyadz4x@gmail.com',
                pass: 'wlbz xhxj eqyy lvbc'
            }
        });

        await transporter.sendMail({
            from: 'siyadz4x@gmail.com',
            to: Email,

            subject: 'OTP Verification',
            text: `Your OTP for verification is: ${otp}`
        });

        req.session.forgotPassotp = otp

        console.log(otp)

        
        req.session.authenticationOTP = null

        res.json({ success: true, message: 'otp sended ' })

    } catch (err) {
        console.log(err)
    }


}

const verifyPasswordOtp = async (req, res) => {
    if(req.session.userId){
        res.redirect('/')
    }
    if (req.session.authenticationOTP == true) {
        return res.redirect('/user/changePasswordForgot')
    }
    res.render('user/verifyOtp')
}

const verifyotpForgotPassword = async (req, res) => {
    
    const otp = req.body.otp
    if (otp !== req.session.forgotPassotp) {
        return res.json({ success: false, message: 'invalid otp' })
    } else { 
        req.session.otpVerified = true
        return res.json({ success: true })
    }

}

const changePasswordForgot = async (req, res) => {
    if(req.session.userId){
        res.redirect('/')
    }
   
    req.session.authenticationOTP = true
    res.render('user/createNewPassword')
}

const createNewPassword = async (req, res) => { 
     try {
        
        const password = req.body.password
        const newPassword = await bcrypt.hash(password, 10)
        if (!req.session.idforPassword) {
            return res.json({ success: false, message: 'sorry , there is no user exist ' })
        }

        await UserDB.findByIdAndUpdate(req.session.idforPassword, {
            password: newPassword

        }).then(() => {
            req.session.authenticationOTP = false
            req.session.forgotPassotp=null
            return res.json({ success: true })

        })
    
    } catch (err) {
        console.log(err)
    }
 
}


const resendOtpforgotpassword = async (req,res)=>{
   Email = req.session.emailforResendOtp
   const isUser = await UserDB.findOne({ Email: Email })

        if (!isUser) {
            return res.json({ success: false, message: 'there is no user exist in that email' })
        }
        req.session.idforPassword = isUser._id
        if (isUser.googleId) {
            return res.json({ success: false, message: 'please login using google id ' })

        }

        const generateNumericOtp = (length = 6) => {
            let otp = '';
            for (let i = 0; i < length; i++) {
                otp += Math.floor(Math.random() * 10);
            }
            return otp;
        };


        const otp = generateNumericOtp(6);
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'siyadz4x@gmail.com',
                pass: 'wlbz xhxj eqyy lvbc'
            }
        });

        await transporter.sendMail({
            from: 'siyadz4x@gmail.com',
            to: Email,

            subject: 'OTP Verification',
            text: `Your OTP for verification is: ${otp}`
        });

        req.session.forgotPassotp = otp

        console.log(otp)

        return res.redirect('/user/verifyPasswordOtp')
        
}

module.exports = {
    postregister,
    userRegister,
    otp,
    otpVerification,
    resentotp,
    userlogin,
    postlogin,
    lo,
    productDetails,
    shoping,
    demo,
    userprofile,
    logout,
    editprofile,
    updateprofile,
    changepassword,
    updatepassword,
    address,
    createaddress,
    deleteaddress,
    updateaddress,
    updatingAddress,
    test,
    forgetpassword,
    otpforgot,
    verifyPasswordOtp,
    verifyotpForgotPassword,
    changePasswordForgot,
    createNewPassword,
    resendOtpforgotpassword
};
