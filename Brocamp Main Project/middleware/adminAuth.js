
const adminController = require('./../controller/adminController/adminController')

function isAdmin(req, res, next) {
    console.log('Checking admin session:', req.session);
    if (req.session.admin) {
        next();
    } else {
        res.redirect('/admin/login');
    }
}

function adminLogin(req,res,next){
   if(req.session.admin){
    res.redirect('/admin/dashboard')
   }else{
    next()
   }
}

module.exports = { isAdmin,adminLogin };
