const passport=require('passport')
const GoogleStrategy=require('passport-google-oauth20').Strategy;
const UserDB=require('../schema/userModel')

const dotenv=require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:'/auth/google/callback'
},

async (accessToken,refreshToken,profile,done)=>{
    

    try{

            const user=await UserDB.findOne({googleId:profile.id})
            if(user){
                return done(null,user)
            }else{
                const creatuser=new UserDB({
                    username:profile.displayName,
                    Email:profile.emails[0].value,
                    googleId:profile.id
                })

                await creatuser.save()
                return done(null,user)
            }
    }catch(err){
        // console.log(err);
        return done(err,null)
        
    }
}

))


passport.serializeUser((user,done)=>{
    
    done(null,user.id)
})


passport.deserializeUser((id,done)=>{
    UserDB.findById(id).then(user=>{
        // req.session.loginuser = true
        done(null,user)
    }).catch(err=>{
        done(err,null)
    })
})



module.exports=passport