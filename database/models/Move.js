const mongoose = require('mongoose')

const MoveSchema = new mongoose.Schema({

  // gUserId: {
  // 	type:mongoose.Schema.Types.ObjectId, 
  // 	ref: 'User',
  // 	required: true
  // },
  gUserId: String,
  gGameId: String,
  timeOfHumanChoice: Number, 
  timeOfSwitchSelection:Number, 
   humanChoice : Array, 
   yellowChoice : [String], 
  yellowValue : String, 
  optimumChoice : [String], 
  optimumValue : String, 
  selection:Number,
  redGeneration: String,
  redSetting:String,
   yellowGeneration: String,
    yellowSetting: String,
    dataStorageTimePoint: Date, 
    gStep: Number, 
    effective: {
    type :String, default:"yes"
  }
})

MoveSchema.statics.changeEffectiveByGameId = function(gGameId){
  console.log("gGameId: "+gGameId); 
  this.find({"gGameId" : gGameId}, function(err,results){
    if (err){
      console.log("err: "+err);
    }else{
      for(j = 0; j < results.length; j++) {
       results[j].effective="no"; 
        results[j].save();
       } 
    }     
  });
}


module.exports = mongoose.model('Move', MoveSchema)