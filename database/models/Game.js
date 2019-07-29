const mongoose = require('mongoose')

const GameSchema = new mongoose.Schema({

  // gUserId: {
  // 	type:mongoose.Schema.Types.ObjectId, 
  // 	ref: 'User',
  // 	required: true
  // },
  gUserId: String,
  gGameId: String,
  gOutcome : String, 
  totalTime: Number, 
  humanToAgentTrust: Number, 
  humanToHimselfTrust: Number,
  redModel:String, 
  redSkill:String,
  yellowModel:String,
  yellowSkill: String,
  dataStorageTimePoint: Date
})



module.exports = mongoose.model('Game', GameSchema)