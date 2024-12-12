const express = require('express')
const AdminController = require('../../controller/adminController/adminController')
const adminAuth = require('../../middleware/adminAuth')
const productController = require('../../controller/adminController/productController')
const router = express.Router()
const order = require('../../controller/adminController/ordermanage')
const coupuncontroller = require('../../controller/adminController/coupun')
const upload = require('../../multer/upload')
const product = require('../../schema/productschema')
const offer=require('../../controller/adminController/offerController')


router.get('/login', adminAuth.adminLogin, AdminController.login)
router.post('/login', AdminController.postLogin)
router.get('/usermanage', adminAuth.isAdmin, AdminController.usermanage)
router.get('/dashboard',adminAuth.isAdmin, AdminController.dashboard);
router.post('/blockuser/:id', AdminController.blockuser)
router.post('/unblockuser/:id', AdminController.unblockuser)
router.get('/category', adminAuth.isAdmin, AdminController.category)

router.post('/addcategory', AdminController.addcateory)
router.post('/creatcategory', AdminController.creatcategory)
router.post('/blockcategory/:id', AdminController.blockcategory)
router.post('/unblockcategory/:id', AdminController.unblockcategory)
router.post('/editcategory/:id', AdminController.editcategory)
router.post('/:id/categoryedit', AdminController.editing)
router.get('/brand', adminAuth.isAdmin, AdminController.addbrand)
router.post('/postbrand', AdminController.postbrand)
router.get('/addproduct', adminAuth.isAdmin, productController.addproduct)
router.post('/add', upload, productController.add)
router.get('/products', adminAuth.isAdmin, productController.getproduct)
router.post('/block/:id', productController.blockproduct)
router.post('/unblock/:id', productController.unblockproduct)
router.post('/deleteproduct/:id', productController.deleteproduct)
router.get('/editproduct/:id', upload, productController.editproduct)
router.post('/Edit/:id', upload, productController.postEdit)
router.get('/logout', AdminController.logout)
router.get('/ordermanagement',adminAuth.isAdmin, adminAuth.isAdmin, order.getordermanage)
router.post('/update-order-status', order.changestatus)
router.get('/coupun', adminAuth.isAdmin,coupuncontroller.getpage)
router.post('/createcoupun', coupuncontroller.addcoupun);
router.post('/deletecoupun/:id',coupuncontroller.deletecoupun)
router.get('/addoffer',adminAuth.isAdmin,offer.addoffer)
router.post('/createoffer',offer.createoffer)
router.get('/offer',adminAuth.isAdmin,offer.getoffer)
router.post('/deleteoffer/:id',offer.deleteoffer)
router.get('/editoffer/:id',adminAuth.isAdmin,offer.editoffer)
router.post('/posteditoffer/:id',offer.posteditoffer)
router.get('/salesreport',adminAuth.isAdmin,order.getsalesreport)
router.get('/salesreport/pdf',adminAuth.isAdmin,order.downloadpdf)
router.get('/salesreport/excel',adminAuth.isAdmin,order.downloadExcel)
router.get('/orderdetails/:id',adminAuth.isAdmin,order.orderview) // add session here 
router.get('/productoffer',adminAuth.isAdmin,offer.getproductoffer)
router.post('/product-offer',offer.postproductoffer)





module.exports = router