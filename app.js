var express = require('express');
var path = require('path');
var port = process.env.PORT || 3000;
var bodyParser = require('body-parser');
var app = express();

var http = require('http');
var server = http.createServer(app);
var socketio = require('socket.io').listen(server);

app.set('views', './views');
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'public')));
server.listen(port);

console.log('imooc started on port ' + port);

app.get('/', function(req, res) {
  	res.render('index', {});
});

//OCR模块
var fs = require('fs');
var tesseract = require('node-tesseract');

//socket通讯
var nUsers = 0; //初始接入用户
var sCurrent = ''; //暂存当前画板内容
socketio.sockets.on('connection', function(socket) {

	nUsers++;

	//初始化
	socket.emit('init', sCurrent);

	//同步画布
  	socket.on('draw', function(data) {
  		sCurrent = data;
    	socket.broadcast.emit('draw', data);
  	});

  	//文字识别
  	socket.on('OCR', function(data) {
  		var dataBuffer = new Buffer(data, 'base64');
	
		fs.writeFile("ocr.png", dataBuffer, function(err) {
		var status = 0;
		if(err){
		  	socket.emit('OCR', {
		  		status: status,
		  		texts: err
		  	});
		}else{

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
					socket.emit('OCR', {
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
  		if(nUsers == 0) { //用户为空时，画板数据清空
  			sCurrent = '';
  		}
  	});
});





