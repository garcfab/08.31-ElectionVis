var fisheye = d3.fisheye.circular().radius(60).distortion(4);
var nColor = 2

var column = {}
column.init = function (sel) {
	if (sel.empty()) {return};
	//Get main vars
	var order = +sel.attr("order")
	var nestType = columnData[order].nestType

	var thisData
	if (order == 0) {thisData = data}
		else {
			thisData = columnData[order-1].d

		}

	// selOption
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
		})
	}

	
	// Take this collumn out
	sel.selectAll(".move")
		.transition()
		.style({
			right: "-100%"
		})
		.remove()


	//Remove other columns, selections and links
	d3.selectAll(".column>.borderChart, .select>.borderChart")
		.each(function(){
			var sel = d3.select(this)
			if (sel.attr("order")>order) {
				sel.select(".move")
					.transition()
					.style({
						right: "-100%"
					})
					.remove()
			}
		})
	// d3.select(".link#l"+ (+order)).call(link.remove)
	d3.selectAll(".link")
		.each(function(){
			var sel = d3.select(this)
			if (sel.attr("order")>=order) {
				sel.call(link.remove)
			}
		})

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
		//.domain([0,data.length])

	// Sort DATA
	d.forEach(function(e){
		e.selected = false
	})
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
	colorS = d3.scale.ordinal().range(["white", "lightgray"])
		.domain(d3.range(nColor))
	colorS2 = d3.scale.ordinal().range(colorbrewer.YlOrBr[9])
		.domain(d3.range(nColor))
	var opacityS = d3.scale.linear().range([1,.01])
		.domain([25,.5])


	// MOVE DIV 
	var moveDiv = sel.append("div").attr("class", "move")
		.style({
			right: "100%"
		})
	moveDiv.transition().delay(50)
		.style({
			right: "0%"
		})
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
	// svg.append("rect").attr({
	// 	x:0, y:0, width:w, height:h, fill: "gray"
	// })
	svg = svg.append("g").attr("clip-path", "url(#clip)")

	// DRAW SVG
	var rect = svg.selectAll("rect.display").data(d, function(d){return d.key})
		.enter().append("rect")
		.attr("class", "display")
		.attr({
			x:0, y:function(d){return d.y},
			width:w, height:function(d){return d.y2 - d.y}
		})
		.style({
			stroke: function(d,i){
				return "none"//colorS(i%nColor)
			},"stroke-width": "1px",
			fill: function(d,i){
				return colorS(i%nColor)
			},
			cursor: function(){
				if (order<2) {return "pointer"}
					else {return "default"}
			}
		})
		.on("mouseover", function(d,i){
			var size = d.y2 - d.y
			var mouseY = d3.mouse(this)[1]
			size = sizeHS(mouseY)
			fisheye.distortion(distortionS(size))
			fisheye.radius(radiusS(size))
		})
		.on("click", function(funcD,i){
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

				columnData[order].d = thisData.filter(function(e){
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
				categorical.init()
			};
		})
	var text = svg.selectAll("text.percent").data(d, function(d){return d.key})
		.enter().append("text")
		.attr("class", "percent")
		.attr({
			x:50, y:function(d){return d.yText}, dy:".35em"
		})
		.text(function(d){return d3.round(d.percent, 1)+ "%"})
		.attr({
			stroke: "none",
			fill: function(d,i){
				return colorS(i+5%9)
			},
			"font-size": function(d){return fontS(d.y2 - d.y)},
			// "fill-opacity": function(d){return opacityS(d.y2 - d.y)},
			// "text-shadow": function(d,i){
				// return "-1px -1px 1px #bad1eb"
			// },
			"pointer-events": "none", 
			"text-anchor": "end",
			"font-weight": "bold"
		})
	 svg.selectAll("text.key").data(d, function(d){return d.key})
			.enter().append("text")
			.attr("class", "key")
			.attr({
				x:53, y:function(d){return d.yText}, dy:".35em"
			})
			.text(function(d){return "| "+d.key})
			.attr({
				stroke: "none",
				fill: function(d,i){
					return colorS(i+5%9)
				},
				"font-size": function(d){return fontS(d.y2 - d.y)},
				// "fill-opacity": function(d){return opacityS(d.y2 - d.y)},
				// "text-shadow": function(d,i){
					// return "-1px -1px 1px #bad1eb"
				// },
				"pointer-events": "none", 
				"text-anchor": "star"
				// "font-weight": "bold"
			})

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
				.attr({
					y:function(d){return d.fisheye.y},
					height:function(d){return d.fisheye2.y - d.fisheye.y}
				})
				.style({
					fill: function(d,i){
						if (!d.selected) {return colorS(i%nColor)} 
							else{
								//return colorS2(i%nColor)
								return "orange"
							};
						
					}
				}).transition()
			svg.selectAll("text.percent").data(d, function(d){return d.key})
				.attr({
					y:function(d){return d.fisheyeText.y}
				})
				.attr({
					"font-size": function(d){return fontS(d.fisheye2.y - d.fisheye.y)},
					// "fill-opacity": function(d){return opacityS(d.fisheye2.y - d.fisheye.y)},
					fill: function(d,i){
						if (!d.selected) {return "black"} 
							else{
								//return colorS2(i%nColor)
								return "white"
							};
						
					}
				})
				.transition()
			svg.selectAll("text.key").data(d, function(d){return d.key})
				.attr({
					y:function(d){return d.fisheyeText.y}
				})
				.attr({
					"font-size": function(d){return fontS(d.fisheye2.y - d.fisheye.y)},
					// "fill-opacity": function(d){return opacityS(d.fisheye2.y - d.fisheye.y)},
					fill: function(d,i){
						if (!d.selected) {return "black"} 
							else{
								//return colorS2(i%nColor)
								return "white"
							};
						
					}
				})
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
			.attr({
				y:function(d){return d.y},
				height:function(d){return d.y2 - d.y}
			})
			.style({
				fill: function(d,i){
					if (!d.selected) {return colorS(i%nColor)} 
						else{
							return "#434f5d"
						};
					
				}
			})
		svg.selectAll("text.percent").data(d, function(d){return d.key})
			.transition()
			.attr({
				y:function(d){return d.yText}
			})
			.attr({
				"font-size": function(d){return fontS(d.y2 - d.y)},
				// "fill-opacity": function(d){return opacityS(d.y2 - d.y)},
				fill: function(d,i){
					if (!d.selected) {return "black"} 
						else{
							//return colorS2(i%nColor)
							return "white"
						};
					
				}
			})
		svg.selectAll("text.key").data(d, function(d){return d.key})
			.transition()
			.attr({
				y:function(d){return d.yText}
			})
			.attr({
				"font-size": function(d){return fontS(d.y2 - d.y)},
				// "fill-opacity": function(d){return opacityS(d.y2 - d.y)},
				fill: function(d,i){
					if (!d.selected) {return "black"} 
						else{
							//return colorS2(i%nColor)
							return "white"
						};
					
				}
			})
		svg.select("g").attr("clip-path", "none")
		svg.select("g").attr("clip-path", "url(#clip)")
	}
}





