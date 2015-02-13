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
	  controller: 'HomeCtrl'
    })
    .state('home.encounter', {
      url: "encounter/{e:int}",
	  params: {
			e: "0",
		},
	  abstract:true,
	  templateUrl: 'partials/encounter.html'
    })

	.state('home.encounter.damage', {
        url: '/damage',

        // Note: abstract still needs a ui-view for its children to populate.
        // You can simply add it inline here.
        abstract: true,
		views: {
			"": 				{ templateUrl: 'partials/damageArea.html'},
			"controls@home": 	{templateUrl: 'partials/damageMenu.html',controller:'DamageMenu'}
	 		},
	 	resolve:{
	 		EncounterData: function($stateParams, Dmg){
	 				return Dmg.Encounters.get({e: $stateParams.e}).$promise;
	 			},
	 		}
    })

	.state('home.encounter.damage.done', {
        url: '/done/s/{s:string}/t/{t:string}/a/{a:int}',
        template:"<ui-view />",
        abstract: true,
        params: {s: "all",t:"all",a:0} 
   
    })

	.state('home.encounter.damage.done.source', {
      url: "/source",
	  views: {
		"table@home.encounter.damage":{ templateUrl: "/partials/damageSources.html",
		controller:'DamageSources' }},
	    resolve:{
	 		DamageData: function($stateParams, Dmg){
	 				return Dmg.DamageSources.query({e: $stateParams.e,s: $stateParams.s,t: $stateParams.t}).$promise;
	 			},
	 		}	  
    })

    .state('home.encounter.damage.done.target', {
      url: "/target",
	  views: {
		"spells@home.encounter.damage":{ templateUrl: "/partials/spells.html", controller:'PlayerDetails' },
		}       
    })

    .state('home.encounter.damage.done.ability', {
      url: "/ability",
	  views: {
		"spells@home.encounter.damage":{ templateUrl: "/partials/spells.html",
		controller:'PlayerDetails' }
	  },
    })

	       
	.state('home.encounter.auras', {
      url: "/auras",
	  views: {
		 "": { templateUrl: 'partials/auraArea.html'}, 
		"players@home.encounter.auras":{ templateUrl: "/partials/aurasPlayerList.html",
		controller:'AuraPlayerDetails' }
	  }
      
    })
	.state('home.encounter.auras.display', {
      url: "/player/{p:string}",
	  views: {
		"auras@home.encounter.auras":{ templateUrl: "/partials/aurasAurasList.html",
		controller:'AurasAuraDetails' }
	  },
	  params: {
			p:"0",
		},
    });

});