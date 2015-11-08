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
app.get("/prototype.min.js", function(req, res){
  res.sendFile('prototype.min.js', {'root': '../'});
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
app.get("/fist.png", function(req, res){
  res.sendFile('frontend/fist.png', {'root': '../'});
});
app.get("/share.js", function(req, res){
  res.sendFile('share.js', {'root': '../'});
});
app.get("/bg.jpg", function(req, res){
  res.sendFile('frontend/bg.jpg', {'root': '../'});
});
app.get("/logo.png", function(req, res){
  res.sendFile('logo.png', {'root': '../'});
});

/* }}} */

io.on('connection', function(socket){
  console.log('user connected');

  splashes = {};
  colors[socket.id] = COLORS[++socket_count % 2];
  sockets[socket.id] = socket;

  socket.on('disconnect', function(){
    console.log('user disconnected');
    clearInterval(intervalid);
    io.sockets.sockets.forEach(function(s){ s.disconnect(true); });
  });

  if (Object.keys(sockets).length >= 2) {
    console.log("starting game");
    curUnic = 0;
    roachesPerPlayer = [0, 0];
    roaches = [];
    for (s in sockets) startGame(sockets[s], colors[s]);

    // manual spawn to speed up the start
    spawnRoach();

    if (intervalid != null) clearInterval(intervalid);
    intervalid = setInterval(updateGame, 1000);
  };
});

// note: called for every socket
function startGame(socket, color){

  socket.on('splash', function(msg){
    splash = JSON.parse(msg);
    roach_id = splash.data.roach_id;
    console.log("DIEEEEEEEE", roach_id);
    splashes[roach_id] = splash;
    io.sockets.emit('splash', msg);
  });

  socket.emit('start', color);
}

function nextUnicId() {
  curUnic += 1;
  return curUnic;
}

function spawnRoach() {
  var oneOrTwo, roachPos, roachAngle;

  if (Math.random() <= 0.5 && roachesPerPlayer[0] < roachPerPlayer || roachesPerPlayer[1] == roachPerPlayer) {
    oneOrTwo = 1;
    roachesPerPlayer[0] += 1;
    roachPos = [5, Math.random() * CANVAS_HEIGHT];
    roachAngle = Math.random() * 180 + 180;
  } else if (roachesPerPlayer[1] < roachPerPlayer) {
    oneOrTwo = 2;
    roachesPerPlayer[1] += 1;
    roachPos = [CANVAS_WIDTH - 5, Math.random() * CANVAS_HEIGHT];
    roachAngle = Math.random() * 180;
  }

  var roachId = nextUnicId();
  roaches.push(roachId);

  console.log(oneOrTwo, roachesPerPlayer);

  roachSeed = Math.random() * 2*Math.PI;

  io.sockets.emit('roach', {x : roachPos[0], y : roachPos[1], seed : roachSeed, angle : roachAngle, player : oneOrTwo, id : roachId});
}

function updateGame() {
  // create roach pos & seed here
  
  roachCapacityReached = roaches.length >= 2 * roachPerPlayer;
  if (!roachCapacityReached && Math.random() < roachDensity) {
    spawnRoach();
  }

  if (roachCapacityReached && roaches.length == Object.keys(splashes).length ) {
    io.sockets.emit("end", "");
    clearInterval(intervalid);
    intervalid = null;
  }


}



http.listen(3000, function(){
  console.log('listening on *:3000');
});

