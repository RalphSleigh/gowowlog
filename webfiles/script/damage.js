var app = {};
 
app.system = (function(){
	var module = {}	
	

	
	function addSchoolBackground(s) {
	//MASSIVE BITMASK TO CSS GRADIENT HACK INC  
	//background: linear-gradient(to right,  #ff80ff 0%,#ff8000 100%);
		var colours = ["#FFFF00","#FFE680","#FF8000","#4DFF4D","#80FFFF","#8080FF","#FF80FF"];
		var needed = [];
		var j = 1;
		for(i = 0; i < 8; i++) {
			if(s & j)needed.push(colours[i]);
			j = j*2;
		}
		if(needed.length == 1)return "background:"+needed[0];
		var output = "background: linear-gradient(to left"
		for(k = 0;k < needed.length; k++) {
			output += ', ';
			output += needed[k];
			output += ' ';
			output += ((k * 100)/(needed.length - 1));
			output += '%';
		}
		output += ')';
		return output
	}
	
	/*
		
	function debouncer(func, timeout) {
		var timeoutID , timeout = timeout || 500;
		return function () {
			var scope = this , args = arguments;
			clearTimeout( timeoutID );
			timeoutID = setTimeout( function () {
				func.apply( scope , Array.prototype.slice.call( args ) );
			} , timeout );
		}	
	}
	
	*/
	function updateSpellTable(unitid) {
		var t = $("#spellTable table");
		var a = app.e.c.unitSpells[unitid];
		a.sort(function(a,b) {
			return (b.Damage + b.Absorb) - (a.Damage + a.Absorb);
			});
		var totalDamage = 0 
		var maxDamage = 0

		$.each(a, function(i) {
			totalDamage += (this.Damage+this.Absorb);
		});
		
		
		t.html('<thead><col><col><col><col><col><col><col><tr><th>Spell</th><th>Damage (Absorbed)</th><th>%</th><th>Casts</th><th>Hits</th><th>Ticks</th><th>Crits</th><th>Multi</th></tr></thead><tbody>')
		$.each(a, function(i) {
			maxDamage = Math.max(maxDamage,this.Damage+this.Absorb)
			var width = ((this.Damage) / maxDamage) * 70
			var percentDmg = (this.Damage + this.Absorb) * 100 / totalDamage
			var widthAbsorb = ((this.Absorb) / maxDamage) * 70
			var percentCrit = (this.Hits+this.Ticks) > 0 ? (this.Crits * 100) / (this.Hits+this.Ticks+this.Multis): 0 
			var percentMulti = (this.Hits+this.Ticks) > 0 ? (this.Multis * 100) / (this.Hits+this.Ticks) : 0
			var rowstring = '<tr><td><img src="icons?{6}" />{0}</td><td><div style="width:{1}%;{2}" class="classBar"></div><div style="width:{8}%;{2}" class="classBar"></div>{3} ({7})</td><td>{4}</td><td>{5}</td>'.format(this.SpellName, width, addSchoolBackground(this.School),this.Damage,percentDmg.toFixed(0),this.Casts,this.SpellID,this.Absorb,widthAbsorb);
			rowstring += '<td>{0}</td><td>{1}</td><td>{2}%</td><td>{3}%</td>'.format(this.Hits, this.Ticks, percentCrit.toFixed(0), percentMulti.toFixed(0));
			
			var row  = $(rowstring);
			t.append(row);
			});
		updateSpellTimeline(unitid)
	}
	
	function updateSpellTimeline(unitid) {
		var d = $("#castTimeline .fullLine");
		d.html('');
		var c = app.e.c.unitCasts[unitid];
		
		
		
		
		var totalpx = d.width() - 20;
		var fightns = app.e.c.Duration;
		var estart = new Date(Date.parse(app.e.c.StartTime));
		
		var z = $("#castTimeline .zoomInner");
		z.html('');
		var zwidth = ((fightns/1000000000) * 30) + 30;
		z.width(zwidth);
		
		for(var i = 1; i*60000000000 < fightns; i++){
		
			var pixpermin = totalpx/((fightns/1000000)/60000);
			var timeDiv = '<div class="timeMarker" style="right:{0}px;" >{1}:00</div>'.format(totalpx-(i*pixpermin),i);
			d.append(timeDiv);
		}
		
		for(var i = 1; i*10000000000 < fightns; i++){
		
			var pixpermin = 30*10;
			var timeDiv = '<div class="timeMarker" style="right:{0}px;" >{1}:{2}</div>'.format(zwidth-(i*pixpermin), Math.floor((i*10) / 60) ,((i*10) % 60));
			z.append(timeDiv);
		}
		
		$.each(c, function(i) {
			var ctime = new Date(Date.parse(this.Time));
			var fightfraction = (ctime-estart)/(fightns/1000000);
			
			var castDiv = '<div class="item" style="left:{0}px"><img src="/icons?{1}" /></div>'.format(fightfraction*totalpx,this.SpellID);
			d.append(castDiv);
			
			var zoomDiv = '<div class="item" style="left:{0}px"><img src="/icons?{1}" /></div>'.format((ctime-estart)*30/1000,this.SpellID);
			z.append(zoomDiv);
			
		
		});
		
	}
	
	module.processMessage = function(msg) {
		//lets get gnarly and extract the function out of the window object by MAGIC.
		if(msg.Action == "")return
		var part, parts = msg.Action.split('.'), methodToCall = app;
		while(part = parts.shift()){
			if(methodToCall[part]) {
				methodToCall = methodToCall[part];
			} else {
				methodToCall = false;
			}
		}
		//now call it if it all worked.
		if(methodToCall) {
			console.log('Incoming message, action: '+msg.Action);
			methodToCall(msg.Data);		
		} else {
			console.log('Incoming message, unknown action: '+msg.Action);
		}
	}
	
	module.encounterChanged = function() {
		//DO ALL THE THINGS
		module.updateDPSTable()
		module.updateAuraPlayerTable()
		//persist selection across encounteers REDO LOGIC HERE
		/*
		if(app.e.c.unitSpells[module.currentUnit]) { 
			updateSpellTable(module.currentUnit)
			$("#dpsTable table").find("[data-unitid='"+app.system.currentUnit+"']").addClass('active');
		} else  if(module.currentUnit != "" ){
			
			app.ts.send({"request":"unitSpells","unitid":module.currentUnit,"encounter":app.e.c.StartTime});
			module.currentUnit = "";
			var t = $("#spellTable table");//no joy clear the table
			t.html('<thead><col><col><col><col><col><col><col><tr><th>Spell</th><th>Damage</th><th>%</th><th>Casts</th><th>Hits</th><th>Ticks</th><th>Crits</th><th>Multi</th></tr></thead><tbody>')
		}
		*/
		var current = $("#dpsTable table").find("[data-unitid='"+app.system.currentUnit+"']")
		module.currentUnit = ""; //clear it
		if(current.length == 0) {
			var t = $("#spellTable table");
			t.html('<thead><col><col><col><col><col><col><col><tr><th>Spell</th><th>Damage</th><th>%</th><th>Casts</th><th>Hits</th><th>Ticks</th><th>Crits</th><th>Multi</th></tr></thead><tbody>');
		} else {
			current.click();
		}
		//ALL THE THINGS DONE
	}
	
	module.updateDPSTable = function() {
		var t = $("#dpsTable table")
		t.html('<thead><col><col><col><tr><th>Name</th><th>Damage</th><th>DPS</th></tr></thead><tbody>');
		app.e.c.PlayerDPS.sort(function(a,b) {
			return b.Damage - a.Damage
			});
		var maxDPS = 0	
		$.each(app.e.c.PlayerDPS, function(i) {
			maxDPS = Math.max(maxDPS,this.DPS)
			var width = (this.DPS/maxDPS) * 70
			var css = module.classStrings[this.Class].CSSClass
			var row  = $('<tr data-unitid="'+this.ID+'"><td>'+this.Name+'</td><td><div style="width:'+width+'%" class="classBar bg-'+css+'"></div>'+this.Damage+'</td><td>'+this.DPS+'</td></tr>')
			//var row  = $('<tr data-unitid="'+this.ID+'"><td>'+app.e.c.NameMap[this.ID].Name+'</td><td>'+this.Damage+' ('+this.DPS+')</td></tr>')
			t.append(row);
			});
	
	}
	
	module.unitSpellInfo = function(data) {
		
		app.e.c.unitSpells[data.Unit] = data.Spells
		app.e.c.unitCasts[data.Unit] = data.Casts
		updateSpellTable(data.Unit)
	}
	
	module.dpsMouseoverHander = function(e) {
		console.log("mouseovered");
		if(module.currentUnit != "")return;
		var unitid = $(this).data('unitid')
		if(!unitid)return
		if(app.e.c.unitSpells[unitid])updateSpellTable(unitid)
		else app.ts.send({"request":"unitSpells","unitid":unitid,"encounter":app.e.c.StartTime});
	}
	
	module.dpsMouseSelectHander = function(e) {
		console.log("clicked");
		$(this).parent().children('tr').removeClass('active')
		$(this).addClass('active')
		var unitid = $(this).data('unitid')
		if(!unitid)return
		if(module.currentUnit == unitid) {
			module.currentUnit = "";
			$(this).removeClass('active')
			return
		}
		module.currentUnit = unitid
		if(app.e.c.unitSpells[unitid])updateSpellTable(unitid)
		else app.ts.send({"request":"unitSpells","unitid":unitid,"encounter":app.e.c.StartTime});
	}
	
	module.spellMouseoverHander = function(e) {
		console.log("mouseovered spell table");
		if(module.currentUnit != "")return;
		var unitid = $(this).data('unitid')
		if(!unitid)return
		if(app.e.c.unitSpells[unitid])updateSpellTable(unitid)
		else app.ts.send({"request":"unitSpells","unitid":unitid,"encounter":app.e.c.StartTime});
	}
	
	module.updateAuraPlayerTable =  function() {
		var t = $("#auraPlayerTable table")
		t.html('<thead><col><tr><th>Name</th></tr></thead><tbody>');
		app.e.c.PlayerDPS.sort(function(a,b) {
			return b.Damage - a.Damage
			});
		//var maxDPS = 0	
		$.each(app.e.c.PlayerDPS, function(i) {
			//maxDPS = Math.max(maxDPS,this.DPS)
			//var width = (this.DPS/maxDPS) * 70
			//var css = module.classStrings[this.Class].CSSClass
			//var row  = $('<tr data-unitid="'+this.ID+'"><td>'+this.Name+'</td><td><div style="width:'+width+'%" class="classBar bg-'+css+'"></div>'+this.Damage+'</td><td>'+this.DPS+'</td></tr>')
			//var row  = $('<tr data-unitid="'+this.ID+'"><td>'+app.e.c.NameMap[this.ID].Name+'</td><td>'+this.Damage+' ('+this.DPS+')</td></tr>')
			var row = $('<tr data-unitid="{0}"><td>{1}</td></tr>'.format(this.ID,this.Name));
			t.append(row);
			});
	
	}
	
	function updateAuraTable(unitid) {
		var t = $("#auraTable table");
		var a = app.e.c.unitAuras[unitid];
		a.sort(function(a,b) {
			return (b.Uptime) - (a.Uptime);
			});
	
		
		t.html('<thead><col><col><col><tr><th>Aura</th><th>Map</th><th>Uptime</th></tr></thead><tbody>');
		
		var d = app.e.c.Duration;
		
		$.each(a, function(i) {
			var on = false;
			var bar = "";
			
			var css = module.classStrings[this.Class].CSSClass
			
			$.each(this.Events, function(j){
			
				if(!on && this.Stacks == 0) {
					bar += '<div class="bar bg-{1}" style="left:0%;right:{0}%"></div>'.format(100 - ((this.Time*100)/d),css);
				} else if(!on && this.Stacks == 1) {
					bar += '<div class="bar bg-{1}" style="left:{0}%;'.format(((this.Time*100)/d),css);
					on = true;
				} else if (on && this.Stacks == 0) {
					bar += 'right:{0}%"></div>'.format(100 - ((this.Time*100)/d));
					on = false;
				}
			});
			
			if(on)bar += 'right:0%"></div>';
		
			var rowstring = '<tr><td>{0}</td><td><div class="wrapper">{1}</div></td><td>{2}%</td>'.format(this.Name, bar, this.Uptime);		
			var row  = $(rowstring);
			t.append(row);
			});
		
	
	}
	
	module.unitAuraInfo = function(data) {
		
		app.e.c.unitAuras[data.Unit] = data.Auras
		updateAuraTable(data.Unit)
	}
	
	module.auraMouseoverHander = function(e) {
		console.log("mouseovered aura table");
		if(module.currentUnit != "")return;
		var unitid = $(this).data('unitid')
		if(!unitid)return
		if(app.e.c.unitAuras[unitid])updateAuraTable(unitid)
		else app.ts.send({"request":"unitAuras","unitid":unitid,"encounter":app.e.c.StartTime});
	}
	
	module.auraMouseSelectHander = function(e) {
		console.log("clicked");
		$(this).parent().children('tr').removeClass('active')
		$(this).addClass('active')
		var unitid = $(this).data('unitid')
		if(!unitid)return
		if(module.currentUnit == unitid) {
			module.currentUnit = "";
			$(this).removeClass('active')
			return
		}
		module.currentUnit = unitid
		if(app.e.c.unitAuras[unitid])updateAuraTable(unitid)
		else app.ts.send({"request":"unitAuras","unitid":unitid,"encounter":app.e.c.StartTime});
	}
	
	module.auraMousemove = function(e) {
	
		var d = app.e.c.Duration;
		var barLeft = e.pageX - $('#auraTable table th:nth-child(2)').offset().left;
		var total = $('#auraTable table th:nth-child(2)').width() + 10;
		
		var nanoseconds = d * barLeft / total;
		var seconds = nanoseconds/1000000000;
		$('#auraTable table th:nth-child(2)').text("Map: {0}s".format(seconds.toFixed(0)));
		
	
		var msg = "Handler for .mousemove() called at ";
		msg += e.pageX + ", " + e.pageY;
		console.log(msg);
		
		$('#auraTimeMarker').height($('#auraTable').height());
		$('#auraTimeMarker').width(e.pageX - $('#auraTable table').offset().left);
		
		
		}
	
	module.classStrings = function(data) {
	
		module.classStrings = data
	}
	
	module.timeLineMousemove = function(e) {
	
		var d = app.e.c.Duration;
		var barLeft = e.pageX - $('#castTimeline .fullLine').offset().left;
		var total = $('#castTimeline .fullLine').width();
		
		var nanoseconds = d * barLeft / total;
		var seconds = nanoseconds/1000000000;
		
		var margin = (-(seconds * 30)) + (total/2);
		$('#castTimeline .zoomInner').css("margin-left",margin+"px");
	}
	
	module.init = function(){
		
		module.currentUnit = "";
		
		
		
		app.ts.init("ws://"+window.location.hostname+":8081/websockets");
		app.ts.send({"request":"encounters"});
		app.ts.send({"request":"classStrings"});

		
		$('#encounterTitle .prev').click(app.e.click);
		$('#encounterTitle .next').click(app.e.click);
		$("#dpsTable table").on('mouseenter','tr',app.system.dpsMouseoverHander);
		$("#dpsTable table").on('click','tr',app.system.dpsMouseSelectHander);
		$("#auraPlayerTable table").on('mouseenter','tr',app.system.auraMouseoverHander);
		$("#auraPlayerTable table").on('click','tr',app.system.auraMouseSelectHander);
		$("#auraTable table").on('mousemove','td:nth-child(2)',app.system.auraMousemove);
		$("#auraTimeMarker").on('mousemove',app.system.auraMousemove);
		$("#castTimeline .fullLine").on('mousemove',app.system.timeLineMousemove);
		
		//$("#spellTable table").on('mouseenter','tr',app.system.spellMouseoverHander); //not sure why there
		eval()//HACK STOP IT EATING MY TEST FUNCTIONS IN CLOSURE 
	
	}
	return module;
}());

String.prototype.format = function () {
  var args = arguments;
  return this.replace(/\{\{|\}\}|\{(\d+)\}/g, function (m, n) {
    if (m == "{{") { return "{"; }
    if (m == "}}") { return "}"; }
    return args[n];
  });
};

$(app.system.init);