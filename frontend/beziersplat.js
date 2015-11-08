"use strict";
/** 
 * Bezier Splat implementation object.
 *
 * @param pos {[Num]} the center of the splat
 * @param r {Num} the radius of the splat
 * @param tipN {Num} number of the tips
 * @param coef {Num} a scaling coefficient
 * @param uniform {Boolean} uniform distribution of tips
*/
function bezierSplat(params) {
   var random = Math.seed(params.seed);
   console.log("bezierSplat seed", params.seed);
   var randomN = function (n) {
      return Math.floor((random() * n) + 1);
   };

   var getPosOnCircle = function (angle, r, o) {
      return [o[0] + r * Math.cos(angle), 
         o[1] + r * Math.sin(angle)];
   };

   var nullVector = function (n) {
      var vector = [], i;
      for (var i = 0; i < n; i++) {
         vector.push(0);
      }
      return vector;
   };

   var getPositions = function (position, radius, 
         tipNo, offsetCoef, symmetry) {

      var angleOffsets, angleStep,
          offsets, positions, i,
          direction, offsetVector;

      // calculate the angle offsets
      if (symmetry) {
         angleOffsets = nullVector(tipNo);
      } else {
         angleOffsets = seededrandom(tipNo, random);
         angleOffsets = numeric.div(angleOffsets, 2 * Math.PI);
         angleOffsets = numeric.mul(offsetCoef, angleOffsets);
      }
      
      angleStep = (2 * Math.PI) / (tipNo - 1);

      // calculate tip offset coefficien randomly
      offsets = seededrandom(tipNo, random);
      offsets = numeric.add(numeric.mul(offsetCoef / 2.0, offsets), 1.5);

      /* calculates initial point positions
       * on a circle of radius radius */
      positions = [];
      for (var i = 0; i < tipNo; i++) {
         positions.push(getPosOnCircle(
                  i * angleStep + angleOffsets[i], 
                  radius, position));
      }

      /* updates every second point as
       * a tip by moving it by an offset */
      for (var i = 1; i < tipNo; i += 2) {
         direction = numeric.sub(positions[i], position);
         offsetVector = numeric.mul(offsets[i], direction);
         positions[i] = numeric.add(positions[i], 
               offsetVector);
      }

      return positions;
   };


   var data = getPositions(params.position, params.radius,
         params.tipNo, params.offsetCoef, params.symmetry);

   /* Get the fixed create.js shape for
    * your splat.
    *
    * @param color {String} the color of the splat
    * @return create.js shape
   */
   this.getShape = function (color) {
      var curve = new createjs.Graphics()
         .beginStroke(color)
         .beginFill(color);

      for (var i = 0; i < data.length - 2; i += 2) {
         curve = curve.bezierCurveTo(
               data[i][0],
               data[i][1],
               data[i+1][0],
               data[i+1][1],
               data[i+2][0],
               data[i+2][1]);
      }

      return new createjs.Shape(curve);
   };
};

function seededrandom(len, random) {
  var arr = [];
  while (len-- > 0) arr.push(random());
  return arr;
}

