/**
 * Namespace for splat operations
 */
var splat = splat || {};

/* {{{ bezier splat */

splat.createDefaultBezier = function (color, pos) {
   var splat = new bezierSplat(this.bezierDefaultParamsFor([pos.x, pos.y]));
   return splat.getShape(color);
};

splat.bezierDefaultParamsFor = function (pos) {
   var params = this.bezierDefaultParams;
   params.position = pos;
   return params;
};

splat.bezierDefaultParams = {
   radius: 40,
   tipNo: 13.0,
   offsetCoef: 3.0,
   symmetry: false
};

/* }}} */

/* {{{ roundsplat and linesplat */

splat.createDefaultLine = function (color, pos, length, angle) {
   var splatShape = getLineSplat(pos.x, pos.y, color, angle, length);
   return splatShape;
}

splat.createDefaultRound = function (color, pos, seed) {
   var splatShape = getRoundSplat(pos.x, pos.y, color, seed);
   return splatShape;
}

/* }}} */

