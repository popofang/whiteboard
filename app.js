var express = require('express');
var path = require('path');
var port = process.env.PORT || 3000;

var app = express();

var http = require('http');
var server = http.createServer(app);

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