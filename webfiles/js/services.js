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
	  factory.DamageSources = $resource('/api/e/:e/damage/sources/:s/:t', {},{list : {
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

	  var state = {damage:{s:{Name:"Source",ID:"all"},t:{Name:"Target",ID:"all"},a:0,l:"source"}};
	  var exports = {};
		
		
		exports.setStateFromURL = function() {


				//call this on app launch to set up state from the URL.
				
				//if($state.includes('home.encounter.auras'))state.pane = "auras";
				//if($state.includes('home.encounter.damage'))state.pane = "damage";
				//if($state.includes('home.encounter.damage.spells'))state.damage.t = "spells";
				if($state.includes('home.encounter.damage.done')){
					state.damage.s.ID = $stateParams.s;
					state.damage.t.ID = $stateParams.t;
					state.damage.a = $stateParams.a;
				}
				
				
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
				$state.go("home.encounter.damage.spells",$state.params);
				
			} else if (p == "auras") {
				$state.go("home.encounter.auras.display",$state.params); 
			}
		}
		
		exports.setDamageSource = function(p) {
			if(p == "all") state.damage.s = {Name:"Source",ID:"all"};
			else state.damage.s = p
			$state.go($state.current,{s:state.damage.s.ID});	
				
		}
		
		exports.setDamageTarget = function(p) {
			if(p == "all") state.damage.t = {Name:"Target",ID:"all"};
			else state.damage.t = p
			$state.go($state.current,{t:state.damage.t.ID});	
				
		}

		
		exports.setDamageListBy = function(l) {
			state.damage.l = l;
			$state.go("home.encounter.damage.done."+l);
		}

		exports.setCurrentEncounter = function(e)  {
			state.encounter = e
			if($state.current.name == "home") {
				$state.go("home.encounter.damage.done.source",{e:state.encounter.ID});
			} else {
				$state.go($state.current,{e:state.encounter.ID});	
			}
		};
		
    return exports;
  }]);