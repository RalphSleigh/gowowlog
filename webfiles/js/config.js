
var damageApp = angular.module('damageApp', ['dmgService','ui.router']);

damageApp.config(function($stateProvider, $urlRouterProvider) {
  //
  // For any unmatched url, redirect to /state1
  $urlRouterProvider.otherwise("/");
  //
  // Now set up the states
  $stateProvider
    .state('home', {
      url: "/",
      templateUrl: "partials/home.html",
	  controller: 'EncounterListCtrl'
    })
    .state('home.encounter', {
      url: "encounter/{e:int}",
	  params: {
			e: "0",
		},
	abstract:true,
	template: '<ui-view/>'
      
    })
	.state('home.encounter.damage', {
        url: '/damage',

        // Note: abstract still needs a ui-view for its children to populate.
        // You can simply add it inline here.
        
		views: {
			"": { templateUrl: 'partials/damageArea.html'},
			"players@home.encounter.damage": {templateUrl: "/partials/encounter.html",
		controller:'EncounterDetails'}
	  },
    })
	.state('home.encounter.damage.spells', {
      url: "/player/{p:string}",
	  views: {
		"spells@home.encounter.damage":{ templateUrl: "/partials/spells.html",
		controller:'PlayerDetails' }
	  },
	  params: {
			p: "0",
			e: "0",
		},
      
    })
	.state('home.encounter.auras', {
      url: "/auras",
	  views: {
		 "": { templateUrl: 'partials/auraArea.html'}, 
		"players@home.encounter.auras":{ templateUrl: "/partials/aurasPlayerList.html",
		controller:'AuraPlayerDetails' }
	  },
	  params: {
			e: "0",
		},
      
    })
	.state('home.encounter.auras.display', {
      url: "/player/{p:string}",
	  views: {
		"auras@home.encounter.auras":{ templateUrl: "/partials/aurasAurasList.html",
		controller:'AurasAuraDetails' }
	  },
	  params: {
			p:  "0",
			e: "0",
		},
      
    });
});