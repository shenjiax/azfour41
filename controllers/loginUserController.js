


// const bcrypt = require('bcrypt')
// const User = require('../database/models/User')

// module.exports = (req, res) => {
//     res.redirect('/')
// }


const bcrypt = require('bcrypt')
const User = require('../database/models/User')

module.exports = (req, res) => {
   
  const email=req.body.email;
  const password=req.body.password;

  // try to find the user
  User.findOne({ email }, (error, user) => {
    if (user) {
      console.log("USER FOUND")
      // compare passwords.
      bcrypt.compare(password, user.password, (error, same) => {
        if (same) {
          console.log("same!!")
          req.session.userId=user._id
          res.redirect('/')
        } else {
          console.log("NOT same!!")
          res.redirect('/auth/login')
        }
      })
    } else { 
      console.log("USER NOT FOUND")
      return res.redirect('/auth/login')
    }
  })
}