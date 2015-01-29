window.Models = {};

Models.Spell = Backbone.RelationalModel.extend({
	//attributeId:"SpellID"
	initialize: function() {
        //this.updateDerivedAttributes();
        this.on('add', this.updateDerivedAttributes, this);
    },
    updateDerivedAttributes: function(event) {
		//console.log(event);
        this.set({
            TotalDamage: app.state.get("CurrentPlayer").get("Damage"),
		});
	}
});

Models.SpellsCollection = Backbone.Collection.extend({
		model:Models.Spell,
		url:"spells",
		comparator: function(item) {
        return -(item.get('Damage') + item.get('Absorb')); //sort damage+absorb decending
			},
		initialize: function(){
		this.on('add', function(){ 
			//update all spells with new max damage.
			var maxUnitSpellDamage = _.max(this.models, function(m){
				return m.get("Damage") + m.get("Absorb");
				});
			var musd = maxUnitSpellDamage.get("Damage") + maxUnitSpellDamage.get("Absorb")
			_.each(this.models,function(m) {
				m.set("maxUnitSpellDamage", musd);
				});
			});
		},
	});

Models.Player = Backbone.RelationalModel.extend({
	relations: [{
		type: Backbone.HasMany,
		key: 'Spells',
		relatedModel: Models.Spell,
		collectionType: Models.SpellsCollection,
		reverseRelation: {
			key: 'player',
			//includeInJSON: 'id'
			// 'relatedModel' is automatically set to 'Zoo'; the 'relationType' to 'HasOne'.
		}
	}],
	attributeId:"ID",
	initialize: function() {
        this.updateDerivedAttributes();
        this.on('add', this.updateDerivedAttributes, this);
    },
    updateDerivedAttributes: function() {
        this.set({
            dpsPercent: this.calcWidth(),
			css: WOW.cs[this.get("Class")].CSSClass}, {silent:true});
    },
	calcWidth: function() {
	//_.max(stooges, function(stooge){ return stooge.age; });
		if(!this.collection) return 0;
		var deeps = this.collection.max(function (i){
			return i.get("Damage")
		}).get("Damage");
		return (this.get("Damage") * 100/deeps) * 0.7;
	}
	
});

Models.PlayerCollection = Backbone.Collection.extend({
		model:Models.Player,
		url:"encounters",
		comparator: function(item) {
        return -item.get('Damage'); //sort damage decending
			}
		});

Models.EncounterModel = Backbone.RelationalModel.extend({
		relations: [{
		type: Backbone.HasMany,
		key: 'PlayerDPS',
		relatedModel: Models.Player,
		collectionType: Models.PlayerCollection,
		reverseRelation: {
			key: 'encounter',
			//includeInJSON: 'id'
			// 'relatedModel' is automatically set to 'Zoo'; the 'relationType' to 'HasOne'.
		}
		}]
	});
			
Models.EncounterCollection = Backbone.Collection.extend({
		model:Models.EncounterModel,
		url:"encounters",
		
		});
		

		
Models.State = Backbone.RelationalModel.extend({
	relations: [{
		type: Backbone.HasOne,
		key: 'CurrentEncounter',
		relatedModel: Models.EncounterModel,
	},{
	
		type: Backbone.HasOne,
		key: 'CurrentPlayer',
		relatedModel: Models.Player,
	}],
});
