

module.exports = (req, res, next) => {
  if (req.session.userId && req.session.gamePlayed>=3) {
    return res.redirect('/')
  } 
     next()
}

