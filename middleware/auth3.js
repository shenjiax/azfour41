

module.exports = (req, res, next) => {
	console.log("auth3 in");
  if (!req.session.decision||req.session.decision!="agreed") {
  	console.log("auth3 if condition in");
       return res.redirect('/consentForm');
  } 
  next();
  
}

