function isRegistered(req, res, next) {
  
  if (req.session.forOTP==true) {
   return next()
  } else {
    res.redirect('/user/register')
  }
}


function loginuser(req,res,next){
 
  if(req.session.loginuser==true){
     
  
  return  next()
  }else{
    res.redirect('/user/login')
  }
}


 
module.exports = { isRegistered,loginuser  }