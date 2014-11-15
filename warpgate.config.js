var config = {
	color: {
		defaultParams: Color.hsv(0,1,0.86),								// first interface color in HSV [0..360,0..1,0..1]
		predefinedHues: [213,30,130,280,190,60,360],									// arbitrary number of predefined colors as hue [0..360]
		prngSeed: 65,										// color offset per interface in hue [0..360]
		hueChangeMin: 60,
		hueChangeMax: 140,
		altOffsetParams: Color.hsv(0,0,-0.2),
		ceilOffsetParams: Color.hsv(0,-0.6,0.14)
	},
	load: {
		initDelay: 200,
		updateInterval: 1000,
		animationEasingFunction : "easeOutQuad",			// jQuery easing function
		animationColor: Color.hsv(0,0,0.2),
		animationBarCount: 5, 
		missingUpdateAnimationDelay: 3000
	},
	particle: {
		progressDurationMin: 1500,						// in seconds
		progressDurationMax: 2300,						// in seconds
		progressEasingFunction: "linear",				// jQuery easing function
		sizeStart: 4,									// in pixels
		sizeEnd: 7,							// in pixels
		lightStart: 1,
		lightEnd: 0.6
	},
	ring: {
		backgroundColor: Color.hsv(0,0,0.2),
		widthMin: 15,										// width in pixels
		widthMax: 30,										// width in pixels
		widthStart: 30,									// root ring width in pixels
		widthChange: -2,									// width change in pixels/ring
		radiusStart: 150,									// radius in pixels
		radiusChange: 50,									// radius change in pixels/ring
		particleSpawnMax: 80,								// particle spawn limit in particles/second
		usageAnimationDuration: 800,						// in seconds. should not be larger than dataUpdateInterval 
		usageAnimationEasingFunction: "easeInOutCubic",	// jQuery easing function
		gapShare: 0.1,										// gap share of overall ring segment angle (0..1)
		animationDuration: 1500,							// in seconds
		animationEasingFunction: "easeInOutCubic",			// jQuery easing function
		warningAnimationInterval: 1000,
		warningAnimationDuration: 500,
		warningThreshold: 0.9,
		warningColor: Color.hsv(0,1,0.8),
		opacityAnimationDuration: 1000,
		opacityAnimationEasingFunction: "easeInOutCubic",
		selectionColor: Color.hsv(0,0,1)
	},
	window: {
		scaleMin: 0.2,											// minimum scale (0..1..x)
		scaleMax: 10,											// maximum scale (0..1..x)
		scaleDefault: 1,										// default scale (0..1..x)
		scrollMax: 3000										// page length
	},
	selector: {
		selectAnimationEasingFunction: "easeOutCubic",
		selectAnimationDuration: 500,
		moveAnimationEasingFunction: "easeOutExpo",
		moveAnimationDuration: 800,
		showAnimationEasingFunction: "easeOutCubic",
		showAnimationDuration: 1000,
		showAnimationDurationOffset: 100,
		hideDelay: 2000
	},
	tpupdate: {
		opacityAnimationDuration: 800,
		opacityAnimationEasingFunction: "easeOutCubic"
	}
}