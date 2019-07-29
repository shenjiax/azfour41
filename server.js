const express = require('express');
const expressEdge = require('express-edge');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const expressSession = require('express-session');
const connectMongo = require('connect-mongo');
const edge = require('edge.js');
const proxy = require('http-proxy-middleware');
const path = require('path');

var app = express();
mongoose.connect('mongodb://localhost/gamegamegame6', { useNewUrlParser: true }); 


const mongoStore = connectMongo(expressSession); 

app.use(expressSession({
	secret:'secret', 
	store: new mongoStore({
		mongooseConnection: mongoose.connection
	})
}))

const homePageController = require('./controllers/homePage');
const newGameController = require('./controllers/newGameController');
const storeMoveController = require('./controllers/storeMoveController');
const storeGameController = require('./controllers/storeGameController');
const consentFormController = require('./controllers/consentFormController');
const questionaireController = require('./controllers/questionaireController');
const storeQuestionaireController = require('./controllers/storeQuestionaireController');
// mongoose.connect("mongodb://localhost/az_four_master", { useNewUrlParser: true });

app.use(express.static('public'));
app.use(expressEdge);

app.set('views', `${__dirname}/views`);


app.use('*', (req, res, next)=>{
	edge.global('auth', req.session.userId && req.session.gamePlayed>=3)
	//edge.global('finished', req.session.finished="yes")
	next()
})


app.use('/api/000001', proxy({ target: 'http://localhost:9001', changeOrigin: true, ignorePath: true, logLevel: 'debug' }));
app.use('/api/000003', proxy({ target: 'http://localhost:9003', changeOrigin: true, ignorePath: true, logLevel: 'debug' }));
app.use('/api/000005', proxy({ target: 'http://localhost:9005', changeOrigin: true, ignorePath: true, logLevel: 'debug' }));
app.use('/api/000007', proxy({ target: 'http://localhost:9007', changeOrigin: true, ignorePath: true, logLevel: 'debug' }));
app.use('/api/000010', proxy({ target: 'http://localhost:9010', changeOrigin: true, ignorePath: true, logLevel: 'debug' }));
app.use('/api/000020', proxy({ target: 'http://localhost:9020', changeOrigin: true, ignorePath: true, logLevel: 'debug' }));
app.use('/api/000050', proxy({ target: 'http://localhost:9050', changeOrigin: true, ignorePath: true, logLevel: 'debug' }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "client/build")))

const auth = require("./middleware/auth");
const auth2 = require("./middleware/auth2");
const auth3 = require("./middleware/auth3");
const createUser = require("./middleware/createUser");
//const redirectIfAuthenticated = require("./middleware/redirectIfAuthenticated");

app.get('/',  homePageController);

app.get('/consentForm', auth, consentFormController);
app.post('/play/newGame', auth, createUser, newGameController);
app.get('/play/newGame', auth3, newGameController);

app.post('/play/newMove',  auth, storeMoveController);
app.post('/play/nextGame',  auth, storeGameController);
app.get('/questionaire', auth2, questionaireController);
app.post('/newQuestionaire', auth2, storeQuestionaireController);

app.use((req,res)=>res.render('not-found'));


app.listen(4000);
console.log("listening now on port 4000"); 




