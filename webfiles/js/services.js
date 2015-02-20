var dmgService = angular.module('dmgService', ['ngResource']);

dmgService.factory('Dmg', ['$resource',
  function($resource){
	  var factory = {};
	  factory.Encounters = $resource('/api/e/:e', {},{list : {
      method : 'GET',
      cache : true
    }});
	  factory.Spells = $resource('/api/e/:e/p/:p/spells/', {},{list : {
      method : 'GET',
      cache : true
    }});
	  factory.Auras = $resource('/api/e/:e/p/:p/auras/', {},{list : {
      method : 'GET',
      cache : true
    }});
	  factory.DamageSources = $resource('/api/e/:e/damage/sources/:s/:t/:a', {},{list : {
      method : 'GET',
    }});
	  factory.DamageTargets = $resource('/api/e/:e/damage/targets/:s/:t/:a', {},{list : {
      method : 'GET',
    }});
	  factory.DamageAbilities = $resource('/api/e/:e/damage/abilities/:s/:t/:a', {},{list : {
      method : 'GET',
    }});

    return factory;
  }]);
  
var dmgAppState = angular.module('dmgAppState', ['ui.router']);

dmgService.factory('DmgAppState', ['$state','$stateParams',
  function($state, $stateParams){
	  //basicly this holds the app state, and updates the ui.router state as appropriate, lets not use ui-src as than can change state without us knowing.
	  //we call $state.go afterwards to propagate changes to our controllers..
	  //Mostly because our state is several orthogonal variables and not so tree-like

	  var state = {damage:{s:{Name:"Source",ID:"players"},t:{Name:"Target",ID:"hostiles"},a:{SpellID:0,BaseSpellName:"All Spells"},l:"source"}};
	  var exports = {};
		
		
		exports.setStateFromURL = function() {


				//call this on app launch to set up state from the URL.
				
				//if($state.includes('home.encounter.auras'))state.pane = "auras";
				//if($state.includes('home.encounter.damage'))state.pane = "damage";
				//if($state.includes('home.encounter.damage.spells'))state.damage.t = "spells";
				if($state.includes('home.encounter.damage.done')){
					state.damage.s.ID = $stateParams.s;
					state.damage.t.ID = $stateParams.t;
					state.damage.a.SpellID = $stateParams.a;
					if(state.damage.a.SpellID > 0)state.damage.a.BaseSpellName = state.damage.a.SpellID //we don't know the spellname as it came from URL
				}
				
				if($state.includes('home.encounter.damage.done.source'))state.damage.l = "source"
				if($state.includes('home.encounter.damage.done.target'))state.damage.l = "target"
				if($state.includes('home.encounter.damage.done.ability'))state.damage.l = "ability"

				//if($stateParams.h)state.damage.d = $stateParams.h;
				
				
				if($stateParams.e) {
					state.encounter = {ID:$stateParams.e};
				} else {
					state.encounter = {ID:0};
				}
				/*
				if($stateParams.p) {
					state.player = {ID:$stateParams.p};
				} else {
					state.player = {ID:0};
				}
				*/
		};
		
				
		exports.getState = function()  {
			return state
		};
		
		exports.setPane = function(p) {
			state.pane = p;
			if(p == "damage") {
				$state.go("home.encounter.damage.done.source",$state.params);
				
			} else if (p == "auras") {
				$state.go("home.encounter.auras.display",$state.params); 
			}
		}
		
		exports.setDamageSource = function(p) {
			if(p == "all") state.damage.s = {Name:"Source",ID:"all"};
			else if(p == "players") state.damage.s = {Name:"Players",ID:"players"};
			else if(p == "hostiles") state.damage.s = {Name:"Hostiles",ID:"hostiles"};
			else state.damage.s = p
			$state.go($state.current,{s:state.damage.s.ID});	
				
		}
		
		exports.setDamageTarget = function(p) {
			if(p == "all") state.damage.t = {Name:"Target",ID:"all"};
			else if(p == "players") state.damage.t = {Name:"Players",ID:"players"};
			else if(p == "hostiles") state.damage.t = {Name:"Hostiles",ID:"hostiles"};
			else state.damage.t = p
			$state.go($state.current,{t:state.damage.t.ID});	
				
		}

		
		exports.setDamageListBy = function(l) {
			state.damage.l = l;
			$state.go("home.encounter.damage.done."+l);
		}

		exports.setDamageAbility = function(spell) {
			//WHere to go too?
			state.damage.a = spell
			//state.damage.t = {Name:"Target",ID:"all"};
			//state.damage.s = {Name:"Source",ID:"all"};
			state.damage.l = "target"
			//$state.go("home.encounter.damage.done.target",{s:"all",t:"all",a:spell.SpellID});
			$state.go("home.encounter.damage.done.target",{a:spell.SpellID});
		}

		exports.setCurrentEncounter = function(e)  {
			if(state.encounter.Name != e.Name && state.encounter.ID != e.ID) { //reset spell on changing to a differnt boss
				$stateParams.a = 0
				state.damage.a = 0;
			}
			state.encounter = e
			if($state.current.name == "home") {
				$state.go("home.encounter.damage.done.source",{e:state.encounter.ID,s:"players"});
			} else {
				$state.go($state.current,{e:state.encounter.ID});	
			}
		};
		
    return exports;
  }]);