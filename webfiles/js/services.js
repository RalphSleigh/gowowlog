var dmgService = angular.module('dmgService', ['ngResource']);

dmgService.factory('Dmg', ['$resource',
  function($resource){
	  var factory = {};
	  factory.Encounters = $resource('/api/encounters/:e', {},{});
	  factory.Players = $resource('/api/players/:p', {},{});
    return factory;
  }]);