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



// function loginuser(req, res, next) {
//   console.log('Login Middleware:', req.session);

//   if (req.session.loginuser) {
//       // Redirect to home if already logged in
//       if (req.originalUrl === '/user/login') {
//           return res.redirect('/user/home');
//       }
//       return next();
//   } else {
//       if (req.originalUrl === '/user/login') {
//           return next(); // Allow access to login page
//       }
//       return res.redirect('/user/login');
//   }
// }



 
 

// function islogin(req, res, next) { 
//   if (req.session.userId && req.originalUrl === '/user/login') {
//       res.redirect('/user/home'); 
//   }
//   next(); 
// }

module.exports = { isRegistered,loginuser  }