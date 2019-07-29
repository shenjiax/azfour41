

const User = require('../database/models/User')

module.exports = (req,res)=>{
	 
	console.log("entering HomePage--req.session: "+JSON.stringify(req.session));
	
	 console.log("entering HomePage--req.session.userId: "+req.session.userId);
      	
    	res.render('index');
	
}