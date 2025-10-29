module.exports = (...roles) =>{
    console.log('roles',roles);
    
    return (req,res,next) => {
        if(!roles.includes(req.currentUser.role)){
            return res.json('this role is not authorized')
        }
            next()
    }
}