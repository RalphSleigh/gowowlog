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
//home.encounter.aura.display({e: e.ID, p: player.ID})


damageApp.controller('EncounterListCtrl', ['$scope', '$state','$stateParams', '$interval', 'Dmg', function ($scope, $state, $stateParams, $interval, Dmg) {
   
   
   $scope.encounters = Dmg.Encounters.query()
   var refreshData = function() {
    // Assign to scope within callback to avoid data flickering on screen
		Dmg.Encounters.query({}, function(dataElements){
			$scope.encounters = dataElements;
		});
	};

	var promise = $interval(refreshData, 5000);

	// Cancel interval on page changes
	$scope.$on('$destroy', function(){
		if (angular.isDefined(promise)) {
			$interval.cancel(promise);
			promise = undefined;
		}
	});

   
   //var  res = r('/encounters');
  //$scope.encounters = Dmg.Encounters.query();
  $scope.eID = $stateParams.e;
  
  $scope.pane="damage";
  
  $scope.selectPane = function(pane){
	  if(pane == "damage") {
			$state.go("home.encounter.damage.spells",$state.params);
	  } else if (pane == "auras") {
		 $state.go("home.encounter.auras.display",$state.params); 
	  }
		//var targetState = $state.current.name.replace($scope.pane, pane);
	  //$state.go(targetState);
	  $scope.pane=pane;
	//$state.go("home.encounter."+pane);
  };
  
   $scope.selectEncounter = function(encounter){
	  //$scope.pane=pane;
	  if($state.current.name == "home") {
		  $state.go("home.encounter."+$scope.pane,{e:encounter.ID});
		} else {
			$state.go($state.current,{e:encounter.ID});	
		}
	  
	  $scope.currentEncounter = encounter;
  };
  
  $scope.orderFunction = function(e) {
		return -(e.ID);
	};
   
	$scope.setDropdownTitle = function(encounter) {
	//	$scope.currentEncounter = encounter.Name;
	};
	/*
	$scope.$on('encounterChange', function(e,name, id){
		
		$scope.currentEncounterID = id;
	});
	*/
	eval();//haxx
}]);

damageApp.controller('EncounterDetails', ['$scope', '$stateParams' ,'Dmg', function ($scope, $stateParams, Dmg) {
	
   //var  res = r('/encounters');
   //$scope.$parent.
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
	/*
  $scope.$watch('e.Name', function() { //May be a HACK
	$scope.$emit('encounterChange', $scope.e.Name,$scope.e.ID);
	});
	*/
}]);

damageApp.controller('PlayerDetails', ['$scope', '$stateParams' ,'Dmg', function ($scope, $stateParams, Dmg) {
	
   //var  res = r('/encounters');
  $scope.unit = Dmg.Spells.get({e:$stateParams.e,p:$stateParams.p});
  
  $scope.unitDamage = function() {
		var damage = 0;
		angular.forEach($scope.unit.Spells,function(value,index){
			damage += (value.Damage+value.Absorb);
		});
		return damage;
	}

  $scope.maxSpellDamage = function() {
		var damage = 0;
		angular.forEach($scope.unit.Spells,function(value,index){
			damage = Math.max(value.Damage+value.Absorb,damage);
		});
		return damage;
	}
	
	$scope.orderFunction = function(e) {
		return -(e.Damage+e.Absorb);
	};

}]);

damageApp.controller('AuraPlayerDetails', ['$scope', '$stateParams' ,'Dmg', function ($scope, $stateParams, Dmg) {
	
   //var  res = r('/encounters');
   //$scope.$parent.
  $scope.e = Dmg.Encounters.get({e:$stateParams.e});
  $scope.orderFunction = function(e) {
   return -(e.Damage);
  }
  
  $scope.cssClass = function(unitClass) {
	return WOW.cs[unitClass].CSSClass;
	}
	/*
  $scope.$watch('e.Name', function() { //May be a HACK
	$scope.$emit('encounterChange', $scope.e.Name,$scope.e.ID);
	});
	*/
}]);
//home.encounter.aura.display({e: e.ID, p: player.ID})

damageApp.controller('AurasAuraDetails', ['$scope', '$stateParams' ,'Dmg', function ($scope, $stateParams, Dmg) {
	
   //var  res = r('/encounters');
  $scope.unit = Dmg.Auras.get({e:$stateParams.e,p:$stateParams.p});
  $scope.e = $stateParams.e
  $scope.p = $stateParams.p
  $scope.unitDamage = function() {
		var damage = 0;
		angular.forEach($scope.unit.Spells,function(value,index){
			damage += (value.Damage+value.Absorb);
		});
		return damage;
	}
	
	$scope.orderFunction = function(a) {
		return -(a.Uptime);
	};

}]);

damageApp.filter('prettyNum', function() {               // filter is a factory function
   return function(number) { 
			if (number < 1000) return numeral(number).format("00.00");
			var r = Math.ceil(Math.log(number) / Math.LN10) % 3;
			return numeral(number).format(r == 0 ? "0a" : r == 1 ? "0.00a" : "0.0a");
   }
 });
 
 damageApp.filter('minutes', function() {               // filter is a factory function
   return function(number) { 
			var d = new Date(number/1000000);
			return d.getMinutes()+':'+d.getSeconds().toPrecision(2);
   }
 });

 
 
damageApp.filter('schoolBG', function() {               // filter is a factory function
   return function(number) { 
					//MASSIVE BITMASK TO CSS GRADIENT HACK INC  
					//background: linear-gradient(to right,  #ff80ff 0%,#ff8000 100%);
					var colours = ["#FFFF00","#FFE680","#FF8000","#4DFF4D","#80FFFF","#8080FF","#FF80FF"];
					var needed = [];
					var j = 1;
					for(i = 0; i < 8; i++) {
						if(number & j)needed.push(colours[i]);
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
 });


 
 
 
