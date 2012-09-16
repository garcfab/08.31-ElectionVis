categorical = {}
categorical.init = function () {
	
	var sel = d3.select("#categorical")
	var w = parseFloat(sel.style("width"))
	var h = parseFloat(sel.style("height"))

	var domains = {}
	var scales = {}
	mainDomains.forEach(function(e){
		var domain = d3.nest()
			.key(function(d){return d[e]})
			.rollup(function(d){
				return 0
			})
			.entries(data)
			.map(function(e){return e.key})
		var scale = d3.scale.ordinal().domain(domain).rangePoints([0+20,h-20], 1)
		domains[e] = domain
		scales[e] = scale
	})

	sel.selectAll("svg").remove()
	var svg = sel.append("svg")
		.attr({
			width: w, height: h
		})

	var linkW = 10;
	var columnW = (100 - 2*linkW)/3

	linkW = linkW*w/100
	columnW = columnW*w/100

	// Pole vars
	var pole = {}
	pole.w = 10
	pole.radius = pole.w/2
	
	// Pole Data
	var poles = columnData.map(function(e,i){
		return {
			x: (columnW/2) + (columnW + linkW)*i,
			nestType: e.nestType,
			filters: e.filters
		}
	})

	// DRAW
	d3.range(2).forEach(function(e,ei){
		svg.selectAll("path.p1").data(data)
			.enter().append("path")
			.attr({
				d: function(d,i){
					var nestType0 = poles[ei].nestType
					var nestType1 = poles[ei+1].nestType
					var x0 = poles[ei].x
					var y0 = scales[nestType0](d[nestType0])
					var x1 = poles[ei+1].x
					var y1 = scales[nestType1](d[nestType1])
					return "M"+x0+","+y0+" C"+((+x1-x0)/2+x0)+","+y0+" "
						+((+x1-x0)/2+x0)+","+y1+" "+x1+","+y1
				},
				stroke: function(d,i){
					if (!poles[ei].filters) {return "gray"}
					var condition = poles[ei].filters.some(function(e){
						return (e.key==d[poles[ei].nestType])
					})	
					if (condition) {
						return "#434f5d"
					} else{
						return "gray"
					}
				}, 
				"stroke-width": 3, "stroke-opacity": function(d,i){
					if (!poles[ei].filters) {return .2}
					var condition = poles[ei].filters.some(function(e){
						return (e.key==d[poles[ei].nestType])
					})	
					if (condition) {
						return 1
					} else{
						return .1
					}
				},  fill: "none",
				// "shape-rendering": "geometric-precision"
			})
	})

	svg.selectAll("rect").data(poles)
		.enter().append("rect")
		.attr({
			x: function(d,i){
				return d.x -pole.w/2
			},
			y: 0, width: pole.w, height: h,
			rx: pole.radius, ry: pole.radius,
			fill: "black"
		})
		.each(function(dP,iP){
			var thisSel = d3.select(this)
			svg.append("g").selectAll("circle").data(domains[dP.nestType])
				.enter().append("circle")
				.attr({
					cx: dP.x, cy: function(d){return scales[dP.nestType](d)},
					r: 1,
					fill: function(d,i){
						// return colorS(i%9)
						return "white"
					}
				})
		})
}














