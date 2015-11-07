/**
 * Namespace for splat operations
 */
var splat = splat || {};

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

