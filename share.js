/* Serialization stuff */

/* {{{ Splash */
Splash = Class.create({
  initialize: function(data){
    this.data = data;
    this.data.color = color;
    this.json = { type: this.type, data: data };
  },

  add: function() {
    socket.emit('splash', JSON.stringify(this.json));
  },
});

/* }}} */

/* {{{ Round Splat */
RoundSplat = Class.create(Splash, {
  initialize: function($super, json) {
    this.type = "RoundSplat";
    $super(json);
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
