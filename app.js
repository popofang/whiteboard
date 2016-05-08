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

//bodyParser
app.use(bodyParser.json({
	limit: '1mb'
}));  //指定参数使用 json 格式
app.use(bodyParser.urlencoded({
  extended: true
})); 

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

app.post('/OCR', function(req, res) {
	var dataBuffer = new Buffer(req.body.dataURL, 'base64');
	
	fs.writeFile("ocr.png", dataBuffer, function(err) {
		if(err){
		  res.send(err);
		}else{
			tesseract.process(__dirname + '/ocr.png',function(error, text) {
				if(err) {
					res.send({
						status: 0,
						content: error
					});
				} else {
  					res.send({
  						status: 1,
						content: text
					});
				}
			});
		}
	});
});

//socket通讯
socketio.sockets.on('connection', function(socket) {
  	socket.on('draw', function(data) {
    	socket.broadcast.emit('draw', data);
  	});
});

