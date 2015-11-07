var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var COLORS = ["#85FF00", "#00B8FF"]; // Available colors for the splashes. Must be same in frontend/script.js

var socket_count = 0 // only increased atm
var sockets = {} // socket.id -> socket
var colors = {} // socket -> splash color
var splashes = {} // socket -> list of splashes

/* {{{ Routes */
app.get('/', function(req, res){
  res.sendFile('frontend/index.html', {'root': '../'});
});
app.get("/script.js", function(req, res){
  res.sendFile('frontend/script.js', {'root': '../'});
});
app.get("/splat.js", function(req, res){
  res.sendFile('frontend/splat.js', {'root': '../'});
});
app.get("/beziersplat.js", function(req, res){
  res.sendFile('frontend/beziersplat.js', {'root': '../'});
});
app.get("/roundsplat.js", function(req, res){
  res.sendFile('frontend/roundsplat.js', {'root': '../'});
});
app.get("/cockroach.js", function(req, res){
  res.sendFile('frontend/cockroach.js', {'root': '../'});
});
app.get("/cockroach.png", function(req, res){
  res.sendFile('frontend/cockroach.png', {'root': '../'});
});
app.get("/share.js", function(req, res){
  res.sendFile('share.js', {'root': '../'});
});
/* }}} */

io.on('connection', function(socket){
  console.log('user connected');

  splashes[socket.id] = [];
  colors[socket.id] = COLORS[++socket_count % 2];
  sockets[socket.id] = socket;

  socket.on('disconnect', function(){
    console.log('user disconnected');
    delete splashes[socket.id];
  });

  if (Object.keys(splashes).length >= 2) {
    for (s in sockets) startGame(sockets[s], colors[s]);
  };
});

function startGame(socket, color){
  console.log("starting game");
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

  socket.emit('start', color);
}

http.listen(3000, function(){
  console.log('listening on *:3000');
});

