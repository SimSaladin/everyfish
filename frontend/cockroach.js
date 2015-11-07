
// Takes starting position and starting angle (in degrees)
function createCockroach(stage, x, y, angle, turnSpeedCoeff) {
  if (!turnSpeedCoeff) turnSpeedCoeff = 0.001;
  var speed = 4;

  var runner = new createjs.Sprite(cockroachSheet, "run");
  runner.framerate = 18;

  // register coords: middlepoint to fix rotation
  var bounds = runner.getBounds();
  runner.setTransform(x, y, 1, 1, angle, 0, 0, bounds.width/2, bounds.height*1.2/2);

  var wanderNoise = new Simple1DNoise();
  wanderNoise.setAmplitude(1);

  // for disappearing and respawning
  var gameFieldBoundary = new createjs.Rectangle(0,0,window.canvasWidth, window.canvasHeight);
  // increase size for more natural disappearing
  var hiddenMargin = 10;
  gameFieldBoundary.x = -hiddenMargin;
  gameFieldBoundary.y = -hiddenMargin;
  gameFieldBoundary.width += 2*hiddenMargin;
  gameFieldBoundary.height += 2*hiddenMargin;

  // Move logic
  createjs.Ticker.addEventListener("tick", function(e) {
    runner.rotation = wanderNoise.getVal(e.timeStamp * turnSpeedCoeff) * 360;
    var curRotRad = (runner.rotation - 90) * Math.PI / 180 ; // fix opposite orientation of image
    runner.x = runner.x + Math.cos(curRotRad) * speed;
    runner.y = runner.y + Math.sin(curRotRad) * speed;

    var bounds = runner.getBounds();
    bounds.x = runner.x;
    bounds.y = runner.y;
    if (!bounds.intersects(gameFieldBoundary)) { //then respawn
      if (runner.x < gameFieldBoundary.x) 
        runner.x += gameFieldBoundary.width + bounds.width;
      else if (runner.x > gameFieldBoundary.x + gameFieldBoundary.width)
        runner.x -= gameFieldBoundary.width + bounds.width;

      if (runner.y < gameFieldBoundary.y)
        runner.y += gameFieldBoundary.height + bounds.height;
      else if (runner.y > gameFieldBoundary.y + gameFieldBoundary.height)
        runner.y -= gameFieldBoundary.height + bounds.height;

      console.log(runner);
    }
  });

  stage.addChild(runner);
  stage.update();
  return runner;
}
