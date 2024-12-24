const express= require('express')
const router= express.Router()
const usecontroller=require('../../controller/userController/userController')

router.get('/',usecontroller.homepage)



module.exports=router