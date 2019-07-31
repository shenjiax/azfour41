//to render game setting page(deprecated)
var gUserId=1; 

module.exports = (req,res)=>{

	if (!req.session.userId){
		req.session.userId=gUserId;
		gUserId++;
		console.log(gUserId);
	}
	
	return res.render('gameSetting');

}