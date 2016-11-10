var express = require('express')
var firebase = require("firebase")
var router = express()

var config = {
  apiKey: "AIzaSyBCx4bleuLaldYVBQKYDMzhaHKO_oH7mpo",
  authDomain: "controle-passagem.firebaseapp.com",
  databaseURL: "https://controle-passagem.firebaseio.com",
  storageBucket: "controle-passagem.appspot.com",
  messagingSenderId: "765977607765"
};

firebase.initializeApp(config)
var rootRef = firebase.database().ref()


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
			visits = visits.filter(function(el){return el})

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
			var slotSize = (1 *60 * 1000) // 1 minute
			var slotsCount = rangeSize / slotSize
			var roundedSlots = parseInt(slotsCount)
			var slots = []
			for(var i = 1; i <= roundedSlots; i++) {
				var slot = Object.assign({}, slotMock)
				var events = []
				slot.events = events
				slot.start = (i == 1 ? startAtTimestamp : startAtTimestamp + (i * slotSize) + 1 )
				slot.end = (i == roundedSlots ? endAtTimestamp : slot.start + slotSize )
				slot.id = slot.start+'-'+slot.end
				//console.log('slot========',slot)
				slots.push(slot)
			}

			visits.forEach(function(visit, idx) {
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
