module.exports = (req,res)=>{
	// console.log(req.body.skill_choice);
	// console.log(req.body.model_choice);
	res.render('newGame',{
		skill_choice_c: req.body.skill_choice_c,
		model_choice_c: req.body.model_choice_c,
		skill_choice_u: req.body.skill_choice_u,
		model_choice_u: req.body.model_choice_u
	});
}