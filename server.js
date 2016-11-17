var express = require('express')
var firebase = require("firebase")
var router = express()
var request = require('superagent')
var moment = require("moment")

var config = {
  apiKey: "AIzaSyBCx4bleuLaldYVBQKYDMzhaHKO_oH7mpo",
  authDomain: "controle-passagem.firebaseapp.com",
  databaseURL: "https://controle-passagem.firebaseio.com",
  storageBucket: "controle-passagem.appspot.com",
  messagingSenderId: "765977607765"
};

firebase.initializeApp(config)
var rootRef = firebase.database().ref()

router.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

router.get('/demo', function(req, res){
	var endAt = Date.now()
	var startAt = moment(endAt).subtract(60, "minutes").valueOf()   	
	request
	   .get('localhost:3001/visits-count')
	   .query({ startAt: startAt, endAt: endAt })
	   .end(function(err, response){

		var text = JSON.parse(response.text)
		var result = text.result
console.log('result', result)
		var maxVisits = 0
		var countTotal = 0
		result.summary.forEach(function(slot){
		  if (slot.totalPeopleCount > maxVisits) maxVisits = slot.totalPeopleCount
		  countTotal = countTotal + slot.occupationCount;
		})
		var chart = result.summary.map(function(slot, idx){
		    var computedHeight = (slot.totalPeopleCount * 100) / maxVisits 
		    computedHeight = computedHeight.toFixed(2) || 0
		    var time = moment(slot.end).format('LT')
		    var style = "width: 40px; display: inline-block; margin-right: 10px;"
		    return (
			'<div class="slot" style="'+style+'">'+
			    '<div class="bar" style="'+'height:'+computedHeight+'%; background-color: #6198d2;"></div>'+
			    '<div class="time" style="'+"font-size: 0.7rem;"+'">'+time+'</div>'+
			'</div>'
		    )
		})
		var barsContent = ''
		chart.forEach(function(el){barsContent+=el})
		var style = "white-space: nowrap; height: 200px; max-width: 860px; display: inline-block; background-color: #f3f2f2; padding: 20px; overflow-x: auto; overflow-y: hidden;"
		var headContent = '<head>'+
		    '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>'+
			'<script>'+
			'function load() {'+
			    'setTimeout(function(){'+
			        'location.reload()'+
			    '},30*1000)'+
		      	'}'+	
		      	'window.onload = load;'+
		'</script>'+
		'</head>'
		var htmlBody = '<html>'+headContent+'<body>Ocupação de pessoas na última hora<br><div id="chart" style="'+style+'">'+barsContent+'</div><div id="info">Pessoas dentro do ambiente:'+countTotal+'</div></body></html>'
    		res.send(htmlBody);
	   });
});


router.get('/visits-count', function(req, res){
	var startAtTimestamp = parseInt(req.query.startAt)
	var endAtTimestamp = parseInt(req.query.endAt)
	console.log(startAtTimestamp)
	console.log(endAtTimestamp)

	var onVisits = rootRef.child('visits')
		.orderByChild('timestamp')
		.startAt(startAtTimestamp)
		.endAt(endAtTimestamp)
		.once('value', function(snapshot){
			var visits = snapshot.val()
			var visitsArray = []
			if (visits) {
				Object.keys(visits).forEach(function(key, index) {
        				visitsArray.push(visits[key])
      				});
			}
			visitsArray = visitsArray.filter(function(el){return el})

			var slotMock = {
				occupationCount: 0,
				totalPeopleCount: 0,
				events: null,
				start: null,
				end: null,
				id: ""
			}
			
			var rangeSize = endAtTimestamp - startAtTimestamp
			// var slotsCount = rangeSize / (60 *60 * 1000) // 1hour
			var slotSize = (5 *60 * 1000) // 5 minute
			var slotsCount = rangeSize / slotSize
			var roundedSlots = parseInt(slotsCount)
			var slots = []
			for(var i = 1; i <= roundedSlots; i++) {
				var slot = Object.assign({}, slotMock)
				var events = []
				slot.events = events
				slot.start = (i == 1 ? startAtTimestamp : startAtTimestamp + ((i-1) * slotSize) + 1 )
				slot.end = (i == roundedSlots ? endAtTimestamp : slot.start + slotSize )
				slot.id = slot.start+'-'+slot.end
				//console.log('slot========',slot)
				slots.push(slot)
			}

			visitsArray.forEach(function(visit, idx) {
				var visitTimestamp = visit.timestamp
				var targetSlot = slots.find(function(slot){
					return (slot.start <= visitTimestamp && slot.end >= visitTimestamp)
				})
				if (targetSlot) {
					targetSlot.events.push(visit)
					if (visit.action == 'entrada') {
						targetSlot.occupationCount += 1
						targetSlot.totalPeopleCount += 1
					}
					else if (visit.action == 'saida') targetSlot.occupationCount -= 1
				}
			})

			var result = {
				slotsCount: roundedSlots,
				summary: slots
			}

			console.log('res:', roundedSlots)
			res.send({result: result})
		})
})

router.listen(3001, function(ih){
	console.log('started', ih)
});
