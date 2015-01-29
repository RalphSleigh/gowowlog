//this is just a small amount of static data we need in a handy place. Should modulerise but CBA...
var WOW = {};
WOW.cs = {"0":{"Display":"Creature","CSSClass":"c"},"1":{"Display":"Death Knight","CSSClass":"deathknight"},"2":{"Display":"Druid","CSSClass":"druid"},"3":{"Display":"Hunter","CSSClass":"hunter"},"4":{"Display":"Mage","CSSClass":"mage"},"5":{"Display":"Monk","CSSClass":"monk"},"6":{"Display":"Paladin","CSSClass":"paladin"},"7":{"Display":"Priest","CSSClass":"priest"},"8":{"Display":"Rogue","CSSClass":"rogue"},"9":{"Display":"Shamen","CSSClass":"shamen"},"10":{"Display":"Warlock","CSSClass":"warlock"},"11":{"Display":"Warrior","CSSClass":"warrior"}};




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
	  views: {
		"players": {templateUrl: "/partials/encounter.html",
		controller:'EncounterDetails'}
	  },
	  params: {
			e: "0",
		},
      
    })
	.state('home.encounter.spells', {
      url: "/player/{p:string}",
	  views: {
		"spells@home":{ templateUrl: "/partials/spells.html",
		controller:'PlayerDetails' }
	  },
	  params: {
			p: "0",
			e: "0",
		},
      
    });
});



damageApp.controller('EncounterListCtrl', ['$scope', '$stateParams', 'Dmg', function ($scope, $stateParams, Dmg) {
	
   //var  res = r('/encounters');
  $scope.encounters = Dmg.Encounters.query();
  $scope.eID = $stateParams.e;
  $scope.currentEncounter = "Encounter";
  
  $scope.orderFunction = function(e) {
		return -(e.ID);
	};
   
	$scope.setDropdownTitle = function(encounter) {
		$scope.currentEncounter = encounter.Name;
	}
}]);

damageApp.controller('EncounterDetails', ['$scope', '$stateParams' ,'Dmg', function ($scope, $stateParams, Dmg) {
	
   //var  res = r('/encounters');
  $scope.e = Dmg.Encounters.get({e:$stateParams.e});
  $scope.orderFunction = function(e) {
   return -(e.Damage);
  }
  $scope.barPercent = function(damage) {
		if(!damage)return 0;
		var maxDamage = 0;
		angular.forEach($scope.e.PlayerDPS,function(value,index){
			maxDamage = Math.max(maxDamage, value.Damage);
		});
		return damage * 70/maxDamage
	}
  $scope.cssClass = function(unitClass) {
	return WOW.cs[unitClass].CSSClass;
	}
}]);

damageApp.controller('PlayerDetails', ['$scope', '$stateParams' ,'Dmg', function ($scope, $stateParams, Dmg) {
	
   //var  res = r('/encounters');
  $scope.unit = Dmg.Players.get({e:$stateParams.e,p:$stateParams.p});

}]);


damageApp.filter('prettyNum', function() {               // filter is a factory function
   return function(number) { 
			if (number < 1000) return number;
			var r = Math.ceil(Math.log(number) / Math.LN10) % 3;
			return numeral(number).format(r == 0 ? "0a" : r == 1 ? "0.00a" : "0.0a");
   }
 });

