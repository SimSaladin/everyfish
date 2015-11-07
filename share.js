/* Serialization stuff */

/* {{{ Splash */
Splash = Class.create({
  initialize: function(data){
    this.data = data;
    this.data.color = color;
    this.data.seed = Math.seed();
    this.json = { type: this.type, data: data };
  },

  add: function() {
    socket.emit('splash', JSON.stringify(this.json));
  },
});

/* }}} */

/* {{{ Round Splat */
RoundSplat = Class.create(Splash, {
  initialize: function($super, coords) {
    this.type = "RoundSplat";
    $super({ coords: coords });
  }
});
/* }}} */

/* {{{ Bezier Splat */
BezierSplat = Class.create(Splash, {
  initialize: function($super, coords) {
    this.type = "BezierSplat";
    $super({ coords: coords });
  }
});
/* }}} */

/* {{{ Circle */
Circle = Class.create(Splash, {
  initialize: function($super, coords) {
    this.type = "Circle";
    $super({ coords : coords, radius : 35 });
  }
});
