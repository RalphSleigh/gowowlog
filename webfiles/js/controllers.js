

damageApp.controller('EncounterListCtrl', ['$scope', '$state','$stateParams', '$interval', 'Dmg', function ($scope, $state, $stateParams, $interval, Dmg) {
   
   $scope.currentEncounter = {ID:0};
   $scope.automatic = true;
   $scope.encounters = Dmg.Encounters.query()
   var refreshData = function() {
    // Assign to scope within callback to avoid data flickering on screen
		Dmg.Encounters.query({}, function(dataElements){
			//save data
			$scope.encounters = dataElements;
			
			//if we have a new encounter, navigate to it, always update currentencounter with new duration/kill infomation
			var max = $scope.currentEncounter;
			var newCurrent  = $scope.currentEncounter;
			angular.forEach($scope.encounters,function(value,index){
				if(value.ID > max.ID) max = value;
				if(value.ID == newCurrent.ID) newCurrent = value;
			});
			$scope.currentEncounter = newCurrent;
			
			if(max.ID != $scope.currentEncounter.ID && $scope.automatic) {
				if($state.current.name == "home") {
					$state.go("home.encounter."+$scope.pane,{e:max.ID});
				} else {
					$state.go($state.current,{e:max.ID});	
				}
				$scope.currentEncounter = max;
			} 
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
	  $scope.automatic = false;
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



 
 
 
