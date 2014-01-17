/*
 *  jQuery Week Planner - v0.1
 *  Display a full week as a table and allow to add reserved time on it.
 *  http://www.esl-education.org
 *
 *  Made by Luca Pillonel - ESL Education
 *  Under MIT License
 */

;(function ($, window, document, undefined) {

		"use strict";

		// Create the defaults once
		var pluginName = "weekPlanner",
			defaults = {
				weekDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
				timeSlotsPerHour : 2,
				slotHeight : 15,
				minimumDurationInSlot : 4,
				startHour : 7,
				endHour : 20,
				columnsHeaderHeight : 30,
				preventOverlapping : true,
				slots : []
			};

		// The actual plugin constructor
		function Plugin (element, options) {

			this.element = element;
			this.settings = $.extend({}, defaults, options);
			this._defaults = defaults;
			this._name = pluginName;
			
			// Internal vars
			this.columnsWrapper = null;
			this.drawingSlot = null;
			this.slots = {};

			// Start plugin
			this.init();
		}

		Plugin.prototype = {

			init : function () {
				// Create element structure
				this.createDOMStructure();

				// Populate existings slots
				this.setSlots();

				// Set zone creation events
				this.setEvents();
			},

			createDOMStructure : function(){
				var totalSlots = (this.settings.endHour - this.settings.startHour) * this.settings.timeSlotsPerHour + 1;

				// Create wrapper for columns
				this.columnsWrapper = $('<div class="week-planner-columns-wrapper"><div class="week-planner-slots-header" /></div>')
					.appendTo(this.element)
					.css({ height : (totalSlots-1) * this.settings.slotHeight + this.settings.columnsHeaderHeight + 'px'});

				// Create wrapper for slots
				var slotsWrapper = $('<div class="week-planner-grid-wrapper"></div>').appendTo(this.element);
				var columnsHeader = $('<div class="week-planner-slot-header"><div /></div>').appendTo(slotsWrapper);

				// Create time slot in background
				var line = $('<div class="week-planner-grid-line" />').css({height : this.settings.slotHeight});
				for (var i = 0; i < totalSlots-1; i++) {
					var iLine = line.clone().appendTo(slotsWrapper);
					if(i%this.settings.timeSlotsPerHour == 0) {
						iLine.addClass('hour');
						$('<span>'+(this.settings.startHour + i/this.settings.timeSlotsPerHour)+':00</span>').appendTo(iLine);
					}
				};
				
				// Create column for each
				for(var i = 1; i <= this.settings.weekDays.length; i++) {
					$('<div class="day-name">'+this.settings.weekDays[i-1]+'</div>').appendTo(columnsHeader);
					var column = $('<div class="week-planner-column-day day-'+i+'" />').data('day', i).appendTo(this.columnsWrapper);
				}
			},

			setEvents : function(){
				this.columnsWrapper
					.bind('mousedown', function(e){
						
						var $target = $(e.target),
							posY = e.originalEvent.layerY - this.settings.columnsHeaderHeight;

						if(posY > 0 && $target.hasClass('week-planner-column-day')) {
							// Determine closest Y value snaped to grid
							posY -= posY%this.settings.slotHeight;

							// Create slot
							this.drawingSlot = this.createSlot(posY + this.settings.columnsHeaderHeight, this.settings.slotHeight * this.settings.minimumDurationInSlot, $target.data('day')).addClass("drawing").appendTo($target);

							// Detect overlapping
							this.detectOverlapping();

							// Update info display
							this.updateInfo();
						}						
					}.bind(this))
					.bind('mousemove', function(e){
						if(this.drawingSlot) {
							// Get position relative to current slot
							var posY = e.pageY - this.drawingSlot.offset().top;

							// Snap posY to grid
							posY += (this.settings.slotHeight / 2) - posY%this.settings.slotHeight < 0 ? (this.settings.slotHeight / 2) - Math.abs((this.settings.slotHeight / 2) - posY%this.settings.slotHeight) : ((this.settings.slotHeight / 2) - Math.abs((this.settings.slotHeight / 2) - posY%this.settings.slotHeight)) * -1;
							var height = posY;
							
							// fix min height
							if(height / this.settings.slotHeight < this.settings.minimumDurationInSlot) height = this.settings.slotHeight * this.settings.minimumDurationInSlot;
						
							// Draw corrected height
							this.drawingSlot.css({ height : height});

							// Detect overlapping
							this.detectOverlapping();

							// Update info display
							this.updateInfo();
						}
					}.bind(this))
					.bind('mouseup', function(e){
						if(this.drawingSlot) {
							if( ! this.drawingSlot.hasClass('overlapping') || ! this.settings.preventOverlapping) {
								
								// Get time values
								var time = this.getTimeForSlot();
								time.slot = this.drawingSlot;

								// Save values somewhere
								this.slots[this.drawingSlot.data('day')] = this.slots[this.drawingSlot.data('day')] || [];
								var pos = this.slots[this.drawingSlot.data('day')].push(time) - 1;

								// Save a reference in slot itself
								this.drawingSlot.data('slotPos', pos);

								// Enable controls
								this.setControls();

								// Enable events
								this.drawingSlot.removeClass('drawing');
							} else {
								this.drawingSlot.remove();
								this.drawingSlot = null;
							}

							// Clear temp element
							this.drawingSlot = null;
						}
					}.bind(this))
					.bind('mouseleave', function(e){
						if(this.drawingSlot) {
							this.drawingSlot.remove();
							this.drawingSlot = null;
						}
					}.bind(this));
			},


			updateInfo : function(slot){
				slot = slot || this.drawingSlot;

				// Get time
				var time = this.getTimeForSlot(slot),
					timeEnd = time.start + time.duration;

				// Update display
				$('.slot-info', slot).html((Math.floor(time.start / 60) < 10 ? '0':'')+Math.floor(time.start / 60)+'h'+(time.start%60 < 10 ? '0':'')+time.start%60+' - '+(Math.floor(timeEnd / 60) < 10 ? '0':'')+Math.floor(timeEnd / 60)+'h'+(timeEnd%60 < 10 ? '0':'')+timeEnd%60);
			},

			setControls : function(slot){
				slot = slot || this.drawingSlot;

				// Add controls
				var controls = $('<div class="controls"></div>').appendTo(slot),
					close = $('<i class="icon-remove-sign" />').appendTo(controls);

				close.bind('click', function(){
					// Get day
					var day = slot.data('day'),
						id = null;

					// Look for slot id in slots list
					var id = $.map(this.slots[day], function(otherSlot, i){
						if(otherSlot.slot[0] == slot[0])
							return id = i;
					}.bind(this))[0];

					// Remove slot
					this.slots[day].splice(id, 1);
					slot.remove();		

					$.each(this.slots[day], function(i, otherSlot){
						this.detectOverlapping(otherSlot.slot);
					}.bind(this));
				}.bind(this));
			},

			getTimeForSlot : function(slot) {
				slot = slot || this.drawingSlot;

				// Get values from dimension :)
				return {
					start : parseInt((this.settings.startHour * 60) + (slot.position().top - this.settings.columnsHeaderHeight) / this.settings.slotHeight * (60 / this.settings.timeSlotsPerHour)),
					duration : slot.outerHeight() / this.settings.slotHeight * (60 / this.settings.timeSlotsPerHour)
				}
			},

			detectOverlapping : function(slot){
				slot = slot || this.drawingSlot;

				// Get time for slot
				var time = this.getTimeForSlot(slot),
					timeEnd = time.start + time.duration,
					overlapping = false;

				// Overlap an other slot
				if(this.slots[slot.data('day')]) {
					// Look for each slots of same day
					$.each(this.slots[slot.data('day')], function(i, otherSlot){

						if(slot[0] == otherSlot.slot[0] && this.slots[slot.data('day')].length == 1) {
							slot.removeClass('overlapped');
						} else if(slot[0] != otherSlot.slot[0]) {
							var slotEnd = otherSlot.start + otherSlot.duration;

							// Beginning  or ending is overlapping
							if(time.start >= otherSlot.start && time.start < slotEnd || timeEnd > otherSlot.start && timeEnd <= slotEnd || time.start <= otherSlot.start && timeEnd >= slotEnd) {
								overlapping = true;
								! this.settings.preventOverlapping && otherSlot.slot.addClass('overlapped');
							} else {
								otherSlot.slot.removeClass('overlapped');
							}
						}
					}.bind(this));
				}

				// Overlap end of period
				if(timeEnd > this.settings.endHour * 60) {
					overlapping = true;
				}

				if(overlapping) {
					if(this.settings.preventOverlapping) {
						slot.addClass('overlapping').removeClass('overlapper');
					} else {
						slot.addClass('overlapper').removeClass('overlapping');
					}
				} else {
					slot.removeClass('overlapping').removeClass('overlapper');
				}

				return overlapping;
			},

			createSlot : function(top, height, day){
				return $('<div class="slot"><div class="filler" /><div class="slot-info"></div></zone>').data('day', day).css({
					top : top,
					height : height
				});
			},

			createSlotWithParam : function(params){
				// Calculate start in minutes
				var start = parseInt(params.start.split(':')[0]*60)+parseInt(params.start.split(':')[1]);

				// Get right column
				var column = $('.day-'+params.day, this.element);

				// Determine elements size from time
				var top = (start / 60 - this.settings.startHour) * (this.settings.timeSlotsPerHour * this.settings.slotHeight) + this.settings.columnsHeaderHeight,
					height =  params.duration * this.settings.timeSlotsPerHour * this.settings.slotHeight / 60;

				// Create a new element with right size
				var slot = this.createSlot(top, height, params.day).appendTo(column);

				// Update info display
				this.updateInfo(slot);

				// Get time values
				var time = {
					start : start,
					duration : params.duration,
					slot : slot
				}

				// Save values somewhere
				this.slots[params.day] = this.slots[params.day] || [];
				var pos = this.slots[params.day].push(time) - 1;

				// Save a reference in slot itself
				slot.data('slotPos', pos);

				// Enable controls
				this.setControls(slot);
			},

			// Public method as specified below
			setSlots : function(slots, groupedByDay){
				slots = slots || this.settings.slots;

				if(groupedByDay === true) {
					$.each(slots, function(i, day){
						$.each(day.periods, function(j, period){
							this.createSlotWithParam({
								start : period.hour,
								duration : period.duration,
								day : day.weekday.id
							});
						}.bind(this));
					}.bind(this));
				} else {
					$.each(slots, function(i, slot){
						this.createSlotWithParam(slot);
					}.bind(this));
				}
			},

			// Public method as specified below
			getSlots : function(){
				// Clean slots
				var slots = {};

				$.each(this.slots, function(key, day){
					slots[key] = {
						weekday : {
							id : key
						},
						periods : []
					};

					$.each(day, function(i, slot){
						slots[key].periods.push({
							hour : (Math.floor(slot.start / 60) < 10 ? '0'+Math.floor(slot.start / 60) : Math.floor(slot.start / 60))+':'+(slot.start%60 < 10 ? '0'+slot.start%60 : slot.start%60),
							duration : slot.duration
						});
					});
				});

				return slots;
			}
		};

		// Set a list of public methods
		var public_methods = ['setSlots', 'getSlots'];

		// Lightweight plugin wrapper preventing multiple instantiations
		$.fn[pluginName] = function(methodOrOptions, options, extraoptions){
			if (public_methods.indexOf(methodOrOptions) > -1){
				return this.first().data("plugin_" + pluginName)[methodOrOptions](options, extraoptions);
			} else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {
				// Default to "init"
				return this.each(function() {
					if ( ! $.data(this, "plugin_" + pluginName)) {
						$.data(this, "plugin_" + pluginName, new Plugin(this, methodOrOptions));
					}
				});
			} else {
				//$.error( 'Method ' +  methodOrOptions + ' does not exist on jQuery.tooltip' );
			}
		};
})(jQuery, window, document);
