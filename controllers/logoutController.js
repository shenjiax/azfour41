module.exports = (req, res) => {
	console.log("logoutController in!")
  req.session.destroy(() => {
    res.redirect('/')
  })
}