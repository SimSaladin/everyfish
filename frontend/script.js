// vim:foldmethod=marker:foldlevel=0
var socket = io();

var CANVAS_WIDTH = 800, CANVAS_HEIGHT = 550;
var COLORS = ["#85FF00", "#00B8FF"]; // Available colors for the splashes. Must be same in frontend/script.js
var COLORS_RGB = [[133, 255, 0], [0, 184, 255]]


var canvas, stage;
var infoBlock;
var scoreBlock = {};
var scores = {};

var splashes = [];

var color; // The color of our splashes

// splat appearance animation
var animation = {
   initialParameters: function (x, y, scaler) {
      this.x = (1 - scaler) * x;
      this.y = (1 - scaler) * y;
      this.scaleX = scaler;
      this.scaleY = scaler;
      this.alpha = 0;
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

/* {{{ Start, play, end */

jQuery(function(){
  console.log("ready");
  canvas = jQuery("#main");
  stage = new createjs.Stage("main");

  socket.on("connect", function (s) {
    console.log("socket.io connected");
  });

  socket.on("start", startGame);

  createjs.Ticker.setFPS(60);
  createjs.Ticker.addEventListener("tick", stage);

  waitingForPlayers();
});

function waitingForPlayers(){
  infoBlock = new createjs.Text("Waiting for another player...", "20px Arial", "#ff7700");
  infoBlock.x = 200;
  infoBlock.y = 150;
  stage.addChild(infoBlock);
}

function startGame(c){
  color = c;

  indicator = new createjs.Shape();
  indicator.graphics.beginFill(c).drawRect(0,0,CANVAS_WIDTH,9);
  stage.addChild(indicator);

  scoreBlock[COLORS[0]] = new createjs.Text("Score 0", "15px Arial", COLORS[0]);
  scoreBlock[COLORS[1]] = new createjs.Text("Score 0", "15px Arial", COLORS[1]);
  scoreBlock[COLORS[0]].y = scoreBlock[COLORS[1]].y = 30;
  scoreBlock[COLORS[0]].x = 50;
  scoreBlock[COLORS[1]].x = 700;
  stage.addChild(scoreBlock[COLORS[0]]);
  stage.addChild(scoreBlock[COLORS[1]]);

  stage.removeChild(infoBlock);
  socket.on("splash", function(msg){

    var splash;
    var shape = new createjs.Shape();
    var json = JSON.parse(msg);
    switch(json.type) {

      case "Circle":
        splash = new Circle(json.data);
        shape.graphics.beginFill(json.data.color).drawCircle(json.data.coords.x, json.data.coords.y, json.data.radius);
        break;

      case "RoundSplat":
        splash = new RoundSplat(json.data);
        shape = splat.createBezierDefault(json.data.color, json.data.coords);
        break;
    }

    splashes.concat([splash]);
    animateShape(stage, shape, splash.data.coords);
  });

  // Click listeners
  canvas.on("click", function(e){ canvasClick(stage, e); });
  // right click, disable contextmenu, do a click instead
  canvas.on("contextmenu", function(e){ canvasClick(stage, e); return false });
}

function endGame(){
}

/* }}} */

/* {{{ Input */

// Build the shape based on the kind of the click
function canvasClick(stage, event) {
    var coords = getCanvasCoords(event); 

    switch (event.type) {
       case "click":
          (new Circle(coords)).add();
          break;
       case "contextmenu":
          (new RoundSplat(coords)).add();
          break;
    }
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

/* {{{ Animations */

function animateShape(stage, shape, coords) {
   shape.set(animation.initialParameters(coords.x, coords.y, 0.5));
   stage.addChild(shape);

   createjs.Tween.get(shape, { loop: false })
      .to(animation.targetParameters, animation.duration, animation.ease);
}

/* }}} */

/* {{{ Winner calculation */
function calculatePixels() {
  pixels = document.getElementById("main").getContext("2d").getImageData(0,9,CANVAS_WIDTH,CANVAS_HEIGHT-9).data;

  var i = pixels.length;

  scores[ COLORS[0] ] = 0;
  scores[ COLORS[1] ] = 0;


  while (i > 0) {
    rgb = [pixels[i++], pixels[i++], pixels[i++]]
    whoseDot = compareColors(rgb);
    if (whoseDot == COLORS[0]) {
      scores[ COLORS[0] ] += 1;
    } else if (whoseDot == COLORS[1]) {
      scores[ COLORS[1] ] += 1;
    }
    i++;
  }

  scoreBlock[ COLORS[0] ].text = "Score " + scores[ COLORS[0] ];
  scoreBlock[ COLORS[1] ].text = "Score " + scores[ COLORS[1] ];

  
}

function colorDistance(rgb_1, rgb_2) {
  dx = rgb_1[0] - rgb_2[0];
  dy = rgb_1[1] - rgb_2[1];
  dz = rgb_1[2] - rgb_2[2];

  return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2));
}

function compareColors(rgb) {

  distanceToOne = colorDistance(rgb, COLORS_RGB[0]);
  distanceToTwo = colorDistance(rgb, COLORS_RGB[1]);
  distanceToWhite = colorDistance(rgb, [255, 255, 255]);

  if (distanceToWhite < distanceToTwo && distanceToWhite < distanceToOne) {
    return null;
  } else if (distanceToTwo > distanceToWhite) {
    return COLORS[0];
  } else {
    return COLORS[1];
  }

}


  
  
  

/* }}} */
