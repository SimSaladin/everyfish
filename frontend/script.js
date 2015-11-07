var socket = io();

var CANVAS_WIDTH = 800, CANVAS_HEIGHT = 550;

var canvas, stage;

var splashes = [];

var animation = {
   initialParameters: function (x, y) {
      x: (1 - scaler) * x,
      y: (1 - scaler) * y,
      scaleX: scaler,
      scaleY: scaler,
      alpha: 0
   },
   targetParameters: {
      x: -20,
      y: -20,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 1
   },
   duration: 1000,
   ease: createjs.Ease.getPowInOut(4)
};

jQuery(function(){
  console.log("ready");
  canvas = jQuery("#main");
  stage = new createjs.Stage("main");

  createjs.Ticker.setFPS(60);
  createjs.Ticker.addEventListener("tick", stage);

  socket.on("splash", function(msg){

    var splash;
    var shape = new createjs.Shape();
    var json = JSON.parse(msg);
    switch(json.type) {

      case "Circle":
        splash = new Circle(json.data);
        shape.graphics.beginFill("red").drawCircle(json.data.coords.x, json.data.coords.y, json.data.radius);
        break;

      case "RoundSplat":
        splash = new RoundSplat(json.data);
        break;
    }

    splashes.concat([splash]);
    stage.addChild(shape);
    animateShape(shape);
  });

  // Click listeners

  canvas.on("click", function(e) {canvasClick(stage, e)});
  // right click, disable contextmenu, do a click instead
  canvas.on("contextmenu", function(e) {canvasClick(stage, e); return false;});
});

/* {{{ Input */

// Build the shape based on the kind of the click
function canvasClick(stage, event) {
    var coords = getCanvasCoords(event); 

    // Option 1: Round splat
    // (new RoundSplat(coords)).add();

    // Option 2: ???
    (new Circle(coords)).add();
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

function animateShape(shape) {
   shape.set(animation.initialParameters(shape.x, shape.y));
   createjs.Tween.get(shape, { loop: false })
      .to(animation.targetParameters, animation.duration, animation.ease);
}

/* }}} */
