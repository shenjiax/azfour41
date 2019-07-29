const User = require('../database/models/User')

module.exports = (req, res) => {
	console.log("storeusercontroller in !");
  
  	console.log("req.body.: "+JSON.stringify(req.body));
	 // console.log("req.body.username: "+req.body.username);
	 // console.log("req.body.: "+JSON.stringify(req.body));

User.create(req.body, (error, user) => {
	if (error){

	const registrationErrors = Object.keys(error.errors).map(key=>error.errors[key].message)
	console.log(Object.keys(error.errors).map(key=>error.errors[key].message))
	//req.session.registrationErrors=registrationErrors


	req.flash('registrationErrors',registrationErrors )
	//req.flash('data',req.body)

	res.redirect('/auth/register');
	return; 
	}
	res.redirect('/');
}) 
}