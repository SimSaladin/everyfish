"use strict";
// vim:foldmethod=marker:foldlevel=0
var socket = io();

var CANVAS_WIDTH = 800, CANVAS_HEIGHT = 550;
var COLORS = ["#85FF00", "#00B8FF"]; // Available colors for the splashes. Must be same in frontend/script.js
var COLORS_RGB = [[133, 255, 0], [0, 184, 255]]
var colorThreshold = 100;

var HITBOX = 120;


var canvas, stage;
var canvasDom;
var mouse = {};
mouse.x = 100;
mouse.y = 100;

var infoBlock;
var scoreBlock = {};
var scores = {};
var roaches = {};

var splashes = [];

var color; // The color of our splashes
var cockroachSheet; // graphics resources for cockroach

/* {{{ utility */

// usage:
// var random1 = Math.seed(42);
// var random2 = Math.seed(random1());
// Math.random = Math.seed(random2());
Math.seed = function(s) {
      return function() {
                s = Math.sin(s) * 10000; return s - Math.floor(s);
                    };
};

Math.randomFromInterval = function (min, max) {
   return Math.floor(Math.random() * (max - min)) + min;  
};

var Simple1DNoise = function(random) {
    var MAX_VERTICES = 256;
    var MAX_VERTICES_MASK = MAX_VERTICES -1;
    var amplitude = 1;
    var scale = 1;

    var r = [];

    for ( var i = 0; i < MAX_VERTICES; ++i ) {
        r.push(random());
    }

    var getVal = function( x ){
        var scaledX = x * scale;
        var xFloor = Math.floor(scaledX);
        var t = scaledX - xFloor;
        var tRemapSmoothstep = t * t * ( 3 - 2 * t );

        /// Modulo using &
        var xMin = xFloor & MAX_VERTICES_MASK;
        var xMax = ( xMin + 1 ) & MAX_VERTICES_MASK;

        var y = lerp( r[ xMin ], r[ xMax ], tRemapSmoothstep );

        return y * amplitude;
    };

    /**
    * Linear interpolation function.
    * @param a The lower integer value
    * @param b The upper integer value
    * @param t The value between the two
    * @returns {number}
    */
    var lerp = function(a, b, t ) {
        return a * ( 1 - t ) + b * t;
    };

    // return the API
    return {
        getVal: getVal,
        setAmplitude: function(newAmplitude) {
            amplitude = newAmplitude;
        },
        setScale: function(newScale) {
            scale = newScale;
        }
    };
};
/* }}} */

/* {{{ Start, play, end */

jQuery(function(){
  canvas = jQuery("#main");
  canvasDom = canvas.get()[0];

  document.addEventListener('pointerlockchange', changeCallback, false);
  document.addEventListener('mozpointerlockchange', changeCallback, false);
  document.addEventListener('webkitpointerlockchange', changeCallback, false);

  canvasDom.requestPointerLock = canvasDom.requestPointerLock ||
     canvasDom.mozRequestPointerLock ||
     canvasDom.webkitRequestPointerLock;


  stage = new createjs.Stage("main");

  mouse.bitmap = new createjs.Bitmap("fist.png");
  
  // load cockroach animation
  cockroachSheet = new createjs.SpriteSheet( {
    images: ["cockroach.png"],
    frames: {width:175, height:207},
    animations: {
      green: [0,1],
      blue: [2,3]
    }
  });
  if (!cockroachSheet.complete) {
    console.log("waiting for images...");
    cockroachSheet.addEventListener("complete", initialize);
  }
  else initialize();
});

function initialize() {

  console.log("ready");

  canvasDom.requestPointerLock();

  socket.on("connect", function (s) {
    console.log("socket.io connected");
  });

  socket.on("disconnect", function (s) {
    infoBlock.text = "Disconnected from server, please refresh";
    stage.addChild(infoBlock);
  });

  socket.on("start", startGame);
  socket.on("end", endGame);

  createjs.Ticker.setFPS(60);
  createjs.Ticker.addEventListener("tick", stage);
  // createjs.Ticker.addEventListener("tick", updateMouse);

  stage.addChild(mouse.bitmap);
  stage.update();

  waitingForPlayers();

};

function waitingForPlayers(){
  infoBlock = new createjs.Text("Waiting for another player...", "20px Arial", "#ff7700");
  infoBlock.x = 200;
  infoBlock.y = 150;
  stage.addChild(infoBlock);
}

function startGame(c){
  color = c;

  var indicator = new createjs.Shape();
  indicator.graphics.beginFill(c).drawRect(0,0,CANVAS_WIDTH,9);
  stage.addChild(indicator);

  scoreBlock[COLORS[0]] = new createjs.Text("Score 0", "15px Arial", COLORS[0]);
  scoreBlock[COLORS[1]] = new createjs.Text("Score 0", "15px Arial", COLORS[1]);
  scoreBlock[COLORS[0]].y = scoreBlock[COLORS[1]].y = 20;
  scoreBlock[COLORS[0]].x = 50;
  scoreBlock[COLORS[1]].x = 700;
  // stage.addChild(scoreBlock[COLORS[0]]);
  // stage.addChild(scoreBlock[COLORS[1]]);

  stage.removeChild(infoBlock);
  socket.on("splash", function(msg){
    var splash;
    var shape = new createjs.Shape();
    var json = JSON.parse(msg);

    switch(json.type) {

      case "BezierSplat":
        splash = new BezierSplat({ coords: json.data.coords, radius: json.data.radius });
        shape = splat.createBezier(json.data.color, json.data.coords, json.data.radius, json.data.seed);
        console.log("received bezier");
        break;

      case "RoundSplat":
        splash = new RoundSplat({ coords: json.data.coords, radius: json.data.radius });
        shape = splat.createRound(json.data.color, json.data.coords, json.data.seed,
              json.data.radius);
        console.log("received round");
        break;
    }

    splashes.concat([splash]);
    stage.removeChild(roaches[json.data.roach_id]);
    delete roaches[json.data.roach_id];
    animateShape(stage, shape, splash.data.coords);
  });

  socket.on("roach", function(data) {
    var color = data.player == 1 ? "green" : "blue";
    console.log(color);
    console.log(data);
    var roach = createCockroach(stage, data.seed, data.x, data.y, data.angle, color);
    roaches[roach.id] = roach;
    roaches[roach.id].data = data;
  });

  // Click listeners
  canvas.on("click", function(e){ canvasEvent(stage, e); });
  // right click, disable contextmenu, do a click instead
  canvas.on("contextmenu", function(e){ canvasEvent(stage, e); return false });

  stage.update();
}

function endGame(){
  calculatePixels();
   var positions,
       title,
       information,
       effects;
   var i, safeDist = 100,
       effectsAmount = 1,
       output, myIndex;

   effects = new Array(effectsAmount);
   positions = new Array(effectsAmount);

   var otherColor = COLORS[0] == color ? COLORS[1] : COLORS[0];
   output = scores[color] > scores[otherColor] ? "YOU WIN!" : "YOU LOSE!";
   
   /* create the texts */
   title = new createjs.Text(output, "60px Arial", "#ff7700");
   title.textAlign = "center";
   title.x = CANVAS_WIDTH / 2;
   title.y = CANVAS_HEIGHT / 2 - 65;

   output = scores[COLORS[0]] + " - " + scores[COLORS[1]];

   information = new createjs.Text(output,
         "35px Arial", "#ff7700");
   information.textAlign = "center";
   information.x = CANVAS_WIDTH / 2;
   information.y = CANVAS_HEIGHT / 2;

   /* randomize positions */
   for (i = 0; i < effectsAmount; i++) {
      positions[i] = {};
      positions[i].x = Math.randomFromInterval(
            safeDist, CANVAS_WIDTH - safeDist);
      positions[i].y = Math.randomFromInterval(
            safeDist, CANVAS_HEIGHT - safeDist);
   };

   /* ...or not */
   positions[0].x = CANVAS_WIDTH / 2 - 300;
   positions[0].y = CANVAS_HEIGHT / 2 - 40;

   /* create the splats */

   // TODO: choose between round and line
   //effects[0] = splat.createRound(color, positions[0], 
         //Math.floor(Math.random() * 1000) + 1, 50);
   effects[0] = splat.createDefaultLine(color, positions[0], 
         350, Math.PI / 2, Math.floor(Math.random() * 1000) + 1);

   /* remove old children */
   // stage.removeAllChildren();

   effects.forEach(function (element, index) {
      animateShape(stage, element, positions[index]);
   });

   stage.addChild(title);
   stage.addChild(information);
   stage.update();
}

/* }}} */

/* {{{ Input */

// called when the pointer lock has changed. Here we check whether the
// pointerlock was initiated on the element we want.
function changeCallback(e) {
  var canvasDom = canvas.get()[0];
  if (document.pointerLockElement === canvasDom ||
          document.mozPointerLockElement === canvasDom ||
          document.webkitPointerLockElement === canvasDom) {

      // we've got a pointerlock for our element, add a mouselistener
      document.addEventListener("mousemove", moveCallback, false);
  } else {
      // pointer lock is no longer active, remove the callback
      document.removeEventListener("mousemove", moveCallback, false);
  }
};

function getPosition(event) {
  var x = new Number();
  var y = new Number();

  if (event.x != undefined && event.y != undefined) {
      x = event.x;
      y = event.y;
  }
  else // Firefox method to get the position
  {
      x = event.clientX + document.body.scrollLeft +
              document.documentElement.scrollLeft;
      y = event.clientY + document.body.scrollTop +
              document.documentElement.scrollTop;
  }

  x -= canvasDom.offsetLeft;
  y -= canvasDom.offsetTop;

  return {x:x, y:y};
}

function moveCallback(e) {
   // if we enter this for the first time, get the initial position
   if (mouse.x == -1) {
      pos = getPosition(e);
      mouse.x = pos.x;
      mouse.y = pos.y;
   }

   //get a reference to the canvas
   var movementX = e.movementX ||
          e.mozMovementX ||
          e.webkitMovementX ||
          0;

   var movementY = e.movementY ||
          e.mozMovementY ||
          e.webkitMovementY ||
          0;

   console.log(movementX + ", " + movementY);
   movementX = Math.abs(movementX) < 50 ? movementX : 0;
   movementY = Math.abs(movementY) < 50 ? movementY : 0;

   // calculate the new coordinates where we should draw the ship
   mouse.x = Math.max(Math.min(mouse.x + movementX, CANVAS_WIDTH), 0);
   mouse.y = Math.max(Math.min(mouse.y + movementY, CANVAS_HEIGHT), 0);

   //mouse.x += movementX;
   //mouse.y += movementY;

   mouse.bitmap.x = mouse.x;
   mouse.bitmap.y = mouse.y;
}

// Build the shape based on the kind of the click
function canvasEvent(stage, event) {
    var coords = getCanvasCoords(event); 


    var hits = checkHits(mouse);
    if (hits.length == 0) return false;

    var splatGenerator;
    switch (event.type) {
       case "click":
          var alt = 0, shift = 0, ctrl = 0;
          alt = event.altKey ? 1 : 0;
          shift = event.shiftKey ? 1 : 0;
          ctrl = event.ctrlKey ? 1 : 0;

          var value = alt << 2 | shift << 1 | ctrl; 
          if (value < 2) {
             // bezier
             splatGenerator = function(splatPoint) { return new BezierSplat(
                   { coords: splatPoint, radius: 20 + value * 10, seed: Math.random() }) };
             console.log("sent bezier");
          } else {
             splatGenerator = function(splatPoint) { return new RoundSplat(
                   { coords: splatPoint, radius: 30 + (value - 2) / 5 * 20, seed: Math.random() }) };
             console.log("sent bezier");
          }
       
          break;
       case "contextmenu":
          break;
    }

    hits.map(function(hit){
      var s = splatGenerator({x:hit.x, y:hit.y});
      s.data.roach_id = hit.id;
      s.data.color = COLORS[hit.data.player-1];
      s.add();
    });
}

// list of roaches hit by hitting at argument.
function checkHits(coords) {
  var hits = Object.values(roaches).filter(function(x){
    return Math.abs(x.x - coords.x) + Math.abs(x.y - coords.y) < HITBOX;
  });
  return hits;
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

// splat appearance animation
/* TOUCH THIS WITH YOUR OWN RISK */
var animation = {
   initialParameters: function (x, y) {
      this.x = 0.8 * x;
      this.y = 0.8 * y;
      this.scaleX = 0.2;
      this.scaleY = 0.2;
      this.alpha = 0;
   },
   targetParameters: function (x, y, scaler) {
      this.x = (1 - scaler) * x;
      this.y = (1 - scaler) * y;
      this.scaleX = scaler;
      this.scaleY = scaler;
      this.alpha = 1;
   },
   duration: 400,
   ease: createjs.Ease.getPowInOut(4)
};

function updateMouse(event) {
  mouse.bitmap.x = mouse.x;
  mouse.bitmap.y = mouse.y;
}

function sortFunc(obj1, obj2, opt) {
  if (obj1.createdTime > obj2.createdTime) {return 1;}
  if (obj1.createdTime < obj2.createdTime) {return -1;}
  if (obj1.createdTime) {return -1;}
  if (obj2.createdTime) {return 1;}
  return 0;
}

function animateShape(stage, shape, coords) {
   shape.set(new animation.initialParameters(coords.x, coords.y));
   shape.createdTime = Date.now();
   stage.addChild(shape);
   stage.sortChildren(sortFunc);

   // move to background
   stage.setChildIndex(shape, splashes.length-1);

   stage.update();
   createjs.Tween.get(shape, { loop: false })
      .to(new animation.targetParameters(coords.x, coords.y, 1.1), 
            animation.duration, animation.ease);
}

/* }}} */

/* {{{ Winner calculation */
function calculatePixels() {
  var pixels = document.getElementById("main").getContext("2d").getImageData(0,9,CANVAS_WIDTH,CANVAS_HEIGHT-9).data;

  var i = pixels.length;

  scores[ COLORS[0] ] = 0;
  scores[ COLORS[1] ] = 0;


  while (i > 0) {
    if (pixels[i--] == 0) continue;
    var rgb = [pixels[i--], pixels[i--], pixels[i--]].reverse();
    var comp = compareColors(rgb);
    if(comp != null) {
      scores[ compareColors(rgb) ] += 1;
    }
  }

  scoreBlock[ COLORS[0] ].text = "Score " + scores[ COLORS[0] ];
  scoreBlock[ COLORS[1] ].text = "Score " + scores[ COLORS[1] ];

}

function colorDistance(rgb_1, rgb_2) {
  var dx = rgb_1[0] - rgb_2[0];
  var dy = rgb_1[1] - rgb_2[1];
  var dz = rgb_1[2] - rgb_2[2];

  return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2));
}

function compareColors(rgb) {

  var distanceToOne = colorDistance(rgb, COLORS_RGB[0]);
  var distanceToTwo = colorDistance(rgb, COLORS_RGB[1]);

  if (distanceToTwo > distanceToOne) {
    if(distanceToOne < colorThreshold) { return COLORS[0] }
  } else {
    if(distanceToTwo < colorThreshold) { return COLORS[1] }
  }

  return null;
}

/* }}} */
