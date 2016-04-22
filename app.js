var express = require('express');
var path = require('path');
var port = process.env.PORT || 3000;
var app = express();

app.set('views', './views');
app.set('view engine', 'pug');
//app.use(express.bodyParser());
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'public')));
app.listen(port);

console.log('imooc started on port ' + port);

app.get('/', function (req, res) {
  res.render('index', {});
});