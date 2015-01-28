app.e = (function(){
	var module = {}
	
	var cEnc
	var encs
	
	function encounterString(e) {
		
		var start = new Date(Date.parse(e.StartTime));
		var end = new Date(Date.parse(e.EndTime));
		var duration = new Date(end - start);
		return e.Name+" ("+duration.getMinutes()+":"+duration.getSeconds()+")";
	}
	
	function getNextEncounter() {
		if(encs.length - 1 == cEnc) return cEnc
		return cEnc + 1
	}
	
	function getPrevEncounter() {
		if(cEnc == 0) return cEnc
		return cEnc - 1
	}
	
	function updateEncounterStrings() {
		$('#encounterTitle .current').text(encounterString(encs[cEnc]));
		if(getPrevEncounter() != cEnc) $('#encounterTitle .prev').text(encounterString(encs[getPrevEncounter()]));
		else $('#encounterTitle .prev').text('');
		
		if(getNextEncounter() != cEnc) $('#encounterTitle .next').text(encounterString(encs[getNextEncounter()]));
		else $('#encounterTitle .next').text('');
	
	}
	
	
	module.updateEncounters = function(data) {
	//dothings
		encs = data;
		console.log(encs);
		encs.sort(function(a,b) {
			var ad = new Date(Date.parse(a.StartTime));
			var bd = new Date(Date.parse(b.StartTime));
			return ad - bd
		});
		
		if(!cEnc) {
			cEnc = encs.length - 1;
		}
		updateEncounterStrings();
		module.c = encs[cEnc];
		if(!module.c.unitSpells)module.c.unitSpells = {}
		if(!module.c.unitAuras)module.c.unitAuras = {}
		if(!module.c.unitCasts)module.c.unitCasts = {}
		app.system.encounterChanged();
	}
	
	module.click = function() {
	
	if($(this).hasClass("prev"))cEnc = getPrevEncounter();
	if($(this).hasClass("next"))cEnc = getNextEncounter();
	
	module.c = encs[cEnc];
	if(!module.c.unitSpells)module.c.unitSpells = {}
	if(!module.c.unitAuras)module.c.unitAuras = {}
	if(!module.c.unitCasts)module.c.unitCasts = {}
	updateEncounterStrings()
	app.system.encounterChanged();
	}

	return module
})()