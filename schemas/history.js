var mongoose = require('mongoose');

var HistorySchema = new mongoose.Schema({
	seq: Number,
	dataURL: String
});

HistorySchema.statics = {
	findBySeq: function(seq, cb) {
		return this.findOne({seq: seq});
		exec(cb);
	}
}

module.exports = HistorySchema;