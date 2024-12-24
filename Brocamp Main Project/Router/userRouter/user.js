const express = require('express')
const userAuth = require('../../middleware/userAuth')
const userController = require('../../controller/userController/userController');
const router = express.Router()
const cartController = require('../../controller/userController/cartController')
const order = require('../../controller/userController/order')
const wishlist = require('../../controller/userController/wishlist')
const coupun=require('../../controller/adminController/coupun')
const offer=require('../../controller/adminController/offerController')



router.get('/register', userController.userRegister)
router.post('/postregister', userController.postregister)
router.get('/otp', userAuth.isRegistered, userController.otp)
router.get('/login', userController.userlogin)  
router.post('/userlogin', userController.postlogin)
router.post('/verify-otp', userController.otpVerification);
router.get('/home',userController.homepage)
router.post('/resentotp', userController.resentotp)
router.get('/details/:id', userController.productDetails)
router.get('/shop', userController.shoping)
router.get('/demo', userController.demo)
router.get('/logout', userController.logout)
router.get('/profile', userAuth.loginuser, userController.userprofile)
router.get('/editprofile/:id', userAuth.loginuser, userController.editprofile)

router.patch('/editprofile/change/:id', userController.updateprofile)

router.get('/changepassword/:id', userAuth.loginuser, userController.changepassword)

router.post('/updatepassword/:id', userController.updatepassword)

router.get('/address/:id',userAuth.loginuser, userController.address);
router.post('/createaddress/:id', userController.createaddress);

router.delete('/deleteaddress/:id/:user', userController.deleteaddress);

router.get('/updateaddress/:id/:user', userController.updateaddress);

router.patch('/postchange/:id/:user', userController.updatingAddress);

router.get('/cart', userAuth.loginuser, cartController.getcart);
router.post('/addcart/:id/:user', cartController.addcart);
router.post('/cart/update', cartController.updateCart);
router.post('/cart/remove', cartController.removecart);
router.post('/checkout/:cart', order.getcheackout);
router.post('/placeorder/:user', order.placeorder);
router.get('/myorders/:user', userAuth.loginuser,order.myorders);
router.post('/cancelorder/:id', order.cancelorder);
router.get('/success/:orderid', order.success);
router.get('/wishlist', userAuth.loginuser,wishlist.getpage);
router.post('/addtowishlist', wishlist.additem)
router.post('/wishlist/delete/:id',wishlist.delete)
router.post('/applycoupun',cartController.addcoupun)
router.get('/orderdetails/:id',order.details)
router.post('/return/:id',order.return)
router.get('/viewcoupun/:user',coupun.viewcoupun)
router.get('/wallet/:id',order.wallet)
router.get('/addoffer',offer.addoffer)

router.post('/addcart/:id/',cartController.debughome);
router.post('/removecoupun',cartController.removecoupun)
router.get('/test',userController.test)
router.post('/ordersummary',order.dowloadsummary)
router.get('/getinvoice',order.invoice)
router.get('/pendingpayment/:user',order.pendingorder)
router.post('/repay',order.repay)

router.get('/forgotpassword',  userController.forgetpasswordgetEmail)
router.post('/otpforpassword', userController.otpforForgotPassword)
router.get('/verifyPasswordOtp' ,userController.verifyPasswordOtp)
router.post('/verifyotpForgotPassword',userController.verifyotpForgotPassword)
router.get('/changePasswordForgot',  userController.changeForgotPassword)
router.post('/createNewPassword',userController.createNewPassword)
router.get('/resendOtpforgotpassword',userController.resendOtpforgotpassword)

module.exports = router