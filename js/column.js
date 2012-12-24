var fisheye = d3.fisheye.circular().radius(60).distortion(4);
var column = {}

column.init = function (sel) {
	if (sel.empty()) {return};

	/////////////////////////////////////////
	/////////////////////////////////////////
	//Get main vars
	var order = +sel.attr("order")
	var nestType = columnData[order].nestType

	var thisData = columnData[order].d

	//Filter data
	var d = d3.nest()
		.key(function(d){return d[nestType]})
		.rollup(function(d){
			return d3.sum(d, function(d){return d.value})
		})
		.entries(thisData)

	var dSum = d3.sum(d, function(d){return d.values})
	
	var w = parseFloat(sel.style("width"))
	var h = parseFloat(sel.style("height"))
	var yS = d3.scale.linear().range([0,h])
		.domain([0, dSum])
	var fontS = d3.scale.linear().range([15,0.1])
		.domain([25,0.1]).clamp(true)
	var percentS = d3.scale.linear().range([0,100])
		.domain([0,dSum])

	sortData()

	var sizeExtent = d.map( function(d){return d.y2 - d.y})
	if (sizeExtent.length < 2) {sizeExtent = [sizeExtent, sizeExtent]};
	var mouseDomain = d.map( function(d){return d.yText})
	if (mouseDomain.length < 2) {mouseDomain = [mouseDomain, mouseDomain]};

	var distortionS = d3.scale.linear().range([.01,1,3,6,25,50,250])
		.domain([30,25,10,5, 1,.5,.1]).clamp(true)
	var radiusS = d3.scale.linear().range([50,100])
		.domain([50, 0]).clamp(true)
	var sizeHS = d3.scale.linear().range(sizeExtent)
		.domain(mouseDomain).clamp(true)
	var opacityS = d3.scale.linear().range([1,.01])
		.domain([25,.5])


	/////////////////////////////////////////
	/////////////////////////////////////////
	// selOption
	var setSelections = function setSelections(){
		var selOption = d3.select(".select>.borderChart[id=s"+ (+order) +"]")
		if (selOption.select(".move").empty()) {
			var moveDivOption = selOption.append("div").attr("class", "move")
				.style({
					right: "100%"
				})
			moveDivOption.transition().delay(50)
				.style({
					right: "0%"
				})

			var selectionOption = moveDivOption.append("select")
			
			selectionOption.selectAll("option")
				.data(mainDomains)
				.enter()
				.append("option")
				.text(function(d){return d})
				.property("selected", function(d){
					if (d == nestType) {return true}
						else {return false}
				})

			selectionOption.on("change", function(){
				// var order = d3.select(this).attr("order")
				var nestType
				d3.select(this).selectAll("option")
					.each(function(e){
						var sel = d3.select(this)
						if (sel.property("selected")==true) {
							nestType = sel.text()
						}
					})
				columnData[order].nestType = nestType
				d3.select(".column>.borderChart#c"+ order).call(column.init)
				d3.select(".select2>.borderChart#s2"+order)
					.selectAll("option")
					.each(function(){
						var aSel = d3.select(this)
						if (aSel.text()==nestType) {
							aSel.property("selected", true)
						} else {aSel.property("selected", false)}
					})
			})
		}
	}()

	
	// Take this collumn out
	sel.selectAll(".move")
		.transition()
		.style({
			right: "-100%"
		})
		.remove()


	//Remove bigger columns, selections and links
	d3.selectAll(".column>.borderChart, .select>.borderChart")
		.each(function(){
			var sel = d3.select(this)
			var thisOrder = sel.attr("order")
			if (thisOrder>order) {
				columnData[thisOrder].d = []
				sel.select(".move")
					.transition()
					.style({
						right: "-100%"
					})
					.remove()
			}
		})

	d3.selectAll(".link")
		.each(function(){
			var sel = d3.select(this)
			if (sel.attr("order")>=order) {
				sel.call(link.remove)
			}
		})

	// MOVE DIV 
	var moveDiv = sel.append("div").attr("class", "move")
		.style({
			right: "100%"
		})
	moveDiv.transition().delay(50)
		.style({
			right: "0%"
		})
		.each("end", function(){categorical.init()})

	var svg = moveDiv.append("svg")
		.attr({
			width: w, height: h
		})

	// DEFS
	svg.append("defs")
		.append("clipPath").attr("id", "clip")
		.append("rect")
		.attr({
			x:0, y:0, width:w, height:h,
			rx:8, ry:8
		})
	svg = svg.append("g").attr("clip-path", "url(#clip)")


	/////////////////////////////////////////
	/////////////////////////////////////////
	/////////////////////////////////////////
	// STYLES
	nColor = 2
	cWhite = d3.hsl("white").darker(.05)
	c2 = d3.hsl(195,.3,.55).darker(.4)
	// cWhite = c2
	colorS = d3.scale.ordinal().range([cWhite, cWhite.darker(.2)])
		.domain(d3.range(nColor))
	colorS2 = d3.scale.ordinal().range([c2, c2.brighter(.4)])
		.domain(d3.range(nColor))


	var styles = (function setStyles (){
		var styles = {
			rect: {},
			text: {percent:{}, key:{}}
		}

		styles.rect["y"] = function(d){return d.y}
		styles.rect["height"] = function(d){return d.y2 - d.y}
		styles.rect["fill"] = function(d,i){
				if (!d.selected) {return colorS(i%nColor)} 
					else{
						return colorS2(i%nColor)
					}
			}

		styles.rect.initAttr = {
			x:0, width:w, 
			y: styles.rect["y"],
			height: styles.rect["height"]
		}
		styles.rect.updtAttr = {
			y: styles.rect["y"],
			height: styles.rect["height"]
		}
		styles.rect.updtAttrFish = {
			y:function(d){return d.fisheye.y},
			height:function(d){return d.fisheye2.y - d.fisheye.y}
		}

		styles.rect.initStyle = {
			fill: styles.rect["fill"],
			cursor: function(){
				if (order<2) {return "pointer"}
					else {return "default"}
			}
		}
		styles.rect.updtStyle = {
			fill: styles.rect["fill"]
		}
		//
		styles.text["y"] = function(d){return d.yText}
		styles.text["font-size"] = function(d){return fontS(d.y2 - d.y)}
		styles.text["fill"] = function(d,i){
				if (!d.selected) {return "black"} else {return "white"}	
			}

		styles.text.percent.init = {
				x:50, y: styles.text["y"], 
				dy:".35em",
				"font-size": styles.text["font-size"],
				fill: styles.text["fill"],

				"pointer-events": "none", 
				"text-anchor": "end",
				"font-weight": "bold"
			}
		styles.text.percent.updtFish = {
			y:function(d){return d.fisheyeText.y},
			"font-size": function(d){return fontS(d.fisheye2.y - d.fisheye.y)}
		}
		styles.text.updt = {
			y:styles.text["y"],
			"font-size": styles.text["font-size"],
			fill: styles.text["fill"]
		}


		//
		styles.text.key.init = {
				x:53, y:styles.text["y"], 
				dy:".35em",
				"font-size": styles.text["font-size"],
				fill: styles.text["fill"],
				"pointer-events": "none", 
				"text-anchor": "start"
			}
		styles.text.key.updtFish = {
			y:function(d){return d.fisheyeText.y},

			"font-size": function(d){return fontS(d.fisheye2.y - d.fisheye.y)},
			fill: styles.text["fill"]
		}

		return styles
	})()

	



	/////////////////////////////////////////
	/////////////////////////////////////////
	/////////////////////////////////////////
	// DRAW SVG
	var rect = svg.selectAll("rect.display").data(d, function(d){return d.key})
		.enter().append("rect")
		.attr("class", "display")
		.attr(styles.rect.initAttr)		////// STYLE
		.style(styles.rect.initStyle) 	////// STYLE

		.on("mouseover", function(d,i){
			var size = d.y2 - d.y
			var mouseY = d3.mouse(this)[1]
			size = sizeHS(mouseY)
			fisheye.distortion(distortionS(size))
			fisheye.radius(radiusS(size))
		})
		.on("click", function onRectClick(funcD,i){
			if (order<2) {
				d.forEach(function(e){
					if (e.key == funcD.key && !e.selected) {
						e.selected = true
					} else if (e.key == funcD.key && e.selected) {
						e.selected = false
					}
				})
				sortData()
				arrange()
				var filters = d.filter(function(e){
					if (e.selected) {return true}
						else {return false}
				})
				columnData[order].filters = filters

				columnData[order+1].d = thisData.filter(function(e){
					for (var i = filters.length - 1; i >= 0; i--) {
						if (e[nestType] == filters[i].key) {return true}		
					}
					return false
				})
				d3.select(".column>.borderChart[id=c"+ (+order+1) +"]").call(column.init)
				if (filters.length == 0) {
					d3.selectAll(".select>.borderChart#s"+ (+order+1))
						.select(".move")
							.transition()
							.style({
								right: "-100%"
							})
							.remove()
					d3.select(".link#l"+ (+order)).call(link.remove)
				} else {
					d3.select(".link#l"+ (+order)).call(link.init)
				}
			};
		})

	var text = svg.selectAll("text.percent").data(d, function(d){return d.key})
		.enter().append("text")
		.attr("class", "percent")
		.text(function(d){return d3.round(d.percent, 1)+ "%"})
		.attr(styles.text.percent.init)	////// STYLE

	 svg.selectAll("text.key").data(d, function(d){return d.key})
			.enter().append("text")
			.attr("class", "key")
			.text(function(d){return "| "+d.key})
			.attr(styles.text.key.init)	////// STYLE 

	svg
		.on("mousemove", function() {
			var mouse = d3.mouse(this)
			fisheye.focus(mouse)
			d.forEach(function(e,i){
				e.fisheye = fisheye({x:mouse[0], y:e.y})
				e.fisheye2 = fisheye({x:mouse[0], y:e.y2})
				e.fisheyeText = fisheye({x:mouse[0], y:e.yText})
			})

			svg.selectAll("rect.display").data(d, function(d){return d.key})
				.attr(styles.rect.updtAttrFish) 	////// STYLE
				.transition()

			svg.selectAll("text.percent").data(d, function(d){return d.key})
				.attr(styles.text.percent.updtFish) ////// STYLE
				.transition()

			svg.selectAll("text.key").data(d, function(d){return d.key})
				.attr(styles.text.key.updtFish)		////// STYLE
				.transition()

			svg.select("g").attr("clip-path", "none")
			svg.select("g").attr("clip-path", "url(#clip)")

		})
		.on("mouseout", function() {
			arrange()
		})


	function sortData () {
		var ySum = 1
		d.sort(function(a,b){
			if (a.selected && !b.selected) {
				return -1
			} else if (!a.selected && b.selected){
				return 1
			} else {
				return b.values - a.values
			}
		})
		d.forEach(function(e){
			e.y = ySum
			ySum += yS(e.values)
			e.y2 = ySum
			e.yText = (e.y + e.y2)/2
			e.percent = percentS(e.values)
			// e.selected = false
		})

		var sizeExtent = d.map( function(d){return d.y2 - d.y})
		if (sizeExtent.length < 2) {sizeExtent = [sizeExtent, sizeExtent]};
		var mouseDomain = d.map( function(d){return d.yText})
		if (mouseDomain.length < 2) {mouseDomain = [mouseDomain, mouseDomain]};

		sizeHS = d3.scale.linear().range(sizeExtent)
			.domain(mouseDomain).clamp(true)
	}
	function arrange () {
		svg.selectAll("rect.display").data(d, function(d){return d.key})
			.transition()
			.attr(styles.rect.updtAttr)		////// STYLE
			.style(styles.rect.updtStyle)	////// STYLE

		svg.selectAll("text.percent").data(d, function(d){return d.key})
			.transition()
			.attr(styles.text.updt)			////// STYLE

		svg.selectAll("text.key").data(d, function(d){return d.key})
			.transition()
			.attr(styles.text.updt)			////// STYLE

	}
}





