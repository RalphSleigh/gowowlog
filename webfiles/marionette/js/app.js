	//This represents a massive hack to connect my backend websocket to a restful request sent by Marionette
	Backbone.sync = function(method, model, options) { 
		console.log(arguments);
		//Get stuff from the server via the websocket.. lawl..
		switch (model.url) {
			case "encounters":
				socket.send({"request":"encounters"},options);
				break;
			case "spells":
				//else app.ts.send({"request":"unitSpells","unitid":unitid,"encounter":app.e.c.StartTime});
				unitID =  model.player.get("ID");
				encounter = app.state.get("CurrentEncounter").get("StartTime");
				socket.send({"request":"unitSpells","unitid":unitID,"encounter":encounter},options);
				break;
		}
		
	};
	
//Lets insert some WOW infomation

var WOW = {};
WOW.cs = {"0":{"Display":"Creature","CSSClass":"c"},"1":{"Display":"Death Knight","CSSClass":"deathknight"},"2":{"Display":"Druid","CSSClass":"druid"},"3":{"Display":"Hunter","CSSClass":"hunter"},"4":{"Display":"Mage","CSSClass":"mage"},"5":{"Display":"Monk","CSSClass":"monk"},"6":{"Display":"Paladin","CSSClass":"paladin"},"7":{"Display":"Priest","CSSClass":"priest"},"8":{"Display":"Rogue","CSSClass":"rogue"},"9":{"Display":"Shamen","CSSClass":"shamen"},"10":{"Display":"Warlock","CSSClass":"warlock"},"11":{"Display":"Warrior","CSSClass":"warrior"}};
/* futher number format hacks */

var sigFmt = function(num) {
  if (num < 1000) return num;
  var r = Math.ceil(Math.log(num) / Math.LN10) % 3;
  return numeral(num).format(r == 0 ? "0a" : r == 1 ? "0.00a" : "0.0a");
};



/* define the application */
var app = new Backbone.Marionette.Application();

/* add the main region to the application */
app.addRegions({
	mainRegion: '#container'
});

/* define the module we will be using to create this app */
app.module('Main',function(module, App, Backbone, Marionette, $, _){
	
	var EncounterView = Backbone.Marionette.SelectableList.ItemView.extend({
		template:"#template-encounter-item",
		tagName:'li',
		events: {
			'click':'clicked'
		},
		clicked: function(e) {
			
			//this.model.trigger("selected")
			console.log(this,e);
			app.state.set("CurrentEncounter", this.model);
			//text nodes in jQuery!! suck hax!;
			$('#encounterList > li.dropdown > a').contents().first().replaceWith(this.model.get("Name"));
		},
		
		});
	
	
	var EncountersView = Backbone.Marionette.SelectableList.CompositeView.extend({
		initialize: function(){ 
			//this.setElement($("#encounterList")[0]);
			
			},
		tagName:'li',
		className:'dropdown',
		childView: EncounterView,
		itemView: EncounterView,
		template: '#template-encounter-list',
		childViewContainer: 'ul',
		//initalize: function() {
		//	this.once("render",this.clickFirst);// will this work?
		//}
		clickfirst: function(e) {
			if(this.children.length > 0) {
				var first = this.children.findByIndex(0);
				app.state.set("CurrentEncounter", first.model);
				$('#encounterList > li.dropdown > a').contents().first().replaceWith(first.model.get("Name"));
			}
		}
	});	
		
	var MainLayout = Backbone.Marionette.LayoutView.extend({
		template: "#template-main-layout",
		regions: {
			menu: "#encounterList",
			content: "#content"
			},		
		});
	
	/* add initializer, which fires when the app starts */
	module.addInitializer(function(){
		module.vent = _.extend({}, Backbone.Events);
		module.layout = new MainLayout();
		app.mainRegion.show(module.layout);
		module.ec = new Models.EncounterCollection();
		module.ev = new EncountersView({collection:module.ec});
		
		module.ev.once("add:child", module.ev.clickfirst);
	
		module.ec.fetch();
		
		module.layout.menu.show(module.ev);
		//module.ev.render();
	});
});

app.module('Damage',function(module, App, Backbone, Marionette, $, _){

	var currentPlayer;

	var DamageLayout = Backbone.Marionette.LayoutView.extend({
		template: "#template-main-damage",
		regions: {
			playerTable: "#damagePlayerTable",
			spellTable: "#damageSpellTable"
			},
		className:"tab-content"
		});
	
	var DamagePlayerView = Backbone.Marionette.ItemView.extend({
		template:"#template-damage-player-item",
		tagName:'tr',
		events: {
			'click':'clicked'
		},
		clicked: function(e) {
			
			coll = this.model.get('Spells');
			coll.fetch();
			app.state.set("CurrentPlayer", this.model);
			var sv = new DamageSpellsView({collection:coll});
			//sv.on("all",function(e) {console.log(e)});
			module.layout.spellTable.show(sv);
			//module.sv.collection.reset();
		},
		});
	
	var DamagePlayersView = Backbone.Marionette.CompositeView.extend({

		childView: DamagePlayerView,
		template: '#template-damage-player-list',
		childViewContainer: 'tbody',
		id:"dpsTable",
		updateTable:function() {
			this.collection.reset(app.state.get('CurrentEncounter').get('PlayerDPS').models);
		}
	});	
	
	var DamageSpellView = Backbone.Marionette.ItemView.extend({
		template:"#template-damage-spell-item",
		tagName:'tr',
		templateHelpers: function() {
			return {
				schoolBG: function () {
					//MASSIVE BITMASK TO CSS GRADIENT HACK INC  
					//background: linear-gradient(to right,  #ff80ff 0%,#ff8000 100%);
					var colours = ["#FFFF00","#FFE680","#FF8000","#4DFF4D","#80FFFF","#8080FF","#FF80FF"];
					var needed = [];
					var j = 1;
					for(i = 0; i < 8; i++) {
						if(this.School & j)needed.push(colours[i]);
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
				}
			}
		});
	
	var DamageSpellsView = Backbone.Marionette.CompositeView.extend({

		childView: DamageSpellView,
		template: '#template-damage-spell-list',
		childViewContainer: 'tbody',
		id:"spellTable"
	});	

	module.addInitializer(function(){
		module.layout = new DamageLayout();
		//var collection = app.state.get('CurrentEncounter').get('PlayerDPS');
		
		module.pv = new DamagePlayersView({collection:new Models.PlayerCollection()});
		module.pv.listenTo(app.state,'change',module.pv.updateTable);
		
		app.getRegion('mainRegion').currentView.content.show(module.layout);
		module.layout.playerTable.show(module.pv);
		
	});
});

/* when the DOM for this page is available, start the application */
$(document).ready(function() {
	app.state = new Models.State(); //is this a hack? probably.
	Backbone.history.start();
	app.start();
});
 