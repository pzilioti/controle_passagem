var five = require("johnny-five");
var board = new five.Board();

board.on("ready", function() {

  var sensorA = new five.Sensor({
    pin:"A0",
    freq: 50,
    threshold: 7
  })

  var sensorB = new five.Sensor({
    pin:"A1",
    freq: 50,
    threshold: 4
  })

  sensorA.on("change", function() {
	var value = sensorA.value
    console.log("A:", value)
  })

  sensorB.on("change", function() {
	var value = sensorB.value    
	console.log("B:", value)
  })
});
