var express = require('express');
var path = require('path');
var port = process.env.PORT || 3000;
var app = express();

var http = require('http');
var server = http.createServer(app);
var socketio = require('socket.io').listen(server);

app.set('views', './views');
app.set('view engine', 'pug');
//app.use(express.bodyParser());
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'public')));
server.listen(port);

console.log('imooc started on port ' + port);

app.get('/', function (req, res) {
  res.render('index', {});
});

socketio.sockets.on('connection', function(socket) {
  socket.on('draw', function (data) {
    socket.broadcast.emit('draw', data);
  });
});

var tesseract = require('node-tesseract');

// Recognize text of any language in any format
tesseract.process(__dirname + '/test.png',function(err, text) {
  if(err) {
      console.error(err);
  } else {
      console.log(text);
  }
});
