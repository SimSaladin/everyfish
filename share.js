// Code shared between the frontend and backend
(function(exports){

  /* {{{ Splash */
  exports.Splash = function(json){
    this.json = json;
  };

  exports.Splash.prototype.add = function() {
    socket.emit('splash', this.json);
  };

  exports.Splash.prototype.draw = function(stage, graphics) {

    var curve = graphics.beginFill("red").drawPolyStar(100, 100, 40, 6, 0.6, -90);

    this.shape = new createjs.Shape(curve);
    stage.addChild(this.shape);
    stage.update();
  }
  /* }}} */

  /* {{{ Round Splat */
  exports.RoundSplat = function(coords) {
    console.log($("#main"));
    exports.Splash({ coords : coords });
  }
  exports.RoundSplat.prototype = exports.Splash.prototype;
  /* }}} */

}(typeof exports === 'undefined' ? this.share = {} : exports));

