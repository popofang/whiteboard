var mongoose = require('mongoose');

var HistorySchema = new mongoose.Schema({
	seq: Number,
	dataURL: String
});

HistorySchema.statics = {
	findBySeq: function(seq, cb) {
		return this.findOne({seq: seq}).exec(cb);
	},
	deleteAll: function(seq, cb) {
		for(var i = 0; i <= seq; i++) {
			this.remove({seq: i}).exec(cb);
		}
	} 
}

module.exports = HistorySchema;