var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var share = require('../share.js');

var splashes = {} // user -> list of splashes

/* {{{ Routes */
app.get('/', function(req, res){
  res.sendFile('frontend/index.html', {'root': '../'});
});
app.get("/script.js", function(req, res){
  res.sendFile('frontend/script.js', {'root': '../'});
});
app.get("/share.js", function(req, res){
  res.sendFile('share.js', {'root': '../'});
});
/* }}} */

io.on('connection', function(socket){
  console.log('user connected');

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  for (var c in splashes) {
    console.log(c, splashes[c]);
    for (var i in splashes[c]) {
      s = splashes[c][i];
      console.log(i, s);
      socket.emit('splash', s);
    }
  };

  socket.on('splash', function(msg){
    console.log(msg);
    splashes[socket.id] = (splashes[socket.id] || []).concat([msg]);
    io.sockets.emit('splash', msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

