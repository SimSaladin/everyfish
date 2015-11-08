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
  initialize: function($super, data) {
    this.type = "RoundSplat";
    $super({ coords: data.coords, radius: data.radius });
  }
});
/* }}} */

/* {{{ Bezier Splat */
BezierSplat = Class.create(Splash, {
  initialize: function($super, data) {
    this.type = "BezierSplat";
    $super({ coords: data.coords, radius: data.radius });
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
