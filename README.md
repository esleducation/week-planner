week-planner
============
![screenshot](http://s22.postimg.org/4njnwteoh/week_planner.png "Week Planner")

JQuery tool to define time ranges (i.e. to set opening hours)


### Requirement
As week-planner use flexbox, it only works on modern browser and Explorer versions greater than 8.

### Installation
First you need to link js and css files into your page.

	<head>
		...
		<link type="text/css" rel="stylesheet" href="jquery.week-planner.css" />
		<script type="text/javascript" src="jquery.week-planner.js"></script>
		...
	</head>

Then you can initialize a week planner on an element with

	// Instantiate weekplanner plugin
	$('[data-week-planner]').weekPlanner();

### Settings
You can set some parameter on initialization : 

	weekDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	timeSlotsPerHour : 2,       // Define the granularity (here half an hour)
	slotHeight : 15,            // Height of a slot in pixel 
	minimumDurationInSlot : 4,  // Minimum length of a period (here two hours)
	startHour : 7,              // Start hour
	endHour : 20,               // End hour
	columnsHeaderHeight : 30,   // Height of the header
	preventOverlapping : true,  // Prevent overlapping perdiods
	slots : []                  // Slots defined at start

Slots are formatted as : 

	{
		"batch_1": {
			"periods": [{
				"duration": 540,
				"hour": "09:00",
			}],
			"weekday": {
				"id": 1
			}
		},
		"batch_2": {
			"periods": [{
				"duration": 540,
				"hour": "09:00",
			}],
			"weekday": {
				"id": 2
			}
		}
	}

### Set and retrieve slots at runtime
There is two methods getSlots and setSlots wich allow you to set and especially retrieve defined slots.
You use them as following

	$('[data-week-planner]').weekPlanner('getSlots')

and

	$('[data-week-planner]').weekPlanner('setSlots', slotsObject)