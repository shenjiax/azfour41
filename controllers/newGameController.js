const Move = require('../database/models/Move')
//This is when page is refreshed


module.exports = (req,res)=>{

	console.log("entering new game controller"); 
	console.log("req.session.gamePlayed: "+req.session.gamePlayed);
	var gGameIdd = req.session.gamePlayed; //how many games user has already played
	var gGameWinnedd = req.session.gameWinned; 
	var gGameDrawedd = req.session.gameDrawed; 
	var gGameLostd = req.session.gameLost; 
	console.log("gGameIdd: "+gGameIdd);
	console.log("gGameWinnedd: "+gGameWinnedd);
	var notFinishedGame=gGameIdd+1;
	Move.changeEffectiveByGameId(notFinishedGame);



	if (req.session.gamePlayed>=1 && req.session.gamePlayed<2){
		console.log("gGameIdd2.1: "+gGameIdd);
		
			
		
        return res.render('newGame',{
			skill_choice_c: "3",
			model_choice_c: "000010",
			skill_choice_u: "3",
			model_choice_u: "000010",
			gGameIdd: `${gGameIdd}`,
			gGameWinnedd: `${gGameWinnedd}`,
			gGameDrawedd: `${gGameDrawedd}`,
			gGameLostd: `${gGameLostd}`,
	});

	}else if (req.session.gamePlayed>=2 ){
    	console.log("gGameIdd2.2: "+gGameIdd);
    	
			
		
        return res.render('newGame',{
        	skill_choice_c: "3",
			model_choice_c: "000003",
			skill_choice_u: "3",
			model_choice_u: "000003",
			gGameIdd: `${gGameIdd}`,
			gGameWinnedd: `${gGameWinnedd}`,
			gGameDrawedd: `${gGameDrawedd}`,
			gGameLostd: `${gGameLostd}`,

		});
     }else{
     	console.log("gGameIdd2.3: "+gGameIdd);
        return res.render('newGame',{
        	gGameIdd: `${gGameIdd}`,
        	skill_choice_c: "3",
			model_choice_c: "000005",
			skill_choice_u: "3",
			model_choice_u: "000005", 
			gGameWinnedd: `${gGameWinnedd}`,
			gGameDrawedd: `${gGameDrawedd}`,
			gGameLostd: `${gGameLostd}`,
			
		});

     }
}




