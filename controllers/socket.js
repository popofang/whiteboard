var fs = require('fs');
var tesseract = require('node-tesseract');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/whiteboard');
var History = require('../models/history');

var nUsers = 0; //初始接入用户
var seq = -1; //当前记录序列号

//确定图片目录
var dir = __dirname.split('/');
var dirname = '';
for (var i = 0; i < dir.length - 1; i++) {
	dirname += dir[i] + '/';
}
dirname += 'ocr.png';

exports.socket = function(socket) {

	nUsers++;
	console.log('User Join:' + nUsers);

	//打开画板时的用户人数初始化
	if(nUsers !== 1) {
		socket.broadcast.emit('user', nUsers);
		socket.emit('user', nUsers);
	}

	//打开画板时的画布初始化
	if(seq !== -1) {
		History.findBySeq(seq, function(err, result) {
			if(err) {
				console.log(err);
			} else {
				socket.emit('init', result);
			}
		});
	}

	//同步画布
  	socket.on('draw', function(data) {
  		seq++;
  		console.log('seq:' + seq);
  		var history = new History({ 
  			seq: seq,
  			dataURL: data.dataURL,
  		});

  		history.save(function(err) {
  			if(err) {
  				console.log('数据添加失败:' + err);
  			}
  		});

		socket.broadcast.emit('draw', {
			seq: seq,
			dataURL: data.dataURL,
			word: data.word
		});

		socket.emit('seqSync', seq);
  	});

  	socket.on('reset', function() {
  		socket.broadcast.emit('reset');
  	});

  	//重现历史记录
  	socket.on('history', function(data) {
  		History.findBySeq(data, function(err, result) {
  			if(err) {
  				console.log('读取数据出错:' + err);
  			} else {
  				socket.emit('history', result);
  			}
  		});
  	});

  	//文字识别
  	socket.on('OCR', function(data) {
  		var dataBuffer = new Buffer(data, 'base64');
	
		fs.writeFile("ocr.png", dataBuffer, function(err) {
			var status = 0;
			if(err){
				//自己接收
				socket.emit('OCR', {
					status: status,
			  		texts: err
				});

				//其他用户接收
			  	socket.broadcast.emit('OCR', {
			  		status: status,
			  		texts: err
			  	});
			} else{

				var texts = new Array();

				//英文识别
				var options = {
				    l: 'eng',
				    psm: 6
				};

				tesseract.process(dirname, options, function(error, text) {
					if(!error) {
						status = 1;
						texts.push(text);
					} else {
						console.log(error);
						texts.push("无法识别");
					}

					//中文识别
					var options = {
					    l: 'chi_sim',
					    psm: 6
					};

					tesseract.process(dirname, options, function(error, text) {
						if(!error) {
							status = 1;
							texts.push(text);
						} else {
							texts.push("无法识别");
						}
						//自己接收
						socket.emit('OCR', {
					  		status: status,
					  		texts: texts
					  	});

						//其他用户接收
						socket.broadcast.emit('OCR', {
					  		status: status,
					  		texts: texts
					  	});
					});
				});
			}
		});
	});

	//断开连接
  	socket.on('disconnect', function() {
  		nUsers--;
  		console.log('User Exit:' + nUsers);
  		if(nUsers == 0) { //用户为空时，画板数据清空
  			console.log('No User, over');
  			History.deleteAll(seq, function(err) {
  				if(err) {
  					console.log('删除数据出错:' + err);
  				} else {
  					console.log('删除成功');
  				}
  			});
  			seq = -1;
  		} else {
  			socket.broadcast.emit('user', nUsers);
  			socket.emit('user', nUsers);
  		}
  	});
};