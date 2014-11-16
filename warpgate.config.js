var config = {
	color: {															// the following values determine the color scheme for any interface:
		defaultParams: Color.hsv(0,1,0.86),								// default color saturation and value, HSV color value (0..360, 0..1, 0..1)
		predefinedHues: [213,30,130,280,190,60,360],					// arbitrary number of predefined colors as hue [0..360, 0..360, ...]
		prngSeed: 65,													// color PRNG seed
		hueChangeMin: 60,												// minimum color change per PRNG round (hue)
		hueChangeMax: 140,												// maximum color change per PRNG round (hue)
		altOffsetParams: Color.hsv(0,0,-0.2),							// HSV color offset for the alternative color, used for class visualization
		ceilOffsetParams: Color.hsv(0,-0.6,0.14)						// HSV color offset for the ceil color, used to visualize ceil usage on HTB classes
	},
	load: {
		initDelay: 200,													// delay before loading the interface list
		updateInterval: 1000,											// interval to fetch new data from the server
		animationEasingFunction : "easeOutQuad",						// jQuery easing function for the load animation
		animationColor: Color.hsv(0,0,0.2),								// HSV color for the load animation bars
		animationBarCount: 5, 											
		missingUpdateAnimationDelay: 3000								// time that has to pass until the load animation is shown again (when the server doesn't reply anymore)
	},
	particle: {
		progressDurationMin: 1500,										// minimum particle travel time in milliseconds
		progressDurationMax: 2300,										// maximum particle travel time in milliseconds
		progressEasingFunction: "linear",								// jQuery easing function for the particle travel
		sizeStart: 4,													// particle size at the start, in pixels
		sizeEnd: 7,														// particle size at the end of its lifetime, in pixel
		lightStart: 1,													// opacity of the particle at the start, 0..1
		lightEnd: 0.6													// opacity of the particle at the end of its lifetime, 0..1
	},
	ring: {
		backgroundColor: Color.hsv(0,0,0.2),							// background color of any ring segment
		widthMin: 15,													// minimum ring segment width in pixels
		widthMax: 30,													// maximum ring segment width in pixels
		widthStart: 30,													// innermost ring segment width in pixels
		widthChange: -2,												// width change / ring segment, from innermost to outermost ring segment, in pixels
		radiusStart: 150,												// innermost ring segment radius
		radiusChange: 50,												// radius change / ring segment, from innermost to outermost ring segment, in pixels
		particleSpawnMax: 80,											// particle spawn limit in particles/second (decrease this value to improve performance)
		usageAnimationDuration: 800,									// animation duration of ring segment usage indicators in milliseconds. should not be greater than config.load.updateInterval 
		usageAnimationEasingFunction: "easeInOutCubic",					// jQuery easing function for the usage animation
		gapShare: 0.1,													// gap share of overall ring segment angle (0..1)
		animationDuration: 1500,										// animation duration of ring expansion animations in milliseconds
		animationEasingFunction: "easeInOutCubic",						// jQuery easing function for the expansion animation
		warningAnimationInterval: 1000,									// interval in which warning outlines are drawn, in milliseconds
		warningAnimationDuration: 500,									// duration of the warning outlines during each interval, in milliseconds. should not be larger than warningAnimationInterval
		warningThreshold: 0.9,											// threshold to check against when drawing warning outlines (0..1). warnings are rendered when currentRate > maxRate * threshold 
		warningColor: Color.hsv(0,1,0.8),								// color of warning outlines
		opacityAnimationDuration: 1000,									// animation duration when blending ring segments
		opacityAnimationEasingFunction: "easeInOutCubic",				// jQuery easing function for the blend animation
		selectionColor: Color.hsv(0,0,1)								// color of the outline when the cursor is above a ring segment
	},
	window: {
		scaleMin: 0.2,													// minimum canvas scale (0..1..x)
		scaleMax: 10,													// maximum canvas scale (0..1..x)
		scaleDefault: 1,												// default canvas scale (0..1..x)
		scrollMax: 3000													// virtual length of the page, in pixels. determines how the scrollbars are displayed.
	},
	selector: {
		selectAnimationEasingFunction: "easeOutCubic",
		selectAnimationDuration: 500,									// animation duration when selecting an interface
		moveAnimationEasingFunction: "easeOutExpo",
		moveAnimationDuration: 800,										// animation duration when moving the interface list after another interface has been selected
		showAnimationEasingFunction: "easeOutCubic",
		showAnimationDuration: 1000,									// animation duration when displaying/hiding the interfaces after the cursor entered/left the area
		showAnimationDurationOffset: 100,								// delay between animating each interface in the list upon showing/hiding
		hideDelay: 2000													// delay before hiding the interface list when the cursor left the area, in milliseconds
	},
	editor: {
		opacityAnimationDuration: 800,
		opacityAnimationEasingFunction: "easeOutCubic"
	}
}