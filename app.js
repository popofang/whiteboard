var express = require('express');
var path = require('path');

var mongoose = require('mongoose');
var History = require('./models/history');

var port = process.env.PORT || 3000;
var app = express();

var http = require('http');
var server = http.createServer(app);
var socketio = require('socket.io').listen(server);

mongoose.connect('mongodb://localhost/whiteboard');

app.set('views', './views');
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'public')));
server.listen(port);

console.log('imooc started on port ' + port);

app.get('/', function(req, res) {
  	res.render('index', {
  		title: 'Web在线电子白板'
  	});
});

//OCR模块
var fs = require('fs');
var tesseract = require('node-tesseract');

//socket通讯
var nUsers = 0; //初始接入用户
var seq = -1; //当前记录序列号

socketio.sockets.on('connection', function(socket) {

	nUsers++;
	console.log('User Join:' + nUsers);

	//打开画板时的初始化
	if(seq !== -1) {
		History.findBySeq(seq, function(err, result) {
			if(err) {
				console.log(err);
			} else {
				console.log('data:' + result);
			}
			socket.emit('history', result);
		});
	}

	//同步画布
  	socket.on('draw', function(data) {
  		seq++;
  		console.log('seq:' + seq);
  		var history = new History({ 
  			seq: seq,
  			dataURL: data.dataURL 
  		});

  		history.save(function(err) {
  			if(err) {
  				console.log('同步失败:' + err);
  			} 
  		});

		socket.broadcast.emit('draw', {
			seq: seq,
			dataURL: data.dataURL,
			word: data.word
		});
  	});

  	//重现历史记录
  	socket.on('history', function(data) {
  		History.findBySeq(data, function(err, result) {
  			console.log(result);
  			socket.emit('history', result);
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
				tesseract.process(__dirname + '/ocr.png', options, function(error, text) {
					if(!error) {
						status = 1;
						texts.push(text);
					} else {
						texts.push("无法识别");
					}

					//中文识别
					var options = {
					    l: 'chi_sim',
					    psm: 6
					};
					tesseract.process(__dirname + '/ocr.png', options, function(error, text) {
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
  			seq = -1;
  			History.remove();
  		}
  	});
});
