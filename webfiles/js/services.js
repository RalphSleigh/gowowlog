var dmgService = angular.module('dmgService', ['ngResource']);

dmgService.factory('Dmg', ['$resource',
  function($resource){
	  var factory = {};
	  factory.Encounters = $resource('/api/e/:e', {},{});
	  factory.Spells = $resource('/api/e/:e/p/:p/spells/', {},{});
	  factory.Auras = $resource('/api/e/:e/p/:p/auras/', {},{});
    return factory;
  }]);