var dmgService = angular.module('dmgService', ['ngResource']);

dmgService.factory('Dmg', ['$resource',
  function($resource){
	  var factory = {};
	  factory.Encounters = $resource('/api/e/:e', {},{});
	  factory.Spells = $resource('/api/e/:e/p/:p/spells/', {},{});
	  factory.Auras = $resource('/api/e/:e/p/:p/auras/', {},{});
    return factory;
  }]);
  
var dmgAppState = angular.module('dmgAppState', ['ui.router']);

dmgService.factory('DmgAppState', ['$state','$stateParams',
  function($state, $stateParams){
	  //basicly this holds the app state, and updates the ui.router state as appropriate, lets not use ui-src as than can change state without us knowing.
	  //we call $state.go afterwards to propagate changes to our controllers..
	  //Mostly because our state is several orthogonal variables and not so tree-like
	  
	  var state = {damage:{}};
	  var exports = {};
		
		
		exports.setStateFromURL = function() {
				//call this on app launch to set up state from the URL.
				if($state.includes('home.encounter.auras'))state.pane = "auras";
				if($state.includes('home.encounter.damage'))state.pane = "damage";
				if($state.includes('home.encounter.damage.spells'))state.damage.t = "spells";
				if($state.includes('home.encounter.damage.targets'))state.damage.t = "targets";
				
				if($stateParams.h)state.damage.d = $stateParams.h;

				
				if($stateParams.e) {
					state.encounter = {ID:$stateParams.e};
				} else {
					state.encounter = {ID:0};
				}
				
				if($stateParams.p) {
					state.player = {ID:$stateParams.p};
				} else {
					state.player = {ID:0};
				}
		};
		
				
		exports.getState = function()  {
			return state
		};
		
		exports.setPane = function(p) {
			state.pane = p;
			if(p == "damage") {
				$state.go("home.encounter.damage.spells",$state.params);
				
			} else if (p == "auras") {
				$state.go("home.encounter.auras.display",$state.params); 
			}
		}
		
		exports.setDamageHealing = function(d) {
			state.damage.d = d;
			$state.go($state.current,{h:d});	
				
		}
		
		exports.setDamageSpellTarget = function(t) {
			state.damage.t = t;
			$state.go("home.encounter.damage."+t);	
				
		}
		
		exports.setCurrentEncounter = function(e)  {
			state.encounter = e
			if($state.current.name == "home") {
				$state.go("home.encounter.damage.spells",{e:state.encounter.ID});
			} else {
				$state.go($state.current,{e:state.encounter.ID});	
			}
		};
		//exports.getCurrentPlayer = function()  {
		//	return state.player
		//};
		exports.setCurrentPlayer = function(p)  {
			state.player = p
			$state.go($state.current,{p:state.player.ID});
		};
	
    return exports;
  }]);