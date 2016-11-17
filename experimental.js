var five = require("johnny-five");
var firebase = require("firebase");

var board = new five.Board();
  
var config = {
  apiKey: "AIzaSyBCx4bleuLaldYVBQKYDMzhaHKO_oH7mpo",
  authDomain: "controle-passagem.firebaseapp.com",
  databaseURL: "https://controle-passagem.firebaseio.com",
  storageBucket: "controle-passagem.appspot.com",
  messagingSenderId: "765977607765"
};
firebase.initializeApp(config);
var rootRef = firebase.database().ref();

var lastRegisteredA
var lastRegisteredB

var history = []

var occupationCount = 0
var occupationHistory = []

function isBlocked(params) {
  var current = params.current
  var sensor = params.sensorCode
  if (sensor == 'A') {
    return current > lastRegisteredA
  } else if (sensor == 'B') {
    return current > lastRegisteredB
  }
}

function startTimeoutInterval() {
  setTimeout(function(){
    checkHistory()
    history = []
    console.log("Zerou =========================")
  }, 1000*1.5)
}

function registerChange(params) {
  var sensor = params.sensor
  var isBlocked = params.isBlocked
  if (history.length == 0) startTimeoutInterval()
  history.push({sensor: sensor, isBlocked: isBlocked})
}

function checkHistory() {
  // history.forEach(function(el, idx){
  //   console.log("History["+idx+"] = "+el.sensor+":"+el.isBlocked)
  // })
  var firstBlocked = history.find(function(el) {return el.isBlocked == true})
  if (firstBlocked.sensor == 'A') {
    occupationCount += 1
    occupationHistory.push({timestamp: new Date().getTime(), action: 'entrada'})
    console.log("Cliente entrou. Total:", occupationCount)
  } else if (firstBlocked.sensor == 'B') {
    occupationCount -= 1
    occupationHistory.push({timestamp: new Date().getTime(), action: 'saida'})
    console.log("Cliente saiu. Total:", occupationCount)
  }
	//rootRef.child('visits').set({"action":occupationHistory.action, "date":occupationHistory.timestamp});
	var last = occupationHistory.pop()
	rootRef.child('visits').push(last);
}

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
    // init sensor value
	var value = sensorA.value
    if (lastRegisteredA === undefined) return lastRegisteredA = value
    if (isBlocked({current: value, sensorCode: 'A'})) {
      // console.log("Entrada bloqueada")
      registerChange({
        sensor: 'A',
        isBlocked: true
      })
    } else {
      // console.log("Entrada desbloqueada")
      registerChange({
        sensor: 'A',
        isBlocked: false
      })
    }
    lastRegisteredA = value
  })

  sensorB.on("change", function() {
	var value = sensorB.value
    // init sensor value
    if (lastRegisteredB === undefined) return lastRegisteredB = value
    if (isBlocked({current: value, sensorCode: 'B'})) {
      // console.log("Saída bloqueada")
      registerChange({
        sensor: 'B',
        isBlocked: true
      })
    } else {
      // console.log("Saída desbloqueada")
      registerChange({
        sensor: 'B',
        isBlocked: false
      })
    }
    lastRegisteredB = value
  })
});
