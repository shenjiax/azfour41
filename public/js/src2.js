var ndarray = require('ndarray')
var graphpipe = require('graphpipe')
var axios = require('axios')

//two dimensional array indicating the status of the board
var gGameField = new Array();

//compute the total number of discs
var gDiscs;

//this is the table in the html where we need to place discs
var gBoard = document.getElementById("game-table");

//user's estimation distribution input over the seven columns
var gEstimation = document.getElementById("estimation");

//1 means current term is red
var gCurrentPlayer;

//the 1st disc's number is 1
var gId = 1;

//index 0 means red's model
var gModels = new Array();

//index 1 means red model's prediction is ready
var gPredReady = new Array();

//distribution of policy from the model before adjustment
var gPriors;

// Whether computer plays red/yellow.
var gCompPlays = [true, false];

//whether UI should be disbaled
var gDisableUI = false;

//how many complete games we have rendered now
var gGameId = 0;
var gGameWinned = 0; 
var gGameDrawed = 0; 
var gGameLost = 0; 

//indicate when the game begins
var gTimeStamp0;

//indicate when the user is shown the input estimation boxes
var gTimeStamp1; 

//indicate when the user click to submit the estimation input boxes
var gTimeStamp2;

//indicate when the user is shown the difference between his submission and his agent's prediction
var gTimeStamp3;

//indicate when the user made a choice over him/herself or his/her agent 
var gTimeStamp4;

//indicate when the game ends
var gTimeStamp5;

//the user's input estimation array 
var gEstimations;

var gOutcome; 

var gStep=0;

function newGame() {

  UIclear();
  UIreset();
  // console.log("pre gameId: "+gGameId);
  gGameId += 1
   // console.log("now gameId: "+gGameId);

  gStep=0;

  //clean up all the discs in the table
  gBoard.innerHTML = "";

  gDiscs = new Array();
  gPredReady = [false, false];

  //initailize every space 0
  prepareField();

  //current player's number is 1,index=0, computer red always makes the first move
  gCurrentPlayer = 1;

  gTimeStamp0=new Date();

  updatePredictions();
  addNewDisc(0);
}

var first; 
var second; 

$('input[type=radio][name=optradio]').click(function() {
       if (second==true){
        $('#newGame1').prop('disabled', false); 
       }else{
          first=true; 
       }   
  });

$('input[type=radio][name=yourselfRadio]').click(function() {
       if (first==true){
        $('#newGame1').prop('disabled', false); 
       }else{
          second=true; 
       }   
  });




$("#newGame1").click(function() { 
  //req.session.gamePlayed++;
  $("#message-modal").modal('hide');  //手动关闭
  first=false; 
  second=false; 

  var totalTime=(gTimeStamp5.getTime() - gTimeStamp0.getTime())/1000; 

   sendGameData().then(function(response){
      // gOutcome=null; 
      // totalTime=null;
      // humanTrust=null;
      // gTimeStamp0=null;
      // gTimeStamp5=null;
      if(response.status==200){
          
         

            if(response.headers.stage2=="true" && !response.headers.gamefinished){
              console.log("stage2 begins");
               gModels[0] = "000010";
                gModels[1] = "000010";
            }

            if(response.headers.stage3=="true" && !response.headers.gamefinished){
              console.log("stage3 begins");
               gModels[0] = "000003";
                gModels[1] = "000003";
            }

            if(response.headers.gamefinished=="true"){
              console.log("user finished!");
              $('#message-modal2').modal('show');
              return; 
            }

            console.log("sendGameData success! "+JSON.stringify(response));
            $("input[name=optradio]").prop("checked",false);
            $("input[name=yourselfRadio]").prop("checked",false);
            $('#newGame1').prop('disabled', true); 
            newGame();
      }
    

    }).catch(function (error){
                console.log("sendGameData error "+error);
              });
});








//fetch the data from remote
function loadRemote(model, b) {
    var id = gGameId;
    //two parts, each has 6*7
    var arr = new Float32Array(2 * 6 * 7);
    for (var i=0; i<2*6*7; i++) {
      arr[i] = b[i];
    }
    //construct 1 part, 2 groups, both have 6 rows and 7 cols
    var nda = ndarray(arr, [1, 2, 6, 7]);
    //fetch data from remote server
    var req = graphpipe.remote("/api/" + model + "/", nda, "", "", "");
    return req
}

function computerToPlay() {
  return gCompPlays[gCurrentPlayer-1];
}


function now() {
  var d = new Date()
  var n = d.getTime()
  return n
}

var gLastPlay = now()

function loop() {
  if (now() - gLastPlay < 1500) {
    return
  }
  if (computerToPlay()) {
    if (gPredReady[gCurrentPlayer]) {
      var disc = gDiscs[gDiscs.length - 1];
      playBestMove(disc);
      gLastPlay = now();
    }
  }
}


setInterval(loop, 500);

/*
function computerMaybePlay() {
  if (computerToPlay()) {
    disc = gDiscs[gDiscs.length - 1];
    if (gPredReady[gCurrentPlayer]) {
      setTimeout(function() {
        playBestMove(disc);
      }, 1250);
    } else {
      var player = gCurrentPlayer;
      document.addEventListener("predReady", function(e) {
        if (e.detail.player == player) {
          playBestMove(disc);
        }
      }, {once: true});
    }
  }
}
*/
//skill mapping, the bar's range is from 1->7
function applyT(T, priors) {
  T = Math.floor(T);
  //every value represents a skill level
  if (T == 1) {
    T = 1;
  } else if (T == 2) {
    T = 0.8;
  } else if (T == 3) {
    T = 0.66;
  } else if (T == 4) {
    T = 0.5;
  } else if (T == 5) {
    T = 0.25;
  } else if (T == 6) {
    T = 0.1;
  } else if (T == 7) {
    T = 0.01;
  }
  var adjustedPriors = [];
  var adjustedTotal = 0;
  for (var i = 0; i < 7; i++) {
    //base is priors(from trained data), priors[i]^(1/T)
    adjustedPriors[i] = priors[i] ** (1/T);
    // compute the total 
    adjustedTotal += adjustedPriors[i];
  }
  for (var i = 0; i < 7; i++) {
    adjustedPriors[i] /= adjustedTotal;
  }
  return adjustedPriors;
}

function argmax(array) {
  var max = -1;
  var maxIdx = 0;
  for (i = 0; i < array.length; i++) {
    if (possibleColumns().indexOf(i) != -1) {
      if (array[i] > max) {
        max = array[i];
        maxIdx = i;
      }
    }
  }
  return maxIdx;
}

function weightedChoice(array) {
  array = array.slice();
  var total = 0.0;
  //delete the value from column that is full
  for (var i = 0; i < array.length; i++) {
    if (possibleColumns().indexOf(i) == -1) {
      array[i] = 0;
    }
    total += array[i]; 
  }
  //recalculate the ratio
  for (var i = 0; i < array.length; i++) {
    array[i] /= total; 
  }
  var r = Math.random();
  var cur = 0.0;
  //not everytime we choose the largest one
  for (var i = 0; i < array.length; i++) {
    cur += array[i];
    if (r <= cur) {
      return i;
    }
  }
  alert('oh no');
}
function getSkillValue(player){
  var T = 1;
  if (player==1) {
    T = document.getElementById('Skill1').value;
  } else {
    T = document.getElementById('Skill2').value;
  }
  return T;
}

function playBestMove(disc) {
  var T = getSkillValue(disc.player);
 var adjustedPriors = applyT(T, gPriors);
 
  var col = weightedChoice(adjustedPriors);
  dropDisc(disc, col);
}

//the most important column
//this is a function that model will make a prediction based on the status of board sent to it
function updatePredictions() {

  //get current player's model
  var model = gModels[gCurrentPlayer - 1];
  if (model == null) {
    return;
  }

//1st part is the current player
//2nd part is the other player
//this is an one-array array that will be sent to the model
  var b = [
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,

    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
  ]

  //get all the discs, x contains all the discs
  var x = document.getElementsByClassName("disc");

  //current player's index
  var p = gCurrentPlayer - 1;

  //1 red, 2 yellow
  var current = p == 0 ? 1 : 2;
  var other = p == 0 ? 2 : 1;

  //when other people wanna just reshow the situations you have
  //6 rows
  for (var r = 0; r < gGameField.length; r++) {
   //7 columns 
    for (var c = 0; c < gGameField[0].length; c++) {
      if (gGameField[r][c] == current) {
        //set 1 to represent this place has already been occupied
        b[r * 7 + c] = 1;
      } else if (gGameField[r][c] == other) {
        b[r * 7 + c + 42] = 1;
      }
    };
  };

  //at present, we cannot do anything on the screen, because we're going to send data to models
  gDisableUI = true;

  console.log(current+"(1 red, 2 yellow) begins sending data of the current status on board to model--------->");

  loadRemote(model, b).then(function (response) {
    
    console.log("policy distribution and value received from model for player: "+current+" (1 red, 2 yellow)");

    var rslt = response.data;

    gPriors = rslt[0].data

    console.log(current+"(1 red, 2 yellow)'s gPriors: "+gPriors);

    value = rslt[1].data[0];
    console.log(current+"(1 red, 2 yellow)'s value: "+value);

    

    //traslate the "value" to a String
    percentage = Math.floor(Math.abs(value) * 100) + "%";

    message="looks like a draw";

    //red thinks yellow's winning percentage 
    ////yellow thinks red's winning percentage
    if (value < -0.05 || value > 0.05) {
      color = "red";
      //if red, value<-0.05 || if yellow,value>0.05
      if ((p == 0 && value < -0.05) || (p == 1 && value > 0.05)) {
        color = "yellow";
      }
      message = "I am " + percentage + " confident " + color + " will win";
    }

    if (p == 0) {
      // message = "Red <small>(" + $('#ModelSelect1 option:selected').text() + ")</small> thinks:<br/> " + message;
      message = "Red thinks "+message;
    } else {
      message = "Yellow thinks "+message;
      // message = "Yellow <small>(" + $('#ModelSelect2 option:selected').text() + ")</small> thinks:<br/> " + message;
    }

    gPredReady[p+1] = true;
    if(computerToPlay()){
      gDisableUI = false;
    }else{
      var optimumModel = "000050";
      return loadRemote(optimumModel, b);
    }
    
  }).then(function (response) {

    console.log("policy distribution and value received from OPTIMUM MODEL for player: "+current+" (1 red, 2 yellow)");

    oRslt = response.data;
    
    optimumPriors = oRslt[0].data;

    console.log(current+"(1 red, 2 yellow)'s optimumPriors: "+optimumPriors);

    optimumValue = oRslt[1].data[0];
    console.log(current+"(1 red, 2 yellow)'s optimumValue: "+optimumValue);

    //the total win percentage
    optimumPercentage = Math.floor(Math.abs(optimumValue) * 100) + "%";
    optimumMessage="looks like a draw";
    //red thinks yellow's winning percentage 
    ////yellow thinks red's winning percentage
    if (optimumValue < -0.05 || optimumValue > 0.05) {
      color = "red";
      //if red, value<-0.05 || if yellow,value>0.05
      if ((p == 0 && optimumValue < -0.05) || (p == 1 && optimumValue > 0.05)) {
        color = "yellow";
      }
      optimumMessage = "I am " + optimumPercentage + " confident " + color + " will win";
    }

    if (p == 0) {
      optimumMessage = `Red thinks `+optimumMessage;
    } else {
      optimumMessage = `Yellow thinks `+optimumMessage;
    }
    optimumAdjustedPriors = applyT(7, optimumPriors);
    for(let i = 0; i<7; i++){
      optimumAdjustedPriors[i] = Math.round(optimumAdjustedPriors[i] * 100);
    }
    console.log(current+"(1 red, 2 yellow)'s optimumAdjustedPriors: "+optimumAdjustedPriors);

    //since data from model is back, UI can be active again now
    gDisableUI = false;

  }).catch(function (error) {
    console.log(current+"(1 red, 2 yellow)'s prdiction set processing from OPTIMUM MODEL is not ready. Error is: "+error);
    if (error.toString() == "Cancel") {
      return;
    }
  });
}



//when the page is loaded, this function will be called immediately, i.e entry point
window.onload = function() {//when we first load this page
  //jQuery http://api.jquery.com/prop/
  //check whether they are all autoplay
  //obtain the Generation Value 

  //when refresh, gGameId and gGameWinned, gGameDrawed, gGameLost are re-populated
  //preventing any un-committed data messing up database
  gModels[0] = document.getElementById("ModelSelect1").value;
  gModels[1] = document.getElementById("ModelSelect2").value;
  console.log("onload: "+document.getElementById("gGameIdd").value)
  gGameId=parseInt(document.getElementById("gGameIdd").value);
   console.log("onload:  gGameWinned original: "+gGameWinned);
   console.log("onload:  gGameWinned zhijiena: "+document.getElementById("gGameWinnedd").value);
  gGameWinned=parseInt(document.getElementById("gGameWinnedd").value);
  console.log("onload: after populated: "+gGameWinned);

  gGameDrawed=parseInt(document.getElementById("gGameDrawedd").value);
  console.log("onload: "+gGameDrawed);
  gGameLost=parseInt(document.getElementById("gGameLostd").value);
   console.log("onload: "+gGameLost);
  console.log("onload: "+gGameIdd);
   console.log("onload: "+typeof gGameIdd);
  newGame();
  
  $('#message-modal2').on('hidden.bs.modal', function (e) {
  window.setTimeout(function() {
    $(location).attr('href', '/questionaire');
  }, 100);
})

};



function checkForTie() {
  return possibleColumns().length == 0;
}

function checkForVictory(row, col) {
  if ((getAdj(row, col, 0, 1) + getAdj(row, col, 0, -1) > 2) ||
      (getAdj(row, col, 1, 0) > 2) ||
      (getAdj(row, col, -1, 1) + getAdj(row, col, 1, -1) > 2) ||
      (getAdj(row, col, 1, 1) + getAdj(row, col, -1, -1) > 2)) {
    return true;
  }
}

function getAdj(row, col, row_inc, col_inc) {
  if (cellVal(row, col) == cellVal(row + row_inc, col + col_inc)) {
    return 1 + getAdj(row + row_inc, col + col_inc, row_inc, col_inc);
  } else {
    return 0;
  }
}

function cellVal(row, col) {
  if (gGameField[row] == undefined || gGameField[row][col] == undefined) {
    return -1;
  } else {
    return gGameField[row][col];
  }
}

function firstFreeRow(col) {
  var i;
  for (i = 0; i < 6; i++) {
    if (gGameField[i][col] != 0) {
      break;
    }
  }
  return i - 1;
}

function possibleColumns() {
  var moves_array = new Array();
  //we have 7 cols
  for (var i = 0; i < 7; i++) {
    //if the 0th row's col is 0
    if (gGameField[0][i] == 0) {
      //push 0,1,2,3,4,5,6
      moves_array.push(i);
    }
  }
  return moves_array;
}

var isSafari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);

var hSize = 91.4;
var vSize = 77.75;
var hOff = 10.75;
var vOff = 7;

if (isSafari) {
    vOff = 8.25;
    vSize = 77.8;
}

var maxScale = 0.75;
var scale = 0.75;

function doResize() {
  var w = $(window).width();
  if (w < 768) {
    scale = (w/692);
  } else {
    scale = maxScale;
  }
  $("#game-outer").attr("style", "transform: scale(" + scale + "); transform-origin: 0 0;");
  $("#leftcol").attr("style", "height: " + 600 * scale + "px; padding-top:" + 30 * (scale**3) + "px;");
}


window.addEventListener("resize", function() {
  window.setTimeout(doResize, 100);
});

doResize()

//这是用来创建对象的函数
//Creation function for a new disc
//when drop a new disc
function Disc(player, col) {

  console.log("Begin to create a new disc--------->");
  
  this.player = player;

  //assign color
  this.color = player == 1 ? 'red' : 'yellow';
  //assign disc id
  this.id = 'd' + gId.toString();
  //initial row is 0
  this.row = 0;
  //initial column is the column that has been passed in
  this.col = col;
  //the disc has not been dropped yet
  this.dropped = false;
  //the next disc's number

  console.log("disc creation and initialization finished, newly created disc:  "+JSON.stringify(this));
  
  gId++;

//create a place to put this new disc
//this is a function that adds this disc created to the html in tags
  this.addToScene = function() {
    console.log("newly created disc being added to scene---->");
  
    var disc = document.createElement("div");
    //create id
    disc.id = this.id
    //create the class name
    disc.className = "disc " + this.color;
    //append this new child to the gBoard ->id = gametable
    gBoard.appendChild(disc)
    //set the place where the disc is
    //hsize=91.4px the game-table is 640/7 = 91.4px, every col is 91.4px 
    //hOff=10.75px the original left
    document.getElementById($this.id).style.left = (hOff + hSize * this.col) + "px";
    //75px from the top (gameboard)
    document.getElementById($this.id).style.top = "-75px";
    console.log("newly created disc, disc id: "+this.id+", added to scene.");
  }

  //this is a finction that moves the disc to a specific column 
  this.moveToColumn = function(col) {
    
    $this.col = col;
    document.getElementById($this.id).style.left = (hOff + hSize * col) + "px";
    document.getElementById($this.id).style.top = "-75px";
    console.log("newly created disc, disc id: "+this.id+", moved to column: "+col);

  }

  var $this = this;

  this.drop = function(col) {
     console.log("newly created disc, disc id: "+this.id+", begins dropping process------>");
    //if there're data now sending to models, return,the disc can not drop
    if (gDisableUI) {
      return;
    }
    //if it is computer playing, just return
    //it has its own way of dropping
    if (gCompPlays[$this.player - 1]) {
      return;
    }

    //check whether this column is available for dropping the disc
    if (possibleColumns().indexOf($this.col) != -1) {
      dropDisc($this,$this.col);
    }else{
      alert("The Col is full");
    }
  }
}




function getRow(y) {
  y = y - $('#game-table').offset().top + vSize;
  return Math.floor(y/vSize);
}

function getCol(x) {
  x = x - $('#game-table').offset().left;
  x = x/scale;
  return Math.floor(x/(hSize+1));
}


//this is the function that finally drops the disc
function dropDisc(disc, col) {

  if (disc.dropped) {
    return;
  }

  console.log(disc.id +" begins to drop physically------------------->")
  disc.dropped = true;
  disc.moveToColumn(col);
  // obtain that col's 1st hole 
  var row = firstFreeRow(disc.col);
  disc.row = row;
  gGameField[row][disc.col] = disc.player;

  //current prediction set is no more usable, waiting to be injected for the next round
  gPredReady[gCurrentPlayer] = false;

  // animateDiscDrop put the disc to the right place
  var element = animateDiscDrop(disc.id, (vOff + row * vSize));

  element.addEventListener("transitionend", function(e) {
  // transitionend fires twice (for horizontal and vertical motion) if
  // the disc hasn't caught up with the mouse's column.
    if (e.propertyName == 'top') {
      if (checkForVictory(disc.row, disc.col)) {
        var color = disc.player == 2 ? 'Yellow' : 'Red';
        gTimeStamp5=new Date();
        gOutcome=color;
        if (gOutcome=="Red"){
          gGameLost++;
        }else{
          gGameWinned++;
        }
        $("#modal-title-text").html(color + " wins! This is your game "+gGameId+ " You have won "
          +gGameWinned+" , You have drawed "+ gGameDrawed+" , You have lost "+gGameLost);

        $('#message-modal').modal('show');

         $('#newGame').prop('disabled', true); 
    
        window.scrollTo(0, 0);
    
      } else if (checkForTie()) {
        gTimeStamp5=new Date();
        gOutcome="tie"; 
        gGameDrawed++;
        $("#modal-title-text").html("It's a tie! This is your game "+gGameId+ " You have won "
          +gGameWinned+" , You have drawed "+ gGameDrawed+" , You have lost "+gGameLost);

        $('#message-modal').modal('show');
    
        window.scrollTo(0, 0);
    
      } else {
        changePlayer(); 
        updatePredictions();

      //if it is human's turn
        if(!computerToPlay()){
        //pop up table, bar and button to let user choose  
        console.log("It is now the human's turn. ")
        document.getElementById("estimation").style.display="";
        document.getElementById("estBtn").style.display="";
        document.getElementById("estSelectBtn").style.display="none";
        document.getElementById("rangebarContainer").style.display="";

        for(var i=0;i<7;i++){
          document.getElementById("e"+i).value = 0;
          document.getElementById("confidence"+i).value = 0;

           //document.getElementById('e' + i).readonly=false;
          document.getElementById('e' + i).disabled=false;

          if (possibleColumns().indexOf(i) == -1){
              console.log(i+" column is full");
              document.getElementById('e' + i).value="FULL";
              document.getElementById('e' + i).disabled = true;
              document.getElementById("confidence"+i).value = 0;
              document.getElementById("confidence"+i).disabled = true;
            }
          }

        //this when user is shown the estimation input boxes
        gTimeStamp1 = new Date();
      
        estBtn = document.getElementById("estBtn");
        
        estBtn.onclick = function(){
          console.log("Human has submitted the estimation input boxes by clicking submit. ")

          //this is when user clicks the submit button
          gTimeStamp2 = new Date();
                
          //obtain the input values
          gEstimations=inputEstimation();

          if(gEstimations!==undefined){
            //hide human input value, select btn & bar
            console.log("human input estimation input boxes has been verified.")
            document.getElementById("estimation").style.display="none";
            document.getElementById("rangebarContainer").style.display="none";
            var T = getSkillValue(gCurrentPlayer-1);
            adjustedPriors = applyT(T, gPriors);

            adj_max = getAdjMax(adjustedPriors);
            est_max = getEstMax(gEstimations);

            est_max_index = est_max[1];
            adj_max_index = adj_max[1];

            for (var i = 0; i < 7; i++) {
              adjustedPriors[i] = Math.round(adjustedPriors[i] * 100);
            }

            //THE biggest values are different
            if(est_max_index!==adj_max_index){
              //show machine scores & select btn & result
              console.log("System detects a difference between user's input estimation boxes max and agent model's prediction max.")
              document.getElementById("scores").style.display="";
              document.getElementById("result").style.display="";
              document.getElementById("estimation").style.display="";
              // document.getElementById("estimation").style.disabled=true;
              document.getElementById("estBtn").style.display="none";
              document.getElementById("estSelectBtn").style.display="";

              gTimeStamp3=new Date();

              for (var i = 0; i < 7; i++) {//compute every col's win's percentage
                document.getElementById('s' + i).textContent = "0";
                document.getElementById('s' + i).style="color:#fff";
                //stress the biggest one probability
                document.getElementById('s'+ adj_max_index).style="background-color:green";
                document.getElementById('s'+ adj_max_index).textContent="X";
                document.getElementById('e'+ est_max_index).style="background-color:green";
                //var eId = 'e'+i;
                //show human estimation value
                
                document.getElementById('e' + i).value = gEstimations[i]+ "%";

                //document.getElementById('s' + i).readonly=true;
                document.getElementById('s' + i).disabled=true; 
                //document.getElementById('e' + i).readonly=true;
                document.getElementById('e' + i).disabled=true; 
                //$('#eId').attr("readonly",true); 
              }
              
              document.getElementById("result").innerHTML = message;

            }else{ 
            gStep+=1; 
           sendData(-1).then(function(response){
                //gPriors = null;
                message = "";
                // gTimeStamp2=null;
                // gTimeStamp1=null;
                addNewDisc(est_max_index);

              })
              .catch(function (error){
                console.log("sendData(-1) error "+error);
              });
             
              }
          }else{
          console.log("user input estimation boxes can't pass the verification. ")
          return; 
          }
        }

      }else{
          //if it is computer playing
        addNewDisc(0);
        gPriors = null;
        message = "";
      }
      }
  }
});//the end of the transitionend fuction
}//the end of the drop disc function

  

function sendData(selection){
  console.log("senddata in");
   var timeOfHumanChoice = (gTimeStamp2.getTime() - gTimeStamp1.getTime())/1000; //总毫秒数
   //var secondsold = Math.floor(timeold / 1000);          //总秒数
   var timeOfSwitchSelection=0; 
   if (selection!==-1){
       timeOfSwitchSelection = (gTimeStamp4.getTime() - gTimeStamp3.getTime())/1000; 
   }
   console.log("sending ajax...")
   return axios.post('/play/newMove',{
                gGameId: gGameId,
                timeOfHumanChoice : timeOfHumanChoice,
                timeOfSwitchSelection, 
                humanChoice : gEstimations,
                yellowChoice:adjustedPriors, 
                yellowValue: message,
                optimumChoice: optimumAdjustedPriors,
                optimumValue: optimumMessage,
                selection: selection,
                redGeneration: gModels[0],
                redSetting: document.getElementById('Skill1').value,
                yellowGeneration: gModels[1],
                yellowSetting: document.getElementById('Skill2').value, 
                gStep: gStep
  });
}


function sendGameData(){
  console.log("sendGameData in");
   var totalTime=(gTimeStamp5.getTime() - gTimeStamp0.getTime())/1000; 

   console.log("sending game ajax...")

   return axios.post('/play/nextGame',{
       gGameId: gGameId,
       gOutcome : gOutcome, 
       totalTime: totalTime, 
       humanToAgentTrust: $('input[name="optradio"]:checked').val(), 
       humanToHimselfTrust: $('input[name="yourselfRadio"]:checked').val(),
       redModel:gModels[0], 
       redSkill:document.getElementById('Skill1').value,
       yellowModel:gModels[1],
       yellowSkill: document.getElementById('Skill2').value,
  });
}





$("#scoSelectBtn").click(function(){
  gTimeStamp4=new Date();
  console.log("I'm in scoSelectBtn!");
  gStep+=1; 
  sendData(0).then(function (response){
    addNewDisc(adj_max_index);
  })
  .catch(function (error){
    console.log("sendData(0) error "+error);
  });
  //addNewDisc(adj_max_index);
  document.getElementById('e'+ est_max_index).style="background-color:transparent";
  document.getElementById('s'+ adj_max_index).style="background-color:transparent";
  // //hide machine scores, scoSelectBtn,results
  // document.getElementById("scores").style.display="none";
  // document.getElementById("result").style.display="none";
  // //hide estimation
  // document.getElementById("estimation").style.display="none";

  UIclear();
  //gPriors = null;
  message = "";
// gTimeStamp4=null;
// gTimeStamp2=null;
// gTimeStamp1=null;
// gTimeStamp3=null;
});

$("#estSelectBtn").click(function(){
  gTimeStamp4=new Date();
  console.log("I'm in estSelectBtn!"); 
  gStep+=1; 
  sendData(1).then(function(response){
     addNewDisc(est_max_index);
  })
  .catch(function (error){
    console.log("sendData(1) error "+error);
  });
 //addNewDisc(est_max_index);
  document.getElementById('e'+ est_max_index).style="background-color:transparent";
  document.getElementById('s'+ adj_max_index).style="background-color:transparent";
  UIclear();
  //hide machine scores, scoSelectBtn,results
  // document.getElementById("scores").style.display="none";
  // document.getElementById("result").style.display="none";
  // //hide estimation
  // document.getElementById("estimation").style.display="none";

 // gPriors = null;
  message = "";

  // gTimeStamp4=null;
  // gTimeStamp2=null;
  // gTimeStamp1=null;
  // gTimeStamp3=null;
});

function getAdjMax(adjustedPriors){
  var adj_max = new Array(adjustedPriors[0],0);
  for(var i=1;i<7;i++){
      if(adjustedPriors[i]>adj_max[0]){
        adj_max[0]=adjustedPriors[i];
        adj_max[1]=i;
      }
    }
    return adj_max;
}

function getEstMax(estimations){
  var est_max = new Array(estimations[0],0);
    for(var i=1;i<7;i++){
      if(estimations[i]>est_max[0]){
        est_max[0]=estimations[i];
        est_max[1]=i;
      }
    }
    return est_max;
}

function inputEstimation(){
  var sum = 0;
  var estimations = new Array();
  // var isBadInput = new Boolean(false);
  for (var i = 0; i < 7; i++) {
    var num = document.getElementById('e' + i).value.trim();

    if(parseInt(num)>=0 && !isNaN(parseInt(num)) 
      && possibleColumns().indexOf(i) != -1){

        estimations.push(parseInt(num));
        sum+=parseInt(num);

    }else {
        estimations.push(parseInt(0));
    }
    //else{
    //   alert("please input a number at column "+(i+1));
    //   return;
    // }

  }

    var max = estimations[0];
    var maxIndex = 0;

    for (var i = 1; i < estimations.length; i++) {
        if (estimations[i] > max) {
            maxIndex = i;
            max = estimations[i];
        }
    }


    if (sum===100){
      for (var i = 1; i < estimations.length; i++) {
        if (i==maxIndex) continue; 

        if (estimations[i] == estimations[maxIndex]) {
          alert('two max values'); 
          return;
        }
    }
      return estimations;
    }else{
      alert('not equal to 100'); 
      return;
    }
}

function changePlayer() {
  gCurrentPlayer = 3 - gCurrentPlayer;
  console.log("play has been switches.")
}


//this is the function that adds a brand new disc into the html and will let it go to where it should be
function addNewDisc(col) {
  console.log("addNewDisc function working now, adding new disc to column: "+col);
  var disc = new Disc(gCurrentPlayer, col);
  disc.addToScene();
//automatically drop
  // disc.drop();
  //   gDiscs.push(disc);

  setTimeout(()=>{
    disc.drop();
    gDiscs.push(disc);
    // return disc;
  },100);
}

function prepareField() {
  gGameField = new Array();
  for (var i = 0; i < 6; i++) {
    // 6 rows
    gGameField[i] = new Array();
    for (var j = 0; j < 7; j++) {
      //7 columns
      gGameField[i].push(0);
    }
  }
}

function animateDiscDrop(who, where) {

  console.log(who +" is now animately dropping");

  var element = document.getElementById(who);
  // Run async to allow page to render. Otherwise it's possible that the disc
  // creation and position update happen in the same JS cycle, preventing the
  // transition from firing.
  setTimeout(function(element) {
    element.style.top = where + 'px';
  }, 0, element);
  //the element withbthe right position now will be returned
  return element;
}






//this is a funvtion that hides all machine distrubution, user input boxes...etc
function UIclear(){
  //hide machine scores, scoSelectBtn,results
  document.getElementById("scores").style.display="none";
  document.getElementById("result").style.display="none";
  //hide estimation
  document.getElementById("estimation").style.display="none";
  document.getElementById("rangebarContainer").style.display="none";
}



//this is a function that sets all user input boxes to original status waiting to be input again
function UIreset(){
  for (let i = 0; i < 7; i++) {
    document.getElementById('e' + i).value=0;
    document.getElementById('e' + i).disabled = false;
    document.getElementById("confidence"+i).value = 0;
    document.getElementById("confidence"+i).disabled = false;
  }
}

document.onkeydown=EventOper;

function EventOper(){
  if(event.keyCode==17){
    event.keyCode=0;
    event.returnValue=false;
  }
  if(event.keyCode==91){
    event.keyCode=0;
    event.returnValue=false;
  }
  if(event.keyCode==187){
    event.keyCode=0;
    event.returnValue=false;
  }
  if(event.keyCode==189){
    event.keyCode=0;
    event.returnValue=false;
  }
  if(event.ctrlKey){    
    event.returnValue=false;
  }
}










