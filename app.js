var express = require('express');
var path = require('path');
var port = process.env.PORT || 8080;
//var port = 5050;
var app = express();

var http = require('http');
var server = http.createServer(app);

var SkyRTC = require('skyrtc').listen(server);

app.set('views', './views');
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));
server.listen(port);

console.log('imooc started on port ' + port);

app.get('/', function(req, res) {
  	res.render('index', {
  		title: 'Web在线电子白板'
  	});
});

//socket
var Sockets = require('./controllers/socket');
var socketio = require('socket.io').listen(server);

socketio.sockets.on('connection', Sockets.socket);




SkyRTC.rtc.on('new_connect', function(socket) {
	console.log('创建新连接');

});

SkyRTC.rtc.on('remove_peer', function(socketId) {
	console.log(socketId + "用户离开");
});

SkyRTC.rtc.on('new_peer', function(socket, room) {
	console.log("新用户" + socket.id + "加入房间" + room);
});

SkyRTC.rtc.on('socket_message', function(socket, msg) {
	console.log("接收到来自" + socket.id + "的新消息：" + msg);
});

SkyRTC.rtc.on('ice_candidate', function(socket, ice_candidate) {
	console.log("接收到来自" + socket.id + "的ICE Candidate");
});

SkyRTC.rtc.on('offer', function(socket, offer) {
	console.log("接收到来自" + socket.id + "的Offer");
});

SkyRTC.rtc.on('answer', function(socket, answer) {
	console.log("接收到来自" + socket.id + "的Answer");
});

SkyRTC.rtc.on('error', function(error) {
	console.log("发生错误：" + error.message);
});
