var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var CANVAS_WIDTH = 800, CANVAS_HEIGHT = 550;
var COLORS = ["#85FF00", "#00B8FF"]; // Available colors for the splashes. Must be same in frontend/script.js
var roachPerPlayer = 50;
var roachDensity = 0.2;

var socket_count = 0 // only increased atm
var sockets = {} // socket.id -> socket
var colors = {} // socket -> splash color
var splashes = {} // socket -> list of splashes
var roaches = {} // counts the number of roaches per player created
var intervalid = {};

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
    clearInterval(intervalid);
  });

  if (Object.keys(splashes).length >= 2) {
    for (s in sockets) startGame(sockets[s], colors[s]);
  };
});

function startGame(socket, color){
  roaches = [0, 0]
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

  intervalid = setInterval(updateGame, 1000);

}

function updateGame() {
  // create roach pos & seed here
  roachCreated = Math.random () < roachDensity;
  if (Math.random() <= 0.5 && roaches[0] < roachPerPlayer) {
    oneOrTwo = 1;
    roaches[0] += 1;
  } else if (roaches[1] < roachPerPlayer) {
    oneOrTwo = 2;
    roaches[1] += 1;
  }

  if (roachCreated) {
    if(oneOrTwo == 1) {
      roachPos = [50, Math.random() * CANVAS_HEIGHT];
    } else {
      roachPos = [CANVAS_WIDTH - 50, Math.random() * CANVAS_HEIGHT];
    }

    roachSeed = Math.random() * 2*Math.pi;
  
    io.sockets.emit('roach', {pos : roachPos, seed : roachSeed, player : oneOrTwo});
  }

}



http.listen(3000, function(){
  console.log('listening on *:3000');
});

