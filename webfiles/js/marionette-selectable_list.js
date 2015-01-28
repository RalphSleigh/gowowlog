// Copyright (c)2013 Markus Seeger, MESO WebScapes
// Distributed under MIT license
// http://github.com/codegourmet/marionette-selectable_list.git

/**
 * derive your Composite/Item View pair from these views to get views with selectable
 * functionality.
 *
 * default configuration:
 *
 * when an item in the collection is clicked, it's view's css class will be set to 'selected'
 * and the CompositeView will trigger "selectable:selected".
 *
 *
 * optional customization:
 *
 * SelectableList.CompositeView:
 *   itemView: your own ItemView, derived from SelectableList.ItemView
 *   eventPrefix: the prefix of the "selected" event. default: "selectable",
 *                resulting in "selectable:select"
 *
 * SelectableList.ItemView:
 *   selectable: the css selector denoting an element inside the item view to monitor for a click,
 *                and to set the selectedCssClass. default: ".item"
 *   selectedCssClass: the css class that is set on the selectable when an item is selected.
 *                     default: "selected"
 *   isSelected: set this to true if you want to preselect an item.
 *   selectionMethod: define this method if you want to do something else when an item is selected.
 *                    default: set css class.
 *
 **/
Backbone.Marionette.SelectableList = {};


Backbone.Marionette.SelectableList.CompositeView = Backbone.Marionette.CompositeView.extend({

	defaults: {
		itemView: Backbone.Marionette.SelectableList.ItemView,
		eventPrefix: 'selectable'
	},

	events: {
		"selectable:_internal_trigger_select": "onItemSelect"
	},


	constructor: function (args) {
		_.defaults(this, this.defaults);

		var args = Array.prototype.slice.apply(arguments);
		Backbone.Marionette.CompositeView.prototype.constructor.apply(this, args);

		this.listenTo(this, "itemview:selectable:_internal_trigger_select", this.onItemSelect);
	},


	/** selects the specified item, deselects all other items, triggers event globally */
	onItemSelect: function (itemView) {
		this.selectItem(itemView);
		this.trigger(this.eventPrefix + ':' + 'selected', itemView);
	},


	/** tells one item to highlight. deselects all other items. */
	selectItem: function (itemView) {
		this.children.each(function (view) {
			view.setSelected((view == itemView));
		});
	},


	selectByIndex: function (index) {
		var childArray = _.toArray(this.children);
		var child = _.sortBy(childArray, 'cid')[index];
		this.onItemSelect(child);
	},


	selectByModel: function (model) {
		this.children.each(function (childView) {
			if (childView.model == model) {
				this.onItemSelect(childView);
			}
		}, this);
	},

	// TODO: doc
	getSelectedViews: function () {
		return this.children.filter(function (childView) {
			return childView.isSelected;
		});
	},


	// TODO: doc
	getSelectedModels: function () {
		return this.getSelectedViews().map(function (childView) {
			return childView.model;
		});
	}
});



Backbone.Marionette.SelectableList.ItemView = Backbone.Marionette.ItemView.extend({

	defaults: {
		selectable: ".item",
		selectedCssClass: "selected",
		isSelected: false
	},

	events: function () {
		events = {}
		events["click " + this.selectable] = "onSelectableClick";
		return events;
	},


	constructor: function () {
		var args = Array.prototype.slice.apply(arguments);
		Backbone.Marionette.ItemView.prototype.constructor.apply(this, args);

		this.defaults.selectionMethod = this.setCssClass
		_.defaults(this, this.defaults);
	},


	onSelectableClick: function () {
		if (!this.isSelected) {
			// just delegate to parent, who will refresh all item states
			this.trigger("selectable:_internal_trigger_select");
		}
	},


	render: function () {
		var args = Array.prototype.slice.apply(arguments);
		Backbone.Marionette.ItemView.prototype.render.apply(this, args);

		this.setSelected(this.isSelected);
	},


	setSelected: function (selectionState) {
		this.isSelected = selectionState;
		this.selectionMethod.apply(this, [selectionState]);
	},


	setCssClass: function (selectionState) {
		if (selectionState) {
			this.$el.addClass(this.selectedCssClass);
		} else {
			this.$el.removeClass(this.selectedCssClass);
		}
	}
});
