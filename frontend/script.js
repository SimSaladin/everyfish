var socket = io();

share.createjs = createjs;
var Splash = share.Splash;

var stage;

var splashes = [];

function init(){
  stage = new createjs.Stage("main");

  socket.on("splash", function(msg){
    console.log(msg);

    var splash = new Splash(msg);
    splashes.concat([splash]);

    splash.draw(stage, new createjs.Graphics());
  });
}
