var socket = io();

var CANVAS_WIDTH = 800, CANVAS_HEIGHT = 550;

share.createjs = createjs;

var canvas, stage;

var splashes = [];

function init(){
  canvas = $("#main");
  stage = new createjs.Stage("#main");

  socket.on("splash", function(msg){
    console.log(msg);

    var splash = new share.Splash(msg);
    splashes.concat([splash]);

    splash.draw(stage, new createjs.Graphics());
  });

  // Click listeners

  canvas.on("click", function(e) {canvasClick(stage, e)});
  // right click, disable contextmenu, do a click instead
  canvas.on("contextmenu", function(e) {canvasClick(stage, e); return false;});
}

/* {{{ Input */

// Build the shape based on the kind of the click
function canvasClick(stage, event) {
    var coords = getCanvasCoords(event); 

    // Option 1: Round splat
    (new share.RoundSplat(coords)).add();

    // Option 2: ???
}

function getCanvasCoords(event) {
  var e = event;
  var x;
  var y;
  if (e.pageX || e.pageY) { 
    x = e.pageX;
    y = e.pageY;
  }
  else { 
    x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
    y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
  } 
  x -= canvas[0].offsetLeft;
  y -= canvas[0].offsetTop;
  
  return {'x': x, 'y': y};
}

/* }}} */
