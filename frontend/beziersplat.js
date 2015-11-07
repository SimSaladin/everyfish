/** 
 * Bezier Splat implementation object.
 *
 * @param pos {[Num]} the center of the splat
 * @param r {Num} the radius of the splat
 * @param tipN {Num} number of the tips
 * @param coef {Num} a scaling coefficient
 * @param uniform {Boolean} uniform distribution of tips
*/
function bezierSplat(pos, r,
      tipN, coef, uniform) {

   var params;
   if (arguments.length == 0) {
      params = bezierSplat.defaultParameters;
   } else {
      params = {
         positions: pos,
         radius: r,
         tipNo: tipN,
         offsetCoef: coef,
         symmetry: uniform
      };
   }

   var data = getPositions(params.position, params.radius,
         params.tipNo, params.offsetCoef, params.symmetry);

   var randomN = function (n) {
      return Math.floor((Math.random() * n) + 1);
   };

   var getPosOnCircle = function (angle, r, o) {
      return [o[0] + r * Math.cos(angle), 
         o[1] + r * Math.sin(angle)];
   };

   var nullVector = function (n) {
      var vector = [], i;
      for (i = 0; i < n; i++) {
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
         angleOffsets = numeric.random([1,tipNo])[0];
         angleOffsets = numeric.div(angleOffsets, 2 * Math.PI);
         angleOffsets = numeric.mul(offsetCoef, angleOffsets);
      }
      
      angleStep = (2 * Math.PI) / (tipNo - 1);

      // calculate tip offset coefficien randomly
      offsets = numeric.random([1,tipNo])[0];
      offsets = numeric.add(numeric.mul(offsetCoef / 2.0, offsets), 1.5);

      /* calculates initial point positions
       * on a circle of radius radius */
      positions = [];
      for (i = 0; i < tipNo; i++) {
         positions.push(getPosOnCircle(
                  i * angleStep + angleOffsets[i], 
                  radius, position));
      }

      /* updates every second point as
       * a tip by moving it by an offset */
      for (i = 1; i < tipNo; i += 2) {
         direction = numeric.sub(positions[i], position);
         offsetVector = numeric.mul(offsets[i], direction);
         positions[i] = numeric.add(positions[i], 
               offsetVector);
      }

      return positions;
   };

   /* Get the fixed create.js shape for
    * your splat.
    *
    * @param color {String} the color of the splat
    * @return create.js shape
   */
   this.getShape = function (color) {
      var positions = getPositions(pos, r,
            tipN, coef, uniform);

      var curve = new createjs.Graphics()
         .beginStroke(color)
         .beginFill(color);

      for (i = 0; i < positions.length - 2; i += 2) {
         curve = curve.bezierCurveTo(
               positions[i][0],
               positions[i][1],
               positions[i+1][0],
               positions[i+1][1],
               positions[i+2][0],
               positions[i+2][1]);
      }

      return new createjs.Shape(curve);
   };
};

bezierSplat.createDefault = function (color) {
   var splat = new bezierSplat();
   return splat.getShape(color);
}

function createBezierSplat(
