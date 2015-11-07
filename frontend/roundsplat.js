
function getRoundSplat(centerX, centerY, color, seed) {
  var curve = new createjs.Shape();
  curve.graphics.beginStroke(color);
  curve.graphics.beginFill(color);


  var noise = new Simple1DNoise(Math.seed(seed));


  noise.setAmplitude(25);          // spike variation measure
  var baseCircleRadius = 25;  // minimum radius 
  var spikeMultiplier = 5;  // larger value creates spikes with higher probability
  var sharpnessScale = 1.0 / 7; // spike length multiplier
  var resolution = 100; // number of line segments

  // circle center coordinates
  var x0 = centerX;
  var y0 = centerY;


  var sin = Math.sin, cos = Math.cos;

  // begin point, invert y axis
  curve.graphics.moveTo(x0, y0 - baseCircleRadius - noise.getVal(0));

  for (var i = 0 ; i < resolution; i++) {
    var theta = Math.PI * 2 * i / resolution;

    var amplitude = (noise.getVal(theta * spikeMultiplier) + noise.getVal((Math.PI * 2 + theta)* spikeMultiplier))/2;

    amplitude = baseCircleRadius + amplitude * amplitude * sharpnessScale; // sharper spikes with some shrinking?

    // inverted y-axis, y grows up
    curve.graphics.lineTo( x0 + sin(theta) * amplitude, y0 - cos(theta) * amplitude );
  }

  return curve;
}
function gaussian(x, stdev) {
  return Math.exp(-(x*x/(2*stdev*stdev))) / Math.sqrt(2*Math.PI) * stdev;
}

function getLineSplat(startX, startY, color, angle, length, seed) {
  var curve = new createjs.Shape();
  curve.graphics.beginStroke(color);
  curve.graphics.beginFill(color);


  var noise = new Simple1DNoise(Math.seed(seed));


  noise.setAmplitude(1);          // spike variation measure
  var baseCircleRadius = 25;  // minimum radius 
  var spikeMultiplier = 8;  // larger value creates spikes with higher probability
  var sharpnessScale = 2*length; // 200; // spike length multiplier
  var resolution = 150; // number of line segments
  var tailSharpness = length / 18; // 9
  var tailBase = length/2; // 50
  var baseWaveness = length/10; // 10

  // circle center coordinates
  var x0 = startX;
  var y0 = startY;


  var sin = Math.sin, cos = Math.cos;

  // begin point, invert y axis
  curve.graphics.moveTo(x0, y0 - baseCircleRadius - noise.getVal(0));

  for (var i = 0 ; i < resolution; i++) {
    var theta = Math.PI * 2 * i / resolution;

    var amplitude = (noise.getVal(theta * spikeMultiplier) + noise.getVal((Math.PI * 2 + theta)* spikeMultiplier))/2;

    var diff = theta - angle;
    var angleCoef = gaussian(tailSharpness*diff, 3);
    amplitude = baseCircleRadius + angleCoef * tailBase + amplitude * baseWaveness + angleCoef * sharpnessScale * amplitude * amplitude;

    // inverted y-axis, y grows up
    curve.graphics.lineTo( x0 + sin(theta) * amplitude, y0 - cos(theta) * amplitude );
  }
  
  return curve;
}
