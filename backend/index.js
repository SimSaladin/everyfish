var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var CANVAS_WIDTH = 800, CANVAS_HEIGHT = 550;
var COLORS = ["#85FF00", "#00B8FF"]; // Available colors for the splashes. Must be same in frontend/script.js
var roachPerPlayer = 5;
var roachDensity = 0.2;

var socket_count = 0 // only increased atm
var sockets = {} // socket.id -> socket
var colors = {} // socket -> splash color
var splashes = {} // socket -> list of splashes
var roachesPerPlayer = {} // counts the number of roaches per player created
var roaches = {}
var intervalid = {};
var curUnic = {};

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
app.get("/fist.cur", function(req, res){
  res.sendFile('frontend/fist.cur', {'root': '../'});
});
app.get("/fist.jpg", function(req, res){
  res.sendFile('frontend/fist.jpg', {'root': '../'});
});
app.get("/share.js", function(req, res){
  res.sendFile('share.js', {'root': '../'});
});
app.get("/bg.jpg", function(req, res){
  res.sendFile('frontend/bg.jpg', {'root': '../'});
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
    io.sockets.sockets.forEach(function(s){ s.disconnect(true); });
  });

  if (Object.keys(splashes).length >= 2) {
    console.log("starting game");
    curUnic = 0;
    roachesPerPlayer = [0, 0];
    roaches = [];
    for (s in sockets) startGame(sockets[s], colors[s]);

    if (intervalid != null) clearInterval(intervalid);
    intervalid = setInterval(updateGame, 1000);
  };
});

function startGame(socket, color){
  for (var c in splashes) {
    console.log(c, splashes[c]);
    for (var i in splashes[c]) {
      s = splashes[c][i];
      console.log(i, s);
      socket.emit('splash', s);
    }
  };

  socket.on('splash', function(msg){
    splash = JSON.parse(msg);
    roach_id = splash.data.roach_id;
    console.log("DIEEEEEEEE", roach_id);
    splashes[socket.id] = (splashes[socket.id] || []).concat([splash]);
    io.sockets.emit('splash', msg);
  });

  socket.emit('start', color);

  // manual spawn to speed up the start
  var roachId = nextUnicId();
  roaches.push(roachId);
  spawnRoach(roachId);
}

function nextUnicId() {
  curUnic += 1;
  return curUnic;
}

function spawnRoach(roachId) {
  if (Math.random() <= 0.5 && roachesPerPlayer[0] < roachPerPlayer) {
    oneOrTwo = 1;
    roachesPerPlayer[0] += 1;
  } else if (roachesPerPlayer[1] < roachPerPlayer) {
    oneOrTwo = 2;
    roachesPerPlayer[1] += 1;
  }

  console.log(oneOrTwo, roachesPerPlayer);
  if(oneOrTwo == 1) {
    roachPos = [5, Math.random() * CANVAS_HEIGHT];
    roachAngle = Math.random() * 180 + 180;
  } else {
    roachPos = [CANVAS_WIDTH - 5, Math.random() * CANVAS_HEIGHT];
    roachAngle = Math.random() * 180;
  }

  roachSeed = Math.random() * 2*Math.PI;

  io.sockets.emit('roach', {x : roachPos[0], y : roachPos[1], seed : roachSeed, angle : roachAngle, player : oneOrTwo, id : roachId});
}

function updateGame() {
  var roachId
  // create roach pos & seed here
  roachCreated = Math.random () < roachDensity;
  roachCapacityReached = roaches.length >= 2 * roachPerPlayer;
  if (!roachCapacityReached && roachCreated) {
    roachId = nextUnicId();
    roaches.push(roachId);
  } else {
    roachCreated = false;
  }

  t = 0;
  for (x in splashes) t += splashes[x].length;

  if (roachCapacityReached && roaches.length == t ) {
    io.sockets.emit("end", "");
    clearInterval(intervalid);
    intervalid = null;
  }

  if (roachCreated) spawnRoach(roachId);

}



http.listen(3000, function(){
  console.log('listening on *:3000');
});

