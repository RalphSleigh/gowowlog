

damageApp.controller('HomeCtrl', ['$scope', '$state','$stateParams', '$interval', 'Dmg', 'DmgAppState', function ($scope, $state, $stateParams, $interval, Dmg, DmgAppState) {
   
   //$scope.currentEncounter = {ID:0};
   DmgAppState.setStateFromURL();//
   $scope.state =  DmgAppState.getState();
   
   $scope.automatic = true;
   //$scope.encounters = Dmg.Encounters.query()
   var refreshData = function() {
    // Assign to scope within callback to avoid data flickering on screen
		Dmg.Encounters.query({}, function(dataElements){
			//save data
			$scope.encounters = dataElements;
			
			//if we have a new encounter, navigate to it, always update currentencounter with new duration/kill infomation
			var max = $scope.state.encounter;
			var newCurrent  = $scope.state.encounter;
			angular.forEach($scope.encounters,function(value,index){
				if(value.ID > max.ID) max = value;
				if(value.ID == newCurrent.ID) newCurrent = value;
			});
			DmgAppState.setCurrentEncounter(newCurrent);
			//$scope.currentEncounter = newCurrent;
			
			if(max.ID != $scope.state.encounter.ID && $scope.automatic) {
				DmgAppState.setCurrentEncounter(max);
			} 
		});
	};
    
	refreshData();	
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
	  DmgAppState.setPane(pane);
	  /*
	  if(pane == "damage") {
			$state.go("home.encounter.damage.spells",$state.params);
	  } else if (pane == "auras") {
		 $state.go("home.encounter.auras.display",$state.params); 
	  }
		//var targetState = $state.current.name.replace($scope.pane, pane);
	  //$state.go(targetState);
	  $scope.pane=pane;
	//$state.go("home.encounter."+pane);
	*/
  };
  
   $scope.selectEncounter = function(encounter){
	  //$scope.pane=pane;
	  $scope.automatic = false;
	  DmgAppState.setCurrentEncounter(encounter);
  };
  
  $scope.orderFunction = function(e) {
		return -(e.ID);
	};
	
	eval();//haxx
}]);

damageApp.controller('DamageMenu', ['$scope', 'DmgAppState', 'EncounterData', function ($scope, DmgAppState, EncounterData) {
	$scope.state =  DmgAppState.getState(); 
    $scope.e = EncounterData;

    //lets group targets up by name
    $scope.e.targetNames = [];
    var temp = {}
	angular.forEach($scope.e.Hostiles,function(value,key){		
			temp[value.Name] ? temp[value.Name]++ : temp[value.Name] = 1;	
	});

	angular.forEach(temp,function(value,key){		
		$scope.e.targetNames.push({Name:key+" ("+value+")",ID:"name:"+key})		
	});

	$scope.sourceName = function(s) {

		var name

		angular.forEach($scope.e.PlayerDPS,function(value,key){		
			if(s.ID == value.ID)name = value.Name;
		});
		if(name) return name;
		if(s.Name)return s.Name;
		return "Hmm";
	}

	$scope.targetName = function(s) {

		
		var parts = s.ID.split(":");
		if(parts[1])return parts[1];
		if(s.Name)return s.Name;
		return "Hmm";
	}


	$scope.selectDamageSource = function(source) {
		DmgAppState.setDamageSource(source);
	};

	
	$scope.selectDamageSource = function(p){
	  DmgAppState.setDamageSource(p);
  };
  
   $scope.selectDamageTarget = function(p){
	  DmgAppState.setDamageTarget(p);
  };
  
  $scope.selectDamageListBy = function(l) {
  		DmgAppState.setDamageListBy(l);
  }

  $scope.cssClass = function(unitClass) {
	return WOW.cs[unitClass].CSSClass;
	};

}]);

/*
damageApp.controller('EncounterDetails', ['$scope', '$stateParams' ,'Dmg', 'DmgAppState', function ($scope, $stateParams, Dmg, DmgAppState) {
	

  $scope.state =  DmgAppState.getState(); 
  $scope.e = Dmg.Encounters.get({e:$scope.state.encounter.ID});
  
  $scope.orderFunction = function(e) {
   return -(e.Damage);
  };
  
  $scope.barPercent = function(damage) {
		if(!damage)return 0;
		var maxDamage = 0;
		var each = $scope.e.PlayerDPS;
		if($scope.state.damage.d == "Healing")each = $scope.e.PlayerHealing;
		angular.forEach(each,function(value,index){
			maxDamage = Math.max(maxDamage, value.Damage);
		});
		return damage * 70/maxDamage
	};
	
  $scope.cssClass = function(unitClass) {
	return WOW.cs[unitClass].CSSClass;
	};
	
  $scope.setPlayer = function(p) {
	  DmgAppState.setCurrentPlayer(p);
  }
  
  $scope.PlayerList = function() {
	  if($scope.state.damage.d == "Damage") return $scope.e.PlayerDPS;
	  if($scope.state.damage.d == "Healing") return $scope.e.PlayerHealing;
  }
	/*
  $scope.$watch('e.Name', function() { //May be a HACK
	$scope.$emit('encounterChange', $scope.e.Name,$scope.e.ID);
	});

}]);
*/

damageApp.controller('DamageSources', ['$scope', 'Dmg', 'DmgAppState', 'DamageData', function ($scope, Dmg, DmgAppState, DamageData) {
  $scope.state =  DmgAppState.getState(); 
   //var  res = r('/encounters');
  //$scope.unit = Dmg.Spells.get({e:$stateParams.e,p:$stateParams.p});
  //if($scope.state.damage.d == "damage")$scope.unit.Spells = $scope.unit.Damage;
  //if($scope.state.damage.d == "healing")$scope.unit.Spells = $scope.unit.Healing;

  $scope.units = DamageData
  
   $scope.barPercent = function(damage) {
		if(!damage)return 0;
		var maxDamage = 0;
		angular.forEach($scope.units,  function(value,index){
			maxDamage = Math.max(maxDamage, value.Damage);
		});
		return damage * 70/maxDamage
	};
	
  $scope.cssClass = function(unitClass) {
	return WOW.cs[unitClass].CSSClass;
	};
  /*
  $scope.unitDamage = function() {
		var damage = 0;
		angular.forEach($scope.unit[$scope.state.damage.d],function(value,index){
			damage += (value.Damage+value.Absorb);
		});
		return damage;
	}

  $scope.maxSpellDamage = function() {
		var damage = 0;
		angular.forEach($scope.unit[$scope.state.damage.d],function(value,index){
			damage = Math.max(value.Damage+value.Absorb,damage);
		});
		return damage;
	}
	*/
	$scope.orderFunction = function(e) {
		return -(e.Damage);
	};

}]);

damageApp.controller('DamageTargets', ['$scope', '$stateParams' ,'Dmg', 'DmgAppState', function ($scope, $stateParams, Dmg, DmgAppState) {
	
  $scope.damageTargetArray = [];
  //$scope.damageTargetUnits = {};
   //var  res = r('/encounters');
  $scope.unit = Dmg.Spells.get({e:$stateParams.e,p:$stateParams.p});
  
  $scope.$watch("unit",function(newValue, oldValue) {//lets reshape the unit data into arrays cause ng-repeat sucks at objects
		$scope.damageTargetArray = [];
		var loop = newValue.DamageTargets;
		if($scope.state.damage.d == "Healing")loop = newValue.HealingTargets;
		
		angular.forEach(loop,function(value,key){		
			value.name = key;
			value.unitsArray = [];
			//$scope.damageTargetUnits[value.name] = [];
			angular.forEach(value.Units,function(unit,key){
				value.unitsArray.push({Damage:unit,ID:key});
				
			});
		$scope.damageTargetArray.push(value);
		});
	}, true);
  
  $scope.unitDamage = function() {
		var damage = 0;
		angular.forEach($scope.unit[$scope.state.damage.d],function(value,index){
			damage += (value.Damage+value.Absorb);
		});
		return damage;
	}

  $scope.unitHighestNameDamage = function() {
		var damage = 0;
		var loop = $scope.unit.DamageTargets;
		if($scope.state.damage.d == "Healing")loop = $scope.unit.HealingTargets;
		angular.forEach(loop,function(value,index){
			damage = Math.max(value.Total,damage);
		});
		return damage;
	}
	
	$scope.orderTargetsFunction = function(e) {
		return -e;
	};
	
	$scope.cssClass = function(unitClass) {
	return WOW.cs[unitClass].CSSClass;
	};
	
}]);


damageApp.controller('AuraPlayerDetails', ['$scope', '$stateParams' ,'Dmg', 'DmgAppState', function ($scope, $stateParams, Dmg, DmgAppState) {
	
  $scope.state =  DmgAppState.getState(); 
   
  $scope.e = Dmg.Encounters.get({e:$stateParams.e});
  $scope.orderFunction = function(e) {
   return -(e.Damage);
  }
  
  $scope.cssClass = function(unitClass) {
	return WOW.cs[unitClass].CSSClass;
	}
  $scope.setPlayer = function(p) {
	  DmgAppState.setCurrentPlayer(p);
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



 
 
 
