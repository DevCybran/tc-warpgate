
String.prototype.nl2br = function()
{
    return this.replace(/\n/g, "<br />");
}

function Color() {
	var self = this;
	var h=0,s=0,v=0;
	var rgbCss=null;
	
	this.getHue = function() {
		return h;
	}
	
	this.getSaturation = function() {
		return s;
	}
	
	this.getValue = function() {
		return v;
	}
	
	this.setHsv = function(_h, _s, _v) {
		h = _h;
		s = _s;
		v = _v;
		return self.addHue(0);
	}
	
	this.copy = function() {
		return Color.hsv(h,s,v);
	}
	
	this.addHue = function(hue) {
		h+= hue;
		while(h<0) h+= 360;
		while(h>360) h-= 360;
		rgbCss = null;
		return self;
	}
	
	this.addColor = function(color) {
		s+= color.getSaturation();
		v+= color.getValue();
		return self.addHue(color.getHue());
	}
	
	this.toRgbArray = function() {
		var c = v * s;
		var h1 = h / 60;
		var x = c * (1 - Math.abs((h1 % 2) - 1));
		var m = v - c;
		var rgb;
		
		if (typeof h == 'undefined') rgb = [0, 0, 0];
		else if (h1 < 1) rgb = [c, x, 0];
		else if (h1 < 2) rgb = [x, c, 0];
		else if (h1 < 3) rgb = [0, c, x];
		else if (h1 < 4) rgb = [0, x, c];
		else if (h1 < 5) rgb = [x, 0, c];
		else if (h1 <= 6) rgb = [c, 0, x];
		
		return [(255 * (rgb[0] + m))>>0, (255 * (rgb[1] + m))>>0, (255 * (rgb[2] + m)>>0)];
	}
	
	var buildRgbCss = function() {
		if(rgbCss==null) {
			var arr = self.toRgbArray();
			rgbCss = arr[0]+","+arr[1]+","+arr[2];
		}
	}
	
	this.toRgbCss = function() {
		buildRgbCss();
		return "rgb("+rgbCss+")";
	}
	
	this.toRgbaCss = function(a) {
		buildRgbCss();
		return "rgba("+rgbCss+","+a+")";
	}
}

Color.hsv = function(h,s,v) {
	return (new Color()).setHsv(h,s,v);
}

function NetworkSpeed() {
	var self=this;
	var value;

	this.getValue = function() {
		return value;
	}

	this.setValue = function(val) {
		value = val;
		return self;
	}

	this.getUnitValue = function() {
		var rate = value;
		var unit = 1;
		while(rate>=1000) {
			rate/= 1000;
			unit*= 1000;
		}
		rate = Math.round(rate*100)/100;
		return [rate,unit];
	}
	
	this.setUnitValue = function(val, unit) {
		while(unit>1) {
			unit/= 1000;
			val*= 1000;
		}
		value = val;
		return self;
	}

	this.toUnitValue = function() {
		return self.getUnitValue()[0];
	}

	this.toUnitText = function(rawUnit, factoredUnit) {
		if(!rawUnit) rawUnit = "Bit/s";
		if(!factoredUnit) factoredUnit = rawUnit;
		var united = self.getUnitValue();
		switch(united[1]) {
		case 1: return rawUnit;
		case 1000: return "K"+factoredUnit;
		case 1000000: return "M"+factoredUnit;
		case 1000000000: return "G"+factoredUnit;
		case 1000000000000: return "T"+factoredUnit;
		default: return "?"+factoredUnit;
		}
	}
	
	this.toText = function(rawUnit, factoredUnit) {
		return self.toUnitValue() + " " + self.toUnitText(rawUnit, factoredUnit);
	}

	this.getMultiplied = function(factor) {
		return NetworkSpeed.byValue(value*factor);
	}
	
}

NetworkSpeed.byValue = function(bits) {
	return (new NetworkSpeed()).setValue(bits);
}

NetworkSpeed.byUnitValue = function(speed,unit) {
	return (new NetworkSpeed()).setUnitValue(speed,unit);
}


function Warpgate() {
	var globalRenderer, detailDisplay, commentEditor;

	function Particle(ring) {
		var duration, angle, xs, ys, xe, ye, startTime;
		
		;(function() {
			var startAngle = ring.getFrameStartAngle();
			var endAngle = ring.getFrameEndAngle();
			var outerRadius = ring.getInnerRadius();
			var innerRadius = ring.getParent().getOuterRadius();
			
			duration = config.particle.progressDurationMin + (config.particle.progressDurationMax-config.particle.progressDurationMin)*Math.random();
			angle = startAngle + (endAngle-startAngle)*Math.random();
			xs = Math.cos(angle)*outerRadius + globalRenderer.getCenterX();
			ys = Math.sin(angle)*outerRadius + globalRenderer.getCenterY();
			xe = Math.cos(angle)*innerRadius + globalRenderer.getCenterX();
			ye = Math.sin(angle)*innerRadius + globalRenderer.getCenterY();
			startTime = performance.now();
		})();
		
		this.draw = function(ctx, time, timediff) {
			// progress update
			var progress = jQuery.easing[config.particle.progressEasingFunction]((time-startTime)/duration, (time-startTime), 0, 1, duration);
			if(progress>1) return true;
			
			// params
			var x = xs + (xe-xs)*progress;
			var y = ys + (ye-ys)*progress;
			var r = config.particle.sizeStart + (config.particle.sizeEnd-config.particle.sizeStart)*progress;
			var l = config.particle.lightStart + (config.particle.lightEnd-config.particle.lightStart)*progress;
			
			// fill style
			var gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
			gradient.addColorStop(0, "rgba(255,255,255,"+l+")");
			gradient.addColorStop(0.2, "rgba(255,255,255,"+l+")");
			gradient.addColorStop(0.2, ring.getInterface().getColor(0).toRgbaCss(l));
			gradient.addColorStop(1, "rgba(0,0,0,0)");
			ctx.fillStyle = gradient;
			
			// render
			ctx.beginPath();
			ctx.arc(x, y, r, Math.PI*2, false);
			ctx.fill();
			
			return false;
		}

	}

	function RingPrototype() {
		var self = this;
		var tcObject;
		var needsChildrenUpdate;
		
		this.initProto = function(itcObject) {
			needsChildrenUpdate = false;
			tcObject = itcObject;
		}
		
		this.setChildrenNeedUpdate = function() {
			needsChildrenUpdate = true;
			var children = tcObject.getChildren();
			for (var i = children.length - 1; i >= 0; i--) {
				children[i].getRing().setChildrenNeedUpdate();
			}
		}
		
		var createChildUpdateContext = function() {
			var children = tcObject.getChildren();
			var childrenCount = children.length;
			var childrenRateSum = 0;
			for(var i=0; i<children.length; i++) {
				if(children[i].isInvalid() || children[i].getRing().isHidden()) {
					childrenCount--;
				} else {
					childrenRateSum+= children[i].getSortingRate();
				}
			}
			var childrenGapAngle = childrenCount<=1 ? 0 : self.getDestAngle()*config.ring.gapShare;
			var childrenUsableAngle = self.getDestAngle() - childrenGapAngle;
			var childGapAngle = childrenCount==0 ? 0 : childrenGapAngle/childrenCount;
			return {levelRateSum: childrenRateSum, levelUsableAngle: childrenUsableAngle, gapAngle: childGapAngle, levelStartAngle: self.getDestStartAngle()};
		}
		
		var updateChildren = function(context) {
			var children = tcObject.getChildren();
			var sortedChildren = children.slice();
			sortedChildren.sort(function(a,b) {
				return a.getSortingRate() - b.getSortingRate();
			});
			
			for(var i=0; i<children.length; i++) {
				sortedChildren[i].getRing().updateRingSize(context);
			}
			
			for(var i=0; i<children.length; i++) {
				children[i].getRing().updateRingLocation(context);
			}
		}
		
		this.updateAllChildren = function() {
			var children = tcObject.getChildren();
			if(children.length > 0) {
				if(needsChildrenUpdate) {
					var context = createChildUpdateContext();
					updateChildren(context);
					needsChildrenUpdate = false;
				}
				
				for(var i=0; i<children.length; i++) {
					children[i].getRing().updateAllChildren();
				}
			}
		}

		this.overrideExpansionMode = function(mode) {
		}
	}

	function Blackhole() {
		RingPrototype.call(this);
		
		this.getWidth = function() {
			return config.ring.widthStart;
		}
		
		this.getOuterRadius = function() {
			return 0;
		}

		this.getRadiusChange = function() {
			return config.ring.radiusStart;
		}
		
		this.getFrameStartAngle = this.getDestStartAngle = function() {
			return 1.5*Math.PI;
		}
		
		this.getDestAngle = function() {
			return 2*Math.PI;
		}
	}
	Blackhole.prototype = Object.create(RingPrototype);
	Blackhole.prototype.constructor = Blackhole;

	function Ring() {
		RingPrototype.call(this);
		var self = this;
		var EXP_NORMAL=0, EXP_EXPANDED=1, EXP_HIDDEN=2, EXP_EXPANDED_HIDDEN=3, EXP_HIDDEN_PARENT=4;
		var tcObject, width, innerRadius, outerRadius;
		var destAngle, destStartAngle, destEndAngle, destOpacity;
		var lastStartAngle, lastEndAngle, lastOpacity;
		var frameCenterX, frameCenterY, frameStartAngle, frameEndAngle, frameCurrentRate, frameOpacity;
		var spawnIterator, expansionMode;
		var lastLocationUpdateTime, lastOpacityUpdateTime;
		
		this.init = function(itcObject, preRing) {
			self.initProto(itcObject);
			tcObject = itcObject;
			width = Math.max(config.ring.widthMin, Math.min(config.ring.widthMax, tcObject.getParent().getRing().getWidth()+config.ring.widthChange));
			innerRadius = tcObject.getParent().getRing().getOuterRadius() + tcObject.getParent().getRing().getRadiusChange();
			outerRadius = innerRadius + width;
			lastStartAngle = lastEndAngle = frameStartAngle = frameEndAngle = (preRing==null ? tcObject.getParent().getRing().getFrameStartAngle() : preRing.getFrameEndAngle());
			lastOpacity = frameOpacity = destOpacity = 0;
			setOpacity(1);
			spawnIterator = Math.random();
			expansionMode = EXP_NORMAL;
		}

		var setOpacity = function(opac) {
			lastOpacity = frameOpacity;
			lastOpacityUpdateTime = performance.now();
			destOpacity = opac;
		}

		this.getParent = function() {
			return tcObject.getParent().getRing();
		}

		this.getSiblings = function() {
			var siblings = [];
			var children = tcObject.getParent().getChildren();
			for (var i = children.length - 1; i >= 0; i--) {
				if(children[i]!=tcObject) siblings.push(children[i].getRing());
			};
			return siblings;
		}

		this.getInterface = function() {
			return tcObject.getInterface();
		}
		
		this.getWidth = function() {
			return width;
		}
		
		this.getInnerRadius = function() {
			return innerRadius;
		}
		
		this.getOuterRadius = function() {
			return outerRadius;
		}

		this.getRadiusChange = function() {
			return config.ring.radiusChange;
		}
		
		this.getDestAngle = function() {
			return destAngle;
		}
		
		this.getDestStartAngle = function() {
			return destStartAngle;
		}
		
		this.getFrameStartAngle = function() {
			return frameStartAngle;
		}
		
		this.getFrameEndAngle = function() {
			return frameEndAngle;
		}

		this.overrideExpansionMode = function(mode, objectToExclude, includeParents) {
			var propagate = false;
			if(mode==EXP_HIDDEN) {
				if(expansionMode==EXP_NORMAL) {
					if(includeParents) expansionMode = EXP_HIDDEN_PARENT;
					else expansionMode = EXP_HIDDEN;
					setOpacity(0);
					propagate = true;
				} else if(expansionMode==EXP_EXPANDED) {
					expansionMode = EXP_EXPANDED_HIDDEN;
					setOpacity(0);
					propagate = true;
				}
			} else if(mode==EXP_NORMAL) {
				if(expansionMode==EXP_HIDDEN || expansionMode==EXP_HIDDEN_PARENT) {
					expansionMode = EXP_NORMAL;
					setOpacity(1);
					propagate = true;
				} else if(expansionMode==EXP_EXPANDED_HIDDEN) {
					expansionMode = EXP_EXPANDED;
					setOpacity(1);
					propagate = true;
					includeParents = false;
				}
			}
			if(propagate) {
				self.getParent().setChildrenNeedUpdate();
				if(includeParents) self.getParent().overrideExpansionMode(mode,objectToExclude,true);
				var children = tcObject.getChildren();
				for (var i = 0; i < children.length; i++) {
					if(children[i]!=objectToExclude) children[i].getRing().overrideExpansionMode(mode, objectToExclude, false);
				};
			}
		}

		this.expand = function() {
			if(expansionMode==EXP_NORMAL && tcObject.getParent()!=self.getInterface().getDev()) {
				self.getParent().overrideExpansionMode(EXP_HIDDEN, tcObject, true);
				expansionMode = EXP_EXPANDED;
				self.getInterface().getDev().getRing().updateAllChildren();
			}
		}

		this.retract = function() {
			if(expansionMode==EXP_EXPANDED) {
				self.getParent().overrideExpansionMode(EXP_NORMAL, tcObject, true);
				expansionMode = EXP_NORMAL;
				self.getInterface().getDev().getRing().updateAllChildren();
			} else if(expansionMode==EXP_EXPANDED_HIDDEN) {
				expansionMode = EXP_HIDDEN_PARENT;
			}
		}

		this.isExpanded = function() {
			return expansionMode==EXP_EXPANDED || expansionMode==EXP_EXPANDED_HIDDEN;
		}

		this.isHidden = function() {
			return expansionMode==EXP_HIDDEN;
		}

		this.updateRingSize = function(context) {
			if(tcObject.isInvalid()) {
				destAngle = 0;
			} else {
				var computedAngle = context.levelUsableAngle*tcObject.getSortingRate()/context.levelRateSum;
				destAngle = /*Math.max(ringAngleMin,*/computedAngle/*)*/;
				var angleOverusage = destAngle-computedAngle;
				if(destAngle > context.levelUsableAngle) angleOverusage = context.levelUsableAngle;
				context.levelUsableAngle-= angleOverusage;
			}
		}
		
		this.updateRingLocation = function(context) {
			lastStartAngle = frameStartAngle;
			lastEndAngle = frameEndAngle;
			lastOpacity = frameOpacity;
			destStartAngle = context.levelStartAngle + context.gapAngle/2;
			if(!self.isHidden()) {
				destEndAngle = destStartAngle+destAngle;
				if(destAngle!=0) context.levelStartAngle = destEndAngle + context.gapAngle/2;
			} else {
				destEndAngle = destStartAngle;
			}
			lastLocationUpdateTime = performance.now();
		}
		
		this.prepareFrame = function(time,timediff) {
			frameCenterX = globalRenderer.getCenterX();
			frameCenterY = globalRenderer.getCenterY();

			if(time > lastOpacityUpdateTime+config.ring.opacityAnimationDuration) {
				frameOpacity = destOpacity;
			} else {
				var progress = jQuery.easing[config.ring.opacityAnimationEasingFunction]((time-lastOpacityUpdateTime)/config.ring.opacityAnimationDuration, time-lastOpacityUpdateTime, 0, 1, config.ring.opacityAnimationDuration);
				frameOpacity = lastOpacity + (1-lastOpacity)*progress;
			}
			
			if(time > lastLocationUpdateTime+config.ring.animationDuration) {
				frameStartAngle = destStartAngle;
				frameEndAngle = destEndAngle;
				if(tcObject.isInvalid()) return true;
			} else {
				var progress = jQuery.easing[config.ring.animationEasingFunction]((time-lastLocationUpdateTime)/config.ring.animationDuration, time-lastLocationUpdateTime, 0, 1, config.ring.animationDuration);
				frameStartAngle = lastStartAngle + (destStartAngle-lastStartAngle)*progress;
				frameEndAngle = lastEndAngle + (destEndAngle-lastEndAngle)*progress;
			}
			
			var lastValueUpdateTime = tcObject.getLastValueUpdateTime();
			if(time > lastValueUpdateTime+config.ring.usageAnimationDuration) {
				frameCurrentRate = tcObject.getCurrentRate();
			} else {
				var progress = jQuery.easing[config.ring.usageAnimationEasingFunction]((time-lastValueUpdateTime)/config.ring.usageAnimationDuration, time-lastValueUpdateTime, 0, 1, config.ring.usageAnimationDuration);
				frameCurrentRate = tcObject.getLastCurrentRate() + (tcObject.getCurrentRate()-tcObject.getLastCurrentRate())*progress;
			}
			
			if(!self.isHidden()) {
				spawnIterator+= (config.ring.particleSpawnMax*Math.min(1000,timediff)/1000) * Math.min(tcObject.getCurrentRate()/tcObject.getInterface().getThroughputRaw(),1) * Math.max(1/20,(frameEndAngle-frameStartAngle)/(2*Math.PI));
				while(spawnIterator > 1) {
					spawnIterator-= 1;
					tcObject.getInterfaceRenderer().getParticles().push(new Particle(self));
				}
			}
			
			return false;
		}
		
		this.drawWarning = function(ctx) {
			if(frameCurrentRate>config.ring.warningThreshold*tcObject.getCeil()) {
				ctx.strokeStyle = config.ring.warningColor.toRgbaCss(frameOpacity);
				ctx.beginPath();
				ctx.arc(frameCenterX,frameCenterY,innerRadius-1,frameEndAngle,frameStartAngle,true);
				ctx.arc(frameCenterX,frameCenterY,outerRadius+1,frameStartAngle,frameEndAngle,false);
				ctx.closePath();
				ctx.stroke();
			}
		}
		
		this.drawRing = function(ctx) {
			if(frameStartAngle==frameEndAngle) return;

			// draw normal ring
			ctx.fillStyle = config.ring.backgroundColor.toRgbaCss(frameOpacity);
			ctx.beginPath();
			ctx.arc(frameCenterX,frameCenterY,innerRadius,frameEndAngle,frameStartAngle,true);
			ctx.arc(frameCenterX,frameCenterY,outerRadius,frameStartAngle,frameEndAngle,false);
			ctx.closePath();
			ctx.fill();

			var pos = globalRenderer.getMousePos();
			if(ctx.isPointInPath(pos.x, pos.y)) {
				ctx.strokeStyle = config.ring.selectionColor.toRgbCss();
				if(globalRenderer.wasJustClicked()) {
					if(self.isExpanded()) self.retract();
					else self.expand();
				}
				detailDisplay.show(tcObject, pos);
				if(globalRenderer.wasJustDoubleClicked()) {
					tcObject.changeComment();
				}
			} else {
				ctx.strokeStyle = tcObject.getInterface().getColor(tcObject.getType()).toRgbaCss(frameOpacity);
			}
			ctx.stroke();

			// draw ring usage
			if(frameCurrentRate>0) {
				var usageEndAngle = frameStartAngle + (frameEndAngle-frameStartAngle)*Math.min(frameCurrentRate/tcObject.getRate(), 1);
				ctx.fillStyle = tcObject.getInterface().getColor(tcObject.getType()).toRgbaCss(frameOpacity);
				ctx.beginPath();
				ctx.arc(frameCenterX,frameCenterY,innerRadius,usageEndAngle,frameStartAngle,true);
				ctx.arc(frameCenterX,frameCenterY,outerRadius,frameStartAngle,usageEndAngle,false);
				ctx.closePath();
				ctx.fill();
			}

			// draw ring ceil usage
			var rate = tcObject.getRate();
			if(frameCurrentRate>rate && tcObject.hasCeil()) {
				var usageEndAngle = frameStartAngle + (frameEndAngle-frameStartAngle)*Math.min((frameCurrentRate-rate)/(tcObject.getCeil()-rate), 1);
				ctx.fillStyle = tcObject.getInterface().getColor(2).toRgbaCss(frameOpacity);
				ctx.beginPath();
				ctx.arc(frameCenterX,frameCenterY,innerRadius,usageEndAngle,frameStartAngle,true);
				ctx.arc(frameCenterX,frameCenterY,outerRadius,frameStartAngle,usageEndAngle,false);
				ctx.closePath();
				ctx.fill();
			}
		}
	}
	Ring.prototype = Object.create(RingPrototype);
	Ring.prototype.constructor = Ring;

	function TcObjectPrototype() {
		var self = this;
		var children = [];
		
		this.getChildren = function() {
			return children;
		}
			
		var insertChild = function(childClass, childType, childQdiscID, childClassID, childScheduler, index) {
			var child = new childClass();
			child.init1(self, childType, childQdiscID, childClassID, childScheduler);
			if(index==-1) {
				if(children.length==0) child.init2(null);
				else child.init2(children[children.length-1]);
				children.push(child);
			} else {
				if(index==0) child.init2(null);
				else child.init2(children[index-1]);
				children.splice(index, 0, child);
			}
			return child;
		}
		
		this.getOrCreateChild = function(childClass, childType, childQdiscID, childClassID, childScheduler) {
			for(var i=0; i<children.length; i++) {
				var child = children[i];
				if(child instanceof childClass && child.getType()==childType && child.getQdiscID()==childQdiscID && child.getClassID()==childClassID && child.getScheduler()==childScheduler) return child;
				if(child.getQdiscID() > childQdiscID || (child.getQdiscID()==childQdiscID && child.getClassID()>childClassID)) {
					return insertChild(childClass, childType, childQdiscID, childClassID, childScheduler, i);
				}
			}
			return insertChild(childClass, childType, childQdiscID, childClassID, childScheduler, -1);
		}

		this.findChild = function(childQdiscID, childClassID) {
			var result;
			for(var i=0; i<children.length; i++) {
				result = children[i].findChild(childQdiscID, childClassID);
				if(result) return result;
			}
			return null;
		}
		
		this.invalidate = function() {
			for(var i=0; i<children.length; i++) {
				children[i].invalidate();
			}
		}
	}
	
	TcObjectPrototype.getClass = function(type, scheduler) {
		if(type==1 && scheduler=="htb") {
			return HtbObject;
		} else {
			return TcObject;
		}
	}

	function DevObject(interfac) {
		TcObjectPrototype.call(this);
		var self = this;
		var ring;

		(function() {
			ring = new Blackhole();
			ring.initProto(self);
		})();
		
		this.getRing = function() {
			return ring;
		}
		
		this.getCeil = function() {
			return interfac.getThroughputRaw();
		}
		
		this.getInterface = function() {
			return interfac;
		}
		
		var _findChild = this.findChild;
		this.findChild = function(childQdiscID, childClassID) {
			if(0==childQdiscID && 0==childClassID) return self;
			return _findChild(childQdiscID, childClassID);
		}
	}
	DevObject.prototype = Object.create(TcObjectPrototype);
	DevObject.prototype.constructor = DevObject;


	function TcObject() {
		TcObjectPrototype.call(this);
		var self = this;
		var interfac, parent, type, qdiscID, classID, scheduler;
		var ring;
		var lastByteStats, lastPacketStats, currentRate, lastCurrentRate;
		var invalid, lastUpdateTime, lastValueUpdateTime;

		;(function() {
			ring = new Ring();
			lastByteStats = lastPacketStats = -1;
			currentRate = lastCurrentRate = 0;
			invalid = false;
			lastUpdateTime = lastValueUpdateTime = performance.now();
		})();
		
		this.init1 = function(iparent, itype, iqdiscID, iclassID, ischeduler) {
			parent = iparent;
			type = itype;
			qdiscID = iqdiscID;
			classID = iclassID;
			scheduler = ischeduler;
			interfac = iparent.getInterface();
		}
		
		this.init2 = function(preTcObject) {
			ring.init(self, preTcObject==null ? null : preTcObject.getRing());
			self.setUpdated();
		}
		
		this.getParent = function() {
			return parent;
		}
		
		this.getInterface = function() {
			return interfac;
		}

		this.getComment = function() {
			return interfac.getComment(qdiscID,classID);
		}

		this.getDescriptor = function() {
			return (type==1 ? "class " : "qdisc ")+scheduler+" "+qdiscID+":"+classID;
		}
		
		this.getInterfaceRenderer = function() {
			return interfac.getRenderer();
		}
		
		this.getType = function() {
			return type;
		}
		
		this.getQdiscID = function() {
			return qdiscID;
		}
		
		this.getClassID = function() {
			return classID;
		}
		
		this.getScheduler = function() {
			return scheduler;
		}
		
		this.getRing = function() {
			return ring;
		}
		
		this.getRate = function() {
			return parent.getCeil();
		}
		
		this.getCeil = function() {
			return self.getRate();
		}

		this.getSortingRate = function() {
			return self.getCeil();
		}
		
		this.hasCeil = function() {
			return false;
		}
		
		this.isInvalid = function() {
			return invalid;
		}
		
		this.getCurrentRate = function() {
			return currentRate;
		}
		
		this.getLastCurrentRate = function() {
			return lastCurrentRate;
		}
		
		this.getLastUpdateTime = function() {
			return lastUpdateTime;
		}
		
		this.getLastValueUpdateTime = function() {
			return lastValueUpdateTime;
		}

		this.getByteStats = function() {
			return lastByteStats;
		}

		this.getPacketStats = function() {
			return lastPacketStats;
		}

		this.changeComment = function() {
			commentEditor.initChange(self);
		}

		this.setComment = function(head,body) {
			interfac.setComment(qdiscID,classID,head,body);
		}
		
		var _invalidate = this.invalidate;
		this.invalidate = function() {
			invalid = true;
			_invalidate();
		}
		
		this.setUpdated = function(time) {
			parent.getRing().setChildrenNeedUpdate();
			lastUpdateTime = time;
		}
		
		this.updateValues = function(time, newByteStats, newPacketStats) {
			lastCurrentRate = currentRate;
			if(lastByteStats!=-1) {
				currentRate = (newByteStats-lastByteStats)*8*1000/(time-lastValueUpdateTime);
			}
			lastByteStats = newByteStats;
			lastPacketStats = newPacketStats;
			lastValueUpdateTime = time;
			invalid = false;
		}

		var _findChild = this.findChild;
		this.findChild = function(childQdiscID, childClassID) {
			if(qdiscID==childQdiscID && classID==childClassID) return self;
			return _findChild(childQdiscID, childClassID);
		}
	}
	TcObject.prototype = Object.create(TcObjectPrototype);
	TcObject.prototype.constructor = TcObject;


	function HtbObject() {
		TcObject.call(this);
		var self = this;
		var rate, ceil;
		
		this.getRate = function() {
			return rate;
		}
		
		this.getCeil = function() {
			return ceil;
		}
		
		this.hasCeil = function() {
			return ceil>rate;
		}
		
		var _updateValues = this.updateValues;
		this.updateValues = function(time, newByteStats, newPacketStats, newRate, newCeil) {
			_updateValues(time, newByteStats, newPacketStats);
			if(rate!=newRate || ceil!=newCeil) {
				rate = newRate;
				ceil = newCeil;
				self.setUpdated(time);
			}
		}
	}
	HtbObject.prototype = Object.create(TcObject);
	HtbObject.prototype.constructor = HtbObject;


	function InterfaceRenderer(interfac) {
		var particles, warningAnimTime;
		
		;(function() {
			particles = [];
			warningAnimTime = 0;
		})();
		
		this.getParticles = function() {
			return particles;
		}
		
		var recurRing = function(tcObject, callback) {
			var children = tcObject.getChildren();
			for(var i=0; i<children.length; i++) {
				if(callback(children[i].getRing())) {
					children.splice(i--,1);
				} else {
					recurRing(children[i],callback);
				}
			}
		}
		
		var prepareRings = function(time, timediff) {
			recurRing(interfac.getDev(), function(ring) {
				return ring.prepareFrame(time, timediff);
			});
		}
		
		var renderParticles = function(ctx, time, timediff) {
			ctx.globalCompositeOperation = "lighter";
			for(var i=0; i<particles.length; i++) {
				if(particles[i].draw(ctx, time, timediff)) {
					particles.splice(i--, 1);
				}
			}
		}
		
		var renderRings = function(ctx, time, timediff) {
			ctx.globalCompositeOperation = "source-over";
			
			// draw warnings
			warningAnimTime+= timediff;
			while(warningAnimTime > config.ring.warningAnimationInterval) warningAnimTime-= config.ring.warningAnimationInterval;
			if(warningAnimTime < config.ring.warningAnimationDuration) {
				ctx.strokeStyle=config.ring.warningColor.toRgbCss();
				ctx.lineWidth = 5;
				ctx.lineJoin = "round";
				recurRing(interfac.getDev(), function(ring) {
					ring.drawWarning(ctx);
					return false;
				});
			}
			
			// draw rings
			ctx.lineWidth = 1;
			ctx.lineJoin = "miter";
			recurRing(interfac.getDev(), function(ring) {
				ring.drawRing(ctx);
				return false;
			});
		}
		
		this.render = function(ctx, time, timediff) {
			prepareRings(time, timediff);
			renderParticles(ctx, time, timediff);
			renderRings(ctx, time, timediff);
		}
		
	}

	function InterfaceSelector(list, interfac) {
		var self = this;
		var interfaceDiv, nameDiv, currentThroughputDiv, throughputValueDiv, dummyMaxTpDiv, highlightDiv, dummyNameDiv, dummyCurrentThroughputDiv, speedContainerDiv, maxTpDiv, speedHightlightDiv;
		
		;(function() {
			interfaceDiv = $('<div class="ifselector">').css("z-index",20000-interfac.getIndex());
			nameDiv = $('<div>').text(interfac.getName()).appendTo(interfaceDiv);
			currentThroughputDiv = $('<div>').append($('<div class="invis">333.33 MBit/s</div>')).appendTo(interfaceDiv);
			throughputValueDiv = $('<div>').text('0 Bit/s').appendTo(currentThroughputDiv);
			dummyMaxTpDiv = $('<div>').appendTo(interfaceDiv).text(interfac.getThroughput().toText);
			highlightDiv = $('<div>').css("background-color",interfac.getColor(0).toRgbCss()).appendTo(interfaceDiv);
			dummyNameDiv = $('<div>').text(interfac.getName()).appendTo(highlightDiv);
			dummyCurrentThroughputDiv = $('<div>').text('0 Bit/s').appendTo(highlightDiv);
			speedContainerDiv = $('<div>').appendTo(highlightDiv);
			maxTpDiv = $('<div>').appendTo(speedContainerDiv).text(interfac.getThroughput().toText);
			speedHightlightDiv = $('<div>').css("background-color",interfac.getColor(1).toRgbCss()).appendTo(speedContainerDiv);
			list.add(interfaceDiv);
		})();
		
		this.getOffset = function() {
			return interfaceDiv.position().left+interfaceDiv.outerWidth(true)/2;
		}

		this.setCurrentThroughput = function(throughputSpeed) {
			var txt = throughputSpeed.toText();
			throughputValueDiv.text(txt);
		}
		
		this.setMaxThroughput = function(throughputSpeed) {
			var txt = throughputSpeed.toText();
			dummyMaxTpDiv.text(txt);
			maxTpDiv.text(txt);
		}
		
		this.setInactive = function() {
			highlightDiv.stop(true).animate({height:"0%"},{duration:config.selector.selectAnimationDuration,easing:config.selector.selectAnimationEasingFunction});
			speedContainerDiv.unbind("mouseenter").unbind("mouseleave").unbind("click");
		}
		
		this.setActive = function() {
			var init = list.getCurrentSelector()==null;
			if(init) {
				interfaceDiv.css("visibility","visible").css("top",-interfaceDiv.height()).animate({top:"0px"},{duration:config.selector.selectAnimationDuration,easing:config.selector.selectAnimationEasingFunction});
				highlightDiv.animate({height:"150%"},{duration:config.selector.selectAnimationDuration,easing:config.selector.selectAnimationEasingFunction});
				interfaceDiv.mouseenter(enterActive);
				list.initContainer(self.getOffset());
			} else {
				list.getCurrentSelector().setInactive();
			}
			speedContainerDiv.mouseenter(function() {
				speedHightlightDiv.stop(true).animate({width:"100%"},{duration:config.selector.selectAnimationDuration,easing:config.selector.selectAnimationEasingFunction});
			}).mouseleave(function() {
				speedHightlightDiv.stop(true).animate({width:"0%"},{duration:config.selector.selectAnimationDuration,easing:config.selector.selectAnimationEasingFunction});
			}).click(function() {
				list.getThroughputChangeGui().initChange(interfac);
			});
		}
		
		var enterActive = function() {
			interfaceDiv.unbind("mouseenter");
			list.show();
		}
		
		this.show = function() {
			if(interfaceDiv.css("visibility")!="visible") {
				interfaceDiv.css("visibility","visible").css("top",-list.getHeight());
			}
			interfaceDiv.stop(true).delay(config.selector.showAnimationDurationOffset*interfaceDiv.index()).animate({top:"0px"},{duration:config.selector.showAnimationDuration,easing:config.selector.showAnimationEasingFunction});
			interfaceDiv.mouseenter(function() {
				highlightDiv.stop(true).animate({height:"150%"},{duration:config.selector.selectAnimationDuration,easing:config.selector.selectAnimationEasingFunction});
			}).mouseleave(function() {
				highlightDiv.stop(true).animate({height:(interfac.isSelected() ? "100%" : "0%")},{duration:config.selector.selectAnimationDuration,easing:config.selector.selectAnimationEasingFunction});
			}).click(function() {
				interfac.select();
			});
		}
		
		this.removeActivationHooks = function() {
			interfaceDiv.unbind("mouseenter").unbind("mouseleave").unbind("click");
		}
		
		this.hide = function() {
			var cnt = list.getCount();
			if(interfac.isSelected()) {
				highlightDiv.stop(true).animate({height:"150%"},{duration:config.selector.selectAnimationDuration,easing:config.selector.selectAnimationEasingFunction});
				interfaceDiv.stop(true).delay(config.selector.showAnimationDurationOffset*cnt).animate({top:-interfaceDiv.position().top},{duration:config.selector.showAnimationDuration,easing:config.selector.showAnimationEasingFunction});
				interfaceDiv.mouseenter(enterActive);
			} else {
				interfaceDiv.delay(config.selector.showAnimationDurationOffset*(cnt-interfac.getIndex())).animate({top:-list.getHeight()},{duration:config.selector.showAnimationDuration,easing:config.selector.showAnimationEasingFunction,complete:function() {
					interfaceDiv.css("visibility","hidden");
				}})
			}
		}
	}

	function Interface(list,index,name,link,throughput,comments) {
		var self = this;
		var dev, renderer, selector, colors;
		var lastTxBytes, lastTxUpdateTime, lastUpdateTime;
		
		this.getIndex = function() {
			return index;
		}
		
		this.getName = function() {
			return name;
		}
		
		this.getLink = function() {
			return link;
		}
		
		this.getThroughput = function() {
			return throughput;
		}
		
		this.getThroughputRaw = function() {
			return throughput.getValue();
		}

		this.getComment = function(qdiscID, classID) {
			return comments[qdiscID+":"+classID];
		}

		this.setComment = function(qdiscID, classID, head, body) {
			var objID = qdiscID+":"+classID;
			comments[objID] = [head, body];
			jQuery.post("warpgate.php?op=4&dev="+name+"&obj="+objID, {head:head,body:body});
		}
		
		this.setMaxThroughput = function(newThroughput) {
			throughput = newThroughput;
			dev.getRing().setChildrenNeedUpdate();
			selector.setMaxThroughput(newThroughput);
			jQuery.getJSON("warpgate.php?op=3&dev="+name+"&tp="+newThroughput.getValue());
		}
		
		this.getDev = function() {
			return dev;
		}
		
		this.getRenderer = function() {
			return renderer;
		}
		
		this.getSelector = function() {
			return selector;
		}
		
		this.getColor = function(colorType) {
			return colors[colorType];
		}
		
		this.isSelected = function() {
			return list.getSelectedInterface()==self;
		}
		
		this.select = function() {
			if(!self.isSelected()) {
				selector.setActive();
				list.setSelectedInterface(self);
			}
		}

		this.getLastTxBytes = function() {
			return lastTxBytes;
		}

		this.updateTxBytes = function(txBytes, time) {
			if(lastTxBytes!=-1) {
				var diff = (txBytes-lastTxBytes)/(time-lastTxUpdateTime)*1000;
				var tpSpeed = NetworkSpeed.byValue(diff*8);
				selector.setCurrentThroughput(tpSpeed);
			}
			lastTxBytes = txBytes;
			lastTxUpdateTime = time;
		}
		
		this.prepareUpdate = function() {
			dev.invalidate();
		}
		
		this.finishUpdate = function(time) {
			dev.getRing().updateAllChildren();
			lastUpdateTime = time;
		}
		
		this.getLastUpdateTime = function() {
			return lastUpdateTime;
		}
		
		;(function() {
			colors = list.getColorGenerator().generateScheme();
			dev = new DevObject(self);
			renderer = new InterfaceRenderer(self);
			selector = new InterfaceSelector(list.getSelectorList(), self);
			lastUpdateTime = -config.load.missingUpdateAnimationDelay;
			lastTxBytes = -1;
		})();
		
	}

	function InterfaceSelectorList(interfaceList) {
		var self = this;
		var tpChangeGui, container, timeout;
		
		;(function() {
			tpChangeGui = new ThroughputChangeGui();
			container = $("div#ifarea").children();
			timeout = null;
		})();
		
		this.getThroughputChangeGui = function() {
			return tpChangeGui;
		}
		
		this.add = function(selectorDiv) {
			container.append(selectorDiv);
		}
		
		this.getHeight = function() {
			return container.height();
		}
		
		this.getCount = function() {
			return interfaceList.getCount();
		}
		
		this.getCurrentSelector = function() {
			var intf = interfaceList.getSelectedInterface();
			if(intf) return intf.getSelector();
			else return null;
		}
		
		this.initContainer = function(offset) {
			container.css("left",(-offset)+"px");
		}
		
		this.show = function() {
			var interfaces = interfaceList.getInterfaces();
			for(var i=0; i<interfaces.length; i++) {
				interfaces[i].getSelector().show();
			}
			container.mouseleave(leave);
		}
		
		var leave = function() {
			if(timeout==null) {
				container.unbind("mouseleave").mouseenter(enter);
				timeout = setTimeout(hide, config.selector.hideDelay);
			}
		}
			
		var enter = function() {
			if(timeout!=null) {
				clearTimeout(timeout);
				timeout = null;
				container.unbind("mouseenter").mouseleave(leave);
			}
		}
		
		var hide = function() {
			timeout = null;
			container.unbind("mouseenter");
			var interfaces = interfaceList.getInterfaces();
			for(var i=0; i<interfaces.length; i++) {
				interfaces[i].getSelector().removeActivationHooks();
			}
			container.animate({left:(-self.getCurrentSelector().getOffset())+"px"},{duration:config.selector.moveAnimationDuration,easing:config.selector.moveAnimationEasingFunction,complete:hideInterfaces});
		}
		
		var hideInterfaces = function() {
			var interfaces = interfaceList.getInterfaces();
			for(var i=0; i<interfaces.length; i++) {
				interfaces[i].getSelector().hide();
			}
		}

	}

	function ColorGenerator() {
		var colorPrng, colorIndex, lastHue;
		
		;(function() {
			colorPrng = new RNG(config.color.prngSeed);
			colorIndex = 0;
			lastHue = 0;
		})();
		
		this.generateScheme = function() {
			if(config.color.predefinedHues.length > colorIndex) {
				lastHue = config.color.predefinedHues[colorIndex];
			} else {
				lastHue+= config.color.hueChangeMin + (config.color.hueChangeMax-config.color.hueChangeMin)*colorPrng.random();
			}
			colorIndex++;
			var color = config.color.defaultParams.copy().addHue(lastHue);
			return [color, color.copy().addColor(config.color.altOffsetParams), color.copy().addColor(config.color.ceilOffsetParams)];
		}
	}

	function InterfaceList() {
		var self = this;
		var selectorList, interfaces, colorGen;
		var selectedInterface;
		
		;(function() {
			selectorList = new InterfaceSelectorList(self);
			interfaces = [];
			colorGen = new ColorGenerator();
			selectedInterface = null;
		})();
		
		this.getInterfaces = function() {
			return interfaces;
		}
		
		this.getSelectedInterface = function() {
			return selectedInterface;
		}
		
		this.setSelectedInterface = function(interfac) {
			selectedInterface = interfac;
		}
		
		this.getCount = function() {
			return interfaces.length;
		}
		
		this.getSelectorList = function() {
			return selectorList;
		}
		
		this.getColorGenerator = function() {
			return colorGen;
		}
		
		this.addInterface = function(name, link, throughputBits, comments) {
			var throughput = NetworkSpeed.byValue(throughputBits);
			var interfac = new Interface(self, interfaces.length, name, link, throughput, comments);
			interfaces.push(interfac);
			if(interfaces.length==1) {
				interfac.select();
			}
			return interfac;
		}
		
		this.getInterface = function(name) {
			for(var i=0; i<interfaces.length; i++) {
				if(interfaces[i].getName()==name) {
					return interfaces[i];
				}
			}
			return null;
		}
	}

	function DetailDisplay() {
		var self = this;
		var displayDiv, head, body;
		var commentDiv;
		var normalTable, ctBitDiv, ctByteDiv, byteStatDiv, byteStatUnitDiv, packetStatDiv, packetStatUnitDiv;
		var rateTable, rateDiv, ceilDiv, ratePercDiv, ceilPercDiv, htbDivisorDiv, rateDivisorDiv, ceilDivisorDiv;
		var currentTcObject, currentComment;
		var updated = 0;

		;(function() {
			displayDiv = $("div#detailbox");
			head = displayDiv.children().first();
			body = displayDiv.children().last();
			currentTcObject = null;

			commentDiv = $('<div>').css("margin","5px");

			normalTable = $('<table><tr><td>current throughput:</td><td><div class="invis">333.33 MBit/s+</div></td><td><div class="invis">(333.33 Byte/s+)</div></td></tr>'+
				'<tr><td>bytes sent:</td><td></td><td></td></tr><tr><td>packets sent:</td><td></td><td></td></tr></table>');
			ctBitDiv = $('<div>').appendTo(normalTable.find('tr:first-child').children('td:nth-child(2)'));
			ctByteDiv = $('<div>').appendTo(normalTable.find('tr:first-child').children('td:last-child'));
			byteStatDiv = $('<div>').appendTo(normalTable.find('tr:nth-child(2)').children('td:nth-child(2)'));
			byteStatUnitDiv = $('<div>').appendTo(normalTable.find('tr:nth-child(2)').children('td:last-child'));
			packetStatDiv = $('<div>').appendTo(normalTable.find('tr:nth-child(3)').children('td:nth-child(2)'));
			packetStatUnitDiv = $('<div>').appendTo(normalTable.find('tr:nth-child(3)').children('td:last-child'));

			rateTable = $('<table><tr><td></td><td><div class="invis">(100%)</div></td><td width="100%">&nbsp;</td><td align="right"><div class="invis">(100%)</div></td><td></td></table>');
			rateDiv = $('<div>').appendTo(rateTable.find('tr').children('td:first-child'));
			ratePercDiv = $('<div>').appendTo(rateTable.find('tr').children('td:nth-child(2)'));
			ceilPercDiv = $('<div>').appendTo(rateTable.find('tr').children('td:nth-child(4)'));
			ceilDiv = $('<div>').appendTo(rateTable.find('tr').children('td:nth-child(5)'));

			htbDivisorDiv = $('<div class="ratedivisor">');
			rateDivisorDiv = $('<div>').appendTo(htbDivisorDiv);
			ceilDivisorDiv = $('<div>').appendTo(htbDivisorDiv);
		})();

		var updateHead = function() {
			var text = currentTcObject.getDescriptor();
			if(currentComment && currentComment[0]!="") text+= " ("+currentComment[0]+")";
			head.text(text);
		}

		var updateBody = function() {
			var speed = NetworkSpeed.byValue(currentTcObject.getCurrentRate());
			var byteStats = NetworkSpeed.byValue(currentTcObject.getByteStats());
			var packetStats = NetworkSpeed.byValue(currentTcObject.getPacketStats());

			if(currentComment) {
				commentDiv.text(currentComment[1]);
				commentDiv.html(commentDiv.html().split("\n").join("<br/>"));
			}

			ctBitDiv.text(speed.toText());
			ctByteDiv.text('('+speed.getMultiplied(1/8).toText("Byte/s","B/s")+')');
			byteStatDiv.text(byteStats.getValue()+' bytes');
			byteStatUnitDiv.text('('+byteStats.toText("Bytes","B")+')');
			packetStatDiv.text(packetStats.getValue()+' packets');
			packetStatUnitDiv.text('('+packetStats.toText("packets"," packets")+')');

			if(currentTcObject instanceof HtbObject) {
				rateDiv.text('rate: '+NetworkSpeed.byValue(currentTcObject.getRate()).toText());
				ceilDiv.text(NetworkSpeed.byValue(currentTcObject.getCeil()).toText()+' :ceil');
				ratePercDiv.text('('+((Math.min(1,currentTcObject.getCurrentRate()/currentTcObject.getRate())*100)<<0)+'%)');
				ceilPercDiv.text('('+((Math.min(1,currentTcObject.getCurrentRate()/currentTcObject.getCeil())*100)<<0)+'%)');
				
				var perc = (currentTcObject.getRate()/currentTcObject.getCeil()*100) << 0;
				rateDivisorDiv.css("width",perc+"%");
				ceilDivisorDiv.css("width",(100-perc)+"%");
			} else {
				rateDiv.text('implicit rate: '+NetworkSpeed.byValue(currentTcObject.getRate()).toText());
				ratePercDiv.text('('+((Math.min(1,currentTcObject.getCurrentRate()/currentTcObject.getRate())*100)<<0)+'%)');
				ceilDiv.text('');
				ceilPercDiv.text('');
			}
		}

		this.show = function(tcObject, pos) {
			displayDiv.css({left:pos.x+16,top:pos.y+8});
			updated = 2;
			if(tcObject==currentTcObject) return;
			currentTcObject = tcObject;
			currentComment = tcObject.getComment();

			body.empty();

			head.add(body).css("background-color",tcObject.getInterface().getColor(tcObject.getType()).toRgbCss());
			if(currentTcObject instanceof HtbObject) {
				rateDivisorDiv.css("background-color",currentTcObject.getInterface().getColor(1-currentTcObject.getType()).toRgbCss());
				ceilDivisorDiv.css("background-color",currentTcObject.getInterface().getColor(2).toRgbCss());
			}
			updateHead();
			updateBody();

			if(currentComment && currentComment[1]!="") body.append(commentDiv);
			body.append(normalTable, rateTable);
			if(currentTcObject instanceof HtbObject) body.append(htbDivisorDiv);
			displayDiv.show();
		}

		this.update = function() {
			if(currentTcObject!=null) {
				updateBody();
			}
		}

		this.updateComment = function(tcObject, newComment) {
			if(tcObject==currentTcObject) {
				if(!currentComment || currentComment[1]=="") body.prepend(commentDiv);
				currentComment = newComment;
				updateHead();
				updateBody();
			}
		}

		this.fin = function() {
			if(updated==1) {
				displayDiv.hide();
				currentTcObject = null;
				updated = 0;
			} else if(updated==2) {
				updated = 1;
			}
		}

	}

	function GlobalRenderer(interfaceList) {
		var self=this;
		var viewport, canvas, ctx;
		var loadAnimStartTime, lastRenderTime;
		var lastTranslationX, lastTranslationY, currentTranslationX, currentTranslationY;
		var lastScale, currentScale;
		var lastMovePos, wasDragged, justClicked, justDoubleClicked;
		var W,H,mousePos;
		
		this.getCenterX = function() {
			return W/2;
		}
		
		this.getCenterY = function() {
			return H/2;
		}

		this.getMousePos = function() {
			return mousePos;
		}

		this.wasJustClicked = function() {
			return justClicked;
		}

		this.wasJustDoubleClicked = function() {
			return justDoubleClicked;
		}
		
		var interpolateLoadAnimation = function(time, index, num) {
			var phaseLength = 150;
			var iterationLength = phaseLength*(2+num);
			var tdiff = time-loadAnimStartTime-phaseLength*index;
			while(tdiff<0) tdiff+= iterationLength;
			while(tdiff>iterationLength) tdiff-= iterationLength;
			if(tdiff<phaseLength) {
				return jQuery.easing[config.load.animationEasingFunction](null, tdiff, 0, 1, phaseLength);
			} else if(tdiff<2*phaseLength) {
				return 1;
			} else if(tdiff<3*phaseLength) {
				return 1-jQuery.easing[config.load.animationEasingFunction](null, tdiff-2*phaseLength, 0, 1, phaseLength);
			} else {
				return 0;
			}
		}

		var draw = function(time) {
			// time
			var timediff = time-lastRenderTime;
			lastRenderTime = time;

			// reverse transforms
			ctx.scale(1/lastScale,1/lastScale);
			ctx.translate(-lastTranslationX,-lastTranslationY);
			
			// fade-away-overlay (dat rhyme)
			ctx.globalCompositeOperation = "source-over";
			ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
			ctx.fillRect(0, 0, W, H);
			
			// transform
			ctx.translate(currentTranslationX,currentTranslationY);
			ctx.scale(currentScale,currentScale);
			lastTranslationX = currentTranslationX;
			lastTranslationY = currentTranslationY;
			lastScale = currentScale;

			// draw interface
			var currentInterface = interfaceList.getSelectedInterface();
			if(currentInterface) {
				currentInterface.getRenderer().render(ctx, time,timediff);
			}
			
			// draw load animation
			if(currentInterface==null || (time-currentInterface.getLastUpdateTime() > config.load.missingUpdateAnimationDelay)) {
				ctx.globalCompositeOperation = "source-over";
				ctx.fillStyle = config.load.animationColor.toRgbCss();
				var cnt = config.load.animationBarCount;
				for(var i=0; i<cnt; i++) {
					var im = i-(cnt-1)/2;
					var progress = interpolateLoadAnimation(time, i, cnt)*(30-30*Math.abs(im)/cnt);
					ctx.fillRect(W/2-5+im*15,H/2-20-progress,10,20+progress);
				}
			}
			
			detailDisplay.fin();
			justClicked = false;
			justDoubleClicked = false;
			window.requestAnimationFrame(draw);
		}
		
		var getPos = function(event,obj) {
			var x,y;
			if (event.x != undefined && event.y != undefined)
			{
			  x = event.x;
			  y = event.y;
			}
			else // Firefox method to get the position
			{
			  x = event.clientX;
			  y = event.clientY;
			}
			x -= obj.offsetLeft;
			y -= obj.offsetTop;
			return {x:x,y:y};
		}
		
		var dragBegin = function(event) {
			if(event.which==1) {
				lastMovePos = getPos(event,canvas[0]);
				$(window).mousemove(dragDo).mouseup(dragEnd);
				wasDragged = false;
			}
		}
		
		var dragDo = function(event) {
			var pos = getPos(event,canvas[0]);
			var dx = pos.x-lastMovePos.x;
			var dy = pos.y-lastMovePos.y;
			currentTranslationX+= dx;
			currentTranslationY+= dy;
			lastMovePos = pos;
			wasDragged = true;
		}
		
		var dragEnd = function() {
			$(window).unbind("mousemove",dragDo).unbind("mouseup",dragEnd);
			if(!wasDragged) {
				justClicked = !justClicked;
			}
		}
		
		var zoom = function() {
			var top = $(window).scrollTop();
			var d = config.window.scrollMax-$(window).height();
			var scale = jQuery.easing.easeInCirc(null, d-top, config.window.scaleMin, config.window.scaleMax, d);
			currentTranslationX-= (scale-currentScale)*W/2;
			currentTranslationY-= (scale-currentScale)*H/2;
			currentScale = scale;
		}

		var updateMousePos = function(event) {
			mousePos = getPos(event,canvas[0]);
		}

		var onViewportResize = function() {
			W = viewport.width();
			H = viewport.height();
			canvas.attr("width",W).attr("height",H);
		}

		var onDoubleClick = function() {
			justDoubleClicked = true;
		}
		
		;(function() {
			lastTranslationX = lastTranslationY = currentTranslationX = currentTranslationY = 0;
			lastScale = currentScale = 1;
			loadAnimStartTime = lastRenderTime = performance.now();
			mousePos = {x:-1,y:-1};
			
			viewport = $("div#viewport");
			canvas = $("canvas");
			onViewportResize();
			ctx = canvas[0].getContext("2d");
			ctx.fillStyle = "rgb(0,0,0)";
			ctx.fillRect(0, 0, W, H);
			
			currentScale = config.window.scaleDefault;
			currentTranslationX = -(currentScale-1)*W/2;
			currentTranslationY = -(currentScale-1)*H/2;

			var d = config.window.scrollMax-$(window).height();
			var scr = Math.sqrt((1-Math.pow(1-(1-config.window.scaleMin)/config.window.scaleMax,2))*d*d);
			
			window.requestAnimationFrame(draw);
			canvas.mousedown(dragBegin).mousemove(updateMousePos).dblclick(onDoubleClick);
			$(window).scrollTop(d-scr).scroll(zoom).resize(onViewportResize);
		})();
	}

	function ThroughputChangeGui() {
		var tparea, tpvalue, tpunit, tphead, tptext;
		var changingInterface, enabled, queued;

		this.initChange = function(interfac) {
			if(changingInterface==null) {
				changingInterface = interfac;
				display();
			} else {
				if(enabled) cancel();
				changingInterface = interfac;
				queued = true;
			}
		}
		
		var display = function() {
			tparea.show().animate({opacity:1},{duration:config.editor.opacityAnimationDuration,easing:config.editor.opacityAnimationEasingFunction});
			enabled = true;
			var speed = changingInterface.getThroughput().getUnitValue();
			tpvalue.val(speed[0]);
			tpunit.val(speed[1]);
			tphead.text("edit "+changingInterface.getName()+" maximum throughput").css("background-color",changingInterface.getColor(1).toRgbCss());
			tptext.text("Please enter the maximum achievable throughput speed for "+changingInterface.getName()+":");
			tparea.css("border-color",changingInterface.getColor(1).toRgbCss());
			unitChanged();
		}

		var unitChanged = function() {
			var unit = tpunit.val();
			var maxRate = changingInterface.getLink();
			tpvalue.attr({min:0,max:maxRate/unit});
		}

		var cancel = function() {
			enabled = false;
			tparea.stop(true).animate({opacity:0},{duration:config.editor.opacityAnimationDuration,easing:config.editor.opacityAnimationEasingFunction,complete:cancelComplete});
		}
		
		var cancelComplete = function() {
			if(queued) {
				queued = false;
				display();
			} else {
				changingInterface = null;
				tparea.hide();
			}
		}

		var update = function() {
			if(enabled) {
				var speed = NetworkSpeed.byUnitValue(tpvalue.val(),tpunit.val());
				changingInterface.setMaxThroughput(speed);
				cancel();
			}
		}
		
		;(function() {
			tparea = $("#throughputarea");
			tpvalue = $("#tpvalue");
			tpunit = $("#tpunit");
			tphead = $("#tphead");
			tptext = $("#tptext");
			$("#tpform").submit(update);
			$("#tpcancel").click(cancel);
			tpunit.change(unitChanged);
			changingInterface = null;
			enabled = false;
			queued = false;
		})();
		
	}

	function CommentEditor() {
		var careaDiv, cheadDiv, chead, cbody;
		var changingObject, enabled, queued;

		this.initChange = function(obj) {
			if(changingObject==null) {
				changingObject = obj;
				display();
			} else {
				if(enabled) cancel();
				changingObject = obj;
				queued = true;
			}
		}
		
		var display = function() {
			careaDiv.show().animate({opacity:1},{duration:config.editor.opacityAnimationDuration,easing:config.editor.opacityAnimationEasingFunction});
			enabled = true;
			var comment = changingObject.getComment();
			if(!comment) comment = ["",""];
			chead.val(comment[0]);
			cbody.val(comment[1]);
			var color = changingObject.getInterface().getColor(changingObject.getType()).toRgbCss();
			cheadDiv.text("edit comment of "+changingObject.getDescriptor()).css("background-color",color);
			careaDiv.css("border-color",color);
		}

		var cancel = function() {
			enabled = false;
			careaDiv.stop(true).animate({opacity:0},{duration:config.editor.opacityAnimationDuration,easing:config.editor.opacityAnimationEasingFunction,complete:cancelComplete});
		}
		
		var cancelComplete = function() {
			if(queued) {
				queued = false;
				display();
			} else {
				changingObject = null;
				careaDiv.hide();
			}
		}

		var update = function() {
			if(enabled) {
				var head = chead.val();
				var body = cbody.val();
				changingObject.setComment(head,body);
				detailDisplay.updateComment(changingObject, [head,body]);
				cancel();
			}
		}
		
		;(function() {
			careaDiv = $("#commenteditor");
			cheadDiv = $("#chead1");
			chead = $("#chead");
			cbody = $("#cbody");
			$("#cform").submit(update);
			$("#ccancel").click(cancel);
			changingObject = null;
			enabled = false;
			queued = false;
		})();
		
	}
	
	function DataAggregator(interfaceList) {
	
		var refreshData = function() {
			var currentInterface = interfaceList.getSelectedInterface();
			if(currentInterface) {
				jQuery.getJSON("warpgate.php?op=2&dev="+currentInterface.getName(),onDataReceive);
				//jQuery.getJSON(currentInterface.getName()+".json",onDataReceive);
			}
		}

		var onDataReceive = function(data) {
			var diParentQdiscID = 0;
			var diParentClassID = 1;
			var diType = 2;
			var diScheduler = 3;
			var diQdiscID = 4;
			var diClassID = 5;
			var diByteStats = 6;
			var diPacketStats = 7;
			var diHTBRate = 8;
			var diHTBCeil = 9;

			var time = performance.now();

			var interfaces = interfaceList.getInterfaces();
			for (var i = interfaces.length - 1; i >= 0; i--) {
				var name = interfaces[i].getName();
				if(data.intstats[name]) {
					interfaces[i].updateTxBytes(data.intstats[name], time);
				} else {
					interfaces[i].updateTxBytes(interfaces[i].getLastTxBytes(), time);
				}
			};
			
			var dataInterface = interfaceList.getInterface(data.dev);
			if(dataInterface==null) {
				//console.log("update failed: interface "+data.dev+" not found.");
				return;
			}
			
			dataInterface.prepareUpdate();
			var dev = dataInterface.getDev();
			
			for(var i=0; i<data.objects.length; i++) {
				var childData = data.objects[i];
				var parent = dev.findChild(childData[diParentQdiscID], childData[diParentClassID]);
				if(parent==null) {
					//console.log("update partially failed: parent "+childData[diParentQdiscID]+":"+childData[diParentClassID]+" of "+childData[diQdiscID]+":"+childData[diClassID]+" not found");
				} else {
					var childClass = TcObjectPrototype.getClass(childData[diType],childData[diScheduler]);
					var child = parent.getOrCreateChild(childClass, childData[diType], childData[diQdiscID], childData[diClassID], childData[diScheduler]);
					if(childClass==HtbObject) {
						child.updateValues(time, childData[diByteStats], childData[diPacketStats], childData[diHTBRate], childData[diHTBCeil]);
					} else {
						child.updateValues(time, childData[diByteStats], childData[diPacketStats]);
					}
				}
			}
			
			dataInterface.finishUpdate(time);
			detailDisplay.update();
		}

		var loadInterfaces = function() {
			jQuery.getJSON("warpgate.php?op=1",onInterfacesReceive);
			//jQuery.getJSON("interfaces.json",onInterfacesReceive);
		}

		var onInterfacesReceive = function(data) {
			for(var i=0; i<data.length; i++) {
				interfaceList.addInterface(data[i].name, data[i].link, data[i].throughput, data[i].comments);
			}
			setInterval(refreshData, config.load.updateInterval);
		}
		
		;(function() {
			setTimeout(loadInterfaces, config.load.initDelay);
		})();
	}
	
	;(function() {
		var interfaceList = new InterfaceList();
		globalRenderer = new GlobalRenderer(interfaceList);
		detailDisplay = new DetailDisplay();
		commentEditor = new CommentEditor();
		new DataAggregator(interfaceList);
	})();

}

$(document).ready(Warpgate);
